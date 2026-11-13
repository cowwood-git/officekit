import { describe, expect, it } from 'vitest';
import {
  clampDpi,
  crc32,
  dpiFileName,
  printSizeCm,
  readDpi,
  setDpi,
  sniffDpiFormat,
} from '../src/lib/image-dpi';

// 1×1 PNG (pHYs 없음)
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);

// SOI + 가짜 SOS + EOI (JFIF 없음)
const BARE_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9]);

function jpegWithExif(little: boolean): Uint8Array {
  // TIFF: 헤더(8) + IFD(2 + 3×12 + 4) + RATIONAL 2개(16)
  const tiff = new Uint8Array(8 + 2 + 36 + 4 + 16);
  const view = new DataView(tiff.buffer);
  tiff.set(little ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  view.setUint16(2, 42, little);
  view.setUint32(4, 8, little);
  view.setUint16(8, 3, little);
  const values = 8 + 2 + 36 + 4;
  const entry = (i: number, tag: number, type: number, value: number) => {
    const at = 10 + i * 12;
    view.setUint16(at, tag, little);
    view.setUint16(at + 2, type, little);
    view.setUint32(at + 4, 1, little);
    if (type === 3) view.setUint16(at + 8, value, little);
    else view.setUint32(at + 8, value, little);
  };
  entry(0, 0x011a, 5, values);
  entry(1, 0x011b, 5, values + 8);
  entry(2, 0x0128, 3, 3); // cm
  view.setUint32(values, 28, little);
  view.setUint32(values + 4, 1, little);
  view.setUint32(values + 8, 28, little);
  view.setUint32(values + 12, 1, little);
  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0, 0];
  const length = 2 + exifHeader.length + tiff.length;
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe1,
    length >> 8,
    length & 0xff,
    ...exifHeader,
    ...tiff,
    0xff,
    0xda,
    0x00,
    0x02,
    0x11,
    0xff,
    0xd9,
  ]);
}

describe('image-dpi', () => {
  it('형식을 알아본다', () => {
    expect(sniffDpiFormat(PNG)).toBe('png');
    expect(sniffDpiFormat(BARE_JPEG)).toBe('jpeg');
    expect(sniffDpiFormat(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(() => setDpi(new Uint8Array([1, 2, 3]), 300)).toThrow();
  });

  it('CRC32 표준값', () => {
    expect(crc32(new TextEncoder().encode('IEND'))).toBe(0xae426082);
  });

  it('PNG 에 pHYs 를 넣고, 다시 바꾸면 덮어쓴다', () => {
    expect(readDpi(PNG)).toBeNull();
    const once = setDpi(PNG, 300);
    expect(readDpi(once)).toBe(300);
    expect(once.length).toBe(PNG.length + 21);
    const twice = setDpi(once, 96);
    expect(readDpi(twice)).toBe(96);
    expect(twice.length).toBe(once.length);
    // 원본은 그대로
    expect(readDpi(PNG)).toBeNull();
  });

  it('JFIF 가 없는 JPEG 에는 APP0 를 넣는다', () => {
    const out = setDpi(BARE_JPEG, 350);
    expect(readDpi(out)).toBe(350);
    expect(out.length).toBe(BARE_JPEG.length + 18);
    expect(Array.from(out.slice(-4))).toEqual([0x11, 0x22, 0xff, 0xd9]);
    const again = setDpi(out, 72);
    expect(again.length).toBe(out.length);
    expect(readDpi(again)).toBe(72);
  });

  it.each([true, false])('EXIF 해상도도 맞춘다 (little=%s)', (little) => {
    const source = jpegWithExif(little);
    expect(readDpi(source)).toBe(71); // 28 px/cm
    const out = setDpi(source, 300);
    expect(readDpi(out)).toBe(300);
    // JFIF 를 지워도 EXIF 만으로 300
    const exifOnly = setDpi(source, 300).slice();
    exifOnly[13] = 0; // JFIF units 0 → 무시
    expect(readDpi(exifOnly)).toBe(300);
  });

  it('보조 함수', () => {
    expect(clampDpi(0)).toBe(1);
    expect(clampDpi(Number.NaN)).toBe(72);
    expect(clampDpi(300.4)).toBe(300);
    expect(printSizeCm(3000, 300)).toBe(25.4);
    expect(dpiFileName('scan.jpg', 300)).toBe('scan-300dpi.jpg');
  });
});
