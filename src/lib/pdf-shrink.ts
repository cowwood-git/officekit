// 글자를 그대로 둔 채 PDF 안의 사진만 다시 압축한다(MuPDF).
// 페이지를 그림으로 다시 그리는 방식과 달리 글자 검색·복사·벡터 도형이 그대로 남는다.
//
// mupdf 모듈은 10MB 넘는 wasm 을 품고 있어서, 호출하는 쪽이 필요할 때만 동적으로 불러와 넘긴다.

import type * as Mupdf from 'mupdf';

type MupdfModule = typeof Mupdf;
type PDFObject = Mupdf.PDFObject;

export interface ShrinkOptions {
  /** 페이지 긴 변을 이 DPI로 채울 만큼만 픽셀을 남긴다 */
  dpi: number;
  /** JPEG 품질 0~1 */
  quality: number;
  /** 사진을 흑백으로 바꾼다(글자·도형 색은 그대로) */
  grayscale?: boolean;
  onProgress?: (done: number, total: number) => void;
}

export interface ShrinkResult {
  bytes: Uint8Array;
  images: number;
  rewritten: number;
}

/** 이 크기보다 작은 이미지는 다시 압축해도 얻는 게 거의 없다 */
const MIN_IMAGE_BYTES = 8 * 1024;
/** 새 결과가 원래보다 이만큼은 작아야 바꾼다 */
const MIN_GAIN = 0.9;

/** 이미지 하나를 줄일 목표 크기. 긴 변이 limit 이하가 되도록 비율을 유지한다. */
export function targetSize(width: number, height: number, limit: number) {
  const longSide = Math.max(width, height);
  if (longSide <= limit || limit <= 0) return { width, height, scaled: false };
  const ratio = limit / longSide;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
    scaled: true,
  };
}

/** 문서에서 가장 큰 페이지의 긴 변(인치) */
function longestPageInches(doc: Mupdf.PDFDocument): number {
  let max = 0;
  const count = doc.countPages();
  for (let i = 0; i < count; i += 1) {
    const [x0, y0, x1, y1] = doc.loadPage(i).getBounds();
    max = Math.max(max, Math.abs(x1 - x0), Math.abs(y1 - y0));
  }
  return (max || 842) / 72;
}

function nameOf(obj: PDFObject): string {
  return obj.isName() ? obj.asName() : '';
}

/** 마스크로 쓰이는 이미지 번호들 — 이것들은 건드리지 않는다 */
function maskTargets(doc: Mupdf.PDFDocument, count: number): Set<number> {
  const masks = new Set<number>();
  for (let i = 1; i < count; i += 1) {
    const obj = doc.newIndirect(i);
    if (!obj.isStream()) continue;
    for (const key of ['SMask', 'Mask']) {
      const ref = obj.get(key);
      if (ref.isIndirect()) masks.add(ref.asIndirect());
    }
  }
  return masks;
}

/** 다시 압축할 만한 이미지인지 */
function isCandidate(obj: PDFObject): boolean {
  if (nameOf(obj.get('Subtype')) !== 'Image') return false;
  const imageMask = obj.get('ImageMask');
  if (imageMask.isBoolean() && imageMask.asBoolean()) return false;
  if (obj.get('BitsPerComponent').asNumber() === 1) return false;
  if (!obj.get('Decode').isNull()) return false;
  const cs = obj.get('ColorSpace').resolve();
  const csName = cs.isName() ? cs.asName() : cs.isArray() ? nameOf(cs.get(0)) : '';
  // 인쇄용 별색·CMYK·팔레트 이미지는 색이 바뀔 수 있어서 그대로 둔다.
  if (!['DeviceRGB', 'DeviceGray', 'ICCBased', 'CalRGB', 'CalGray'].includes(csName)) return false;
  if (csName === 'ICCBased') {
    const n = cs.get(1).get('N').asNumber();
    if (n !== 1 && n !== 3) return false;
  }
  return true;
}

export function shrinkPdf(
  mupdf: MupdfModule,
  input: Uint8Array,
  options: ShrinkOptions,
): ShrinkResult {
  const doc = mupdf.Document.openDocument(input, 'application/pdf').asPDF();
  if (!doc) throw new Error('PDF를 열 수 없습니다.');
  if (doc.needsPassword()) throw new Error('암호가 걸린 PDF는 먼저 암호를 풀어 주세요.');

  const limit = Math.round(options.dpi * longestPageInches(doc));
  const quality = Math.round(Math.min(0.95, Math.max(0.3, options.quality)) * 100);
  const count = doc.countObjects();
  const masks = maskTargets(doc, count);
  let images = 0;
  let rewritten = 0;

  for (let i = 1; i < count; i += 1) {
    options.onProgress?.(i, count);
    const obj = doc.newIndirect(i);
    if (!obj.isStream() || masks.has(i) || !isCandidate(obj)) continue;
    images += 1;
    const rawLength = obj.readRawStream().getLength();
    if (rawLength < MIN_IMAGE_BYTES) continue;

    let image: Mupdf.Image;
    try {
      image = doc.loadImage(obj);
    } catch {
      continue; // 깨진 이미지는 원본 그대로 둔다
    }
    const size = targetSize(image.getWidth(), image.getHeight(), limit);
    const colorspace = options.grayscale
      ? mupdf.ColorSpace.DeviceGray
      : image.getColorSpace()?.isGray()
        ? mupdf.ColorSpace.DeviceGray
        : mupdf.ColorSpace.DeviceRGB;

    // MuPDF 그리기 장치로 목표 크기에 맞춰 다시 샘플링한다(가장자리 계단 없이 부드럽게).
    const pixmap = new mupdf.Pixmap(colorspace, [0, 0, size.width, size.height], false);
    pixmap.clear(255);
    const device = new mupdf.DrawDevice(mupdf.Matrix.identity, pixmap);
    device.fillImage(image, [size.width, 0, 0, size.height, 0, 0], 1);
    device.close();
    const jpeg = pixmap.asJPEG(quality, false);

    if (jpeg.length >= rawLength * MIN_GAIN) continue;

    obj.writeRawStream(jpeg);
    obj.put('Filter', doc.newName('DCTDecode'));
    obj.delete('DecodeParms');
    obj.put('Width', size.width);
    obj.put('Height', size.height);
    obj.put('BitsPerComponent', 8);
    obj.put('ColorSpace', doc.newName(colorspace.isGray() ? 'DeviceGray' : 'DeviceRGB'));
    rewritten += 1;
  }

  const buffer = doc.saveToBuffer('garbage=compact,compress,compress-fonts,objstms');
  const bytes = buffer.asUint8Array().slice();
  options.onProgress?.(count, count);
  return { bytes, images, rewritten };
}
