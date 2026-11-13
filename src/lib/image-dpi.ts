/**
 * 이미지 DPI(인쇄 해상도) 정보만 바꾼다. 픽셀은 한 개도 건드리지 않는다(재압축 없음).
 * - JPEG: JFIF APP0 의 밀도 값, EXIF IFD0 의 XResolution·YResolution·ResolutionUnit
 * - PNG: pHYs 청크(미터당 픽셀)
 */
export type DpiFormat = 'jpeg' | 'png';

export const DPI_MIN = 1;
export const DPI_MAX = 65535;

export function sniffDpiFormat(bytes: Uint8Array): DpiFormat | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpeg';
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((value, index) => bytes[index] === value)) return 'png';
  return null;
}

export function clampDpi(dpi: number): number {
  if (!Number.isFinite(dpi)) return 72;
  return Math.min(DPI_MAX, Math.max(DPI_MIN, Math.round(dpi)));
}

/** 인쇄 크기(cm). 소수 첫째 자리. */
export function printSizeCm(pixels: number, dpi: number): number {
  return Math.round((pixels / dpi) * 2.54 * 10) / 10;
}

const u16 = (bytes: Uint8Array, at: number, little = false) =>
  little
    ? (bytes[at] ?? 0) | ((bytes[at + 1] ?? 0) << 8)
    : ((bytes[at] ?? 0) << 8) | (bytes[at + 1] ?? 0);

const u32 = (bytes: Uint8Array, at: number, little = false) =>
  little
    ? (u16(bytes, at, true) | (u16(bytes, at + 2, true) << 16)) >>> 0
    : ((u16(bytes, at) << 16) | u16(bytes, at + 2)) >>> 0;

function put16(bytes: Uint8Array, at: number, value: number, little = false) {
  if (little) {
    bytes[at] = value & 0xff;
    bytes[at + 1] = (value >> 8) & 0xff;
  } else {
    bytes[at] = (value >> 8) & 0xff;
    bytes[at + 1] = value & 0xff;
  }
}

function put32(bytes: Uint8Array, at: number, value: number, little = false) {
  if (little) {
    put16(bytes, at, value & 0xffff, true);
    put16(bytes, at + 2, (value >>> 16) & 0xffff, true);
  } else {
    put16(bytes, at, (value >>> 16) & 0xffff);
    put16(bytes, at + 2, value & 0xffff);
  }
}

const ascii = (bytes: Uint8Array, at: number, length: number) =>
  String.fromCharCode(...bytes.subarray(at, at + length));

// ── JPEG ─────────────────────────────────────────

interface Segment {
  marker: number;
  start: number;
  /** 길이 필드 바로 뒤(데이터 시작) */
  data: number;
  end: number;
}

function jpegSegments(bytes: Uint8Array): Segment[] {
  const segments: Segment[] = [];
  let at = 2;
  while (at + 4 <= bytes.length && bytes[at] === 0xff) {
    const marker = bytes[at + 1] ?? 0;
    if (marker === 0xda || marker === 0xd9) break; // 영상 데이터 시작
    const length = u16(bytes, at + 2);
    segments.push({ marker, start: at, data: at + 4, end: at + 2 + length });
    at += 2 + length;
  }
  return segments;
}

function isJfif(bytes: Uint8Array, segment: Segment) {
  return segment.marker === 0xe0 && ascii(bytes, segment.data, 5) === 'JFIF\0';
}

function isExif(bytes: Uint8Array, segment: Segment) {
  return segment.marker === 0xe1 && ascii(bytes, segment.data, 6) === 'Exif\0\0';
}

interface ExifEntry {
  tag: number;
  type: number;
  valueAt: number;
}

function exifIfd0(bytes: Uint8Array, segment: Segment) {
  const tiff = segment.data + 6;
  const little = ascii(bytes, tiff, 2) === 'II';
  const ifd = tiff + u32(bytes, tiff + 4, little);
  const count = u16(bytes, ifd, little);
  const entries: ExifEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    const entry = ifd + 2 + index * 12;
    if (entry + 12 > segment.end) break;
    const tag = u16(bytes, entry, little);
    const type = u16(bytes, entry + 2, little);
    // RATIONAL(5)은 값이 8바이트라 오프셋을 따라가고, SHORT(3)는 칸 안에 바로 있다.
    const valueAt = type === 5 ? tiff + u32(bytes, entry + 8, little) : entry + 8;
    entries.push({ tag, type, valueAt });
  }
  return { little, entries };
}

function readJpegDpi(bytes: Uint8Array): number | null {
  for (const segment of jpegSegments(bytes)) {
    if (isJfif(bytes, segment)) {
      const units = bytes[segment.data + 7];
      const x = u16(bytes, segment.data + 8);
      if (units === 1 && x > 0) return x;
      if (units === 2 && x > 0) return Math.round(x * 2.54);
    }
    if (isExif(bytes, segment)) {
      const { little, entries } = exifIfd0(bytes, segment);
      const unit = entries.find((entry) => entry.tag === 0x0128);
      const xres = entries.find((entry) => entry.tag === 0x011a && entry.type === 5);
      if (xres && xres.valueAt + 8 <= segment.end) {
        const den = u32(bytes, xres.valueAt + 4, little);
        const value = den ? u32(bytes, xres.valueAt, little) / den : 0;
        const cm = unit && u16(bytes, unit.valueAt, little) === 3;
        if (value > 0) return Math.round(cm ? value * 2.54 : value);
      }
    }
  }
  return null;
}

function writeJpegDpi(source: Uint8Array, dpi: number): Uint8Array {
  const segments = jpegSegments(source);
  const jfif = segments.find((segment) => isJfif(source, segment));
  let bytes: Uint8Array;
  if (jfif) {
    bytes = source.slice();
    bytes[jfif.data + 7] = 1; // 인치당
    put16(bytes, jfif.data + 8, dpi);
    put16(bytes, jfif.data + 10, dpi);
  } else {
    // JFIF 가 없으면 SOI 바로 뒤에 넣는다.
    const app0 = new Uint8Array([
      0xff,
      0xe0,
      0x00,
      0x10,
      0x4a,
      0x46,
      0x49,
      0x46,
      0x00,
      0x01,
      0x01,
      0x01,
      (dpi >> 8) & 0xff,
      dpi & 0xff,
      (dpi >> 8) & 0xff,
      dpi & 0xff,
      0x00,
      0x00,
    ]);
    bytes = new Uint8Array(source.length + app0.length);
    bytes.set(source.subarray(0, 2), 0);
    bytes.set(app0, 2);
    bytes.set(source.subarray(2), 2 + app0.length);
  }

  // EXIF 해상도 값이 있으면 같이 맞춘다(윈도우 속성·포토샵은 EXIF 를 먼저 본다).
  for (const segment of jpegSegments(bytes)) {
    if (!isExif(bytes, segment)) continue;
    const { little, entries } = exifIfd0(bytes, segment);
    for (const entry of entries) {
      if ((entry.tag === 0x011a || entry.tag === 0x011b) && entry.type === 5) {
        if (entry.valueAt + 8 > segment.end) continue;
        put32(bytes, entry.valueAt, dpi, little);
        put32(bytes, entry.valueAt + 4, 1, little);
      }
      if (entry.tag === 0x0128 && entry.type === 3) put16(bytes, entry.valueAt, 2, little);
    }
  }
  return bytes;
}

// ── PNG ──────────────────────────────────────────

let crcTable: Uint32Array | null = null;

export function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crcTable[(crc ^ byte) & 0xff] as number) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

interface Chunk {
  type: string;
  start: number;
  end: number;
}

function pngChunks(bytes: Uint8Array): Chunk[] {
  const chunks: Chunk[] = [];
  let at = 8;
  while (at + 12 <= bytes.length) {
    const length = u32(bytes, at);
    const type = ascii(bytes, at + 4, 4);
    chunks.push({ type, start: at, end: at + 12 + length });
    at += 12 + length;
    if (type === 'IEND') break;
  }
  return chunks;
}

const METERS_PER_INCH = 0.0254;

function readPngDpi(bytes: Uint8Array): number | null {
  const phys = pngChunks(bytes).find((chunk) => chunk.type === 'pHYs');
  if (!phys) return null;
  const x = u32(bytes, phys.start + 8);
  return bytes[phys.start + 16] === 1 && x > 0 ? Math.round(x * METERS_PER_INCH) : null;
}

function physChunk(dpi: number): Uint8Array {
  const ppm = Math.round(dpi / METERS_PER_INCH);
  const chunk = new Uint8Array(21);
  put32(chunk, 0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // pHYs
  put32(chunk, 8, ppm);
  put32(chunk, 12, ppm);
  chunk[16] = 1; // 미터
  put32(chunk, 17, crc32(chunk.subarray(4, 17)));
  return chunk;
}

function writePngDpi(source: Uint8Array, dpi: number): Uint8Array {
  const chunks = pngChunks(source);
  const phys = chunks.find((chunk) => chunk.type === 'pHYs');
  const ihdr = chunks.find((chunk) => chunk.type === 'IHDR');
  if (!ihdr) throw new Error('PNG 구조를 읽을 수 없습니다.');
  const cut = phys ?? { start: ihdr.end, end: ihdr.end };
  const insert = physChunk(dpi);
  const bytes = new Uint8Array(source.length - (cut.end - cut.start) + insert.length);
  bytes.set(source.subarray(0, cut.start), 0);
  bytes.set(insert, cut.start);
  bytes.set(source.subarray(cut.end), cut.start + insert.length);
  return bytes;
}

// ── 공개 함수 ────────────────────────────────────

export function readDpi(bytes: Uint8Array): number | null {
  const format = sniffDpiFormat(bytes);
  if (format === 'jpeg') return readJpegDpi(bytes);
  if (format === 'png') return readPngDpi(bytes);
  return null;
}

export function setDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  const value = clampDpi(dpi);
  const format = sniffDpiFormat(bytes);
  if (format === 'jpeg') return writeJpegDpi(bytes, value);
  if (format === 'png') return writePngDpi(bytes, value);
  throw new Error('JPG·PNG만 DPI를 바꿀 수 있습니다.');
}

export function dpiFileName(original: string, dpi: number): string {
  const dot = original.lastIndexOf('.');
  const base = dot > 0 ? original.slice(0, dot) : original;
  const ext = dot > 0 ? original.slice(dot) : '';
  return `${base}-${dpi}dpi${ext}`;
}
