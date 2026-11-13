import { describe, expect, it } from 'vitest';
import {
  extractedImageName,
  imageDataToRgba,
  isExtractableKind,
  isTinyImage,
} from '../src/lib/pdf-image-extract';

describe('imageDataToRgba', () => {
  it('RGB 24bpp를 RGBA로 바꾼다', () => {
    const rgba = imageDataToRgba({
      width: 2,
      height: 1,
      kind: 2,
      data: new Uint8Array([255, 0, 0, 0, 255, 0]),
    });
    expect([...rgba]).toEqual([255, 0, 0, 255, 0, 255, 0, 255]);
  });

  it('RGBA 32bpp를 유지한다', () => {
    const rgba = imageDataToRgba({
      width: 1,
      height: 1,
      kind: 3,
      data: new Uint8Array([1, 2, 3, 4]),
    });
    expect([...rgba]).toEqual([1, 2, 3, 4]);
  });

  it('1bpp 흑백을 RGBA로 바꾼다', () => {
    const rgba = imageDataToRgba({
      width: 8,
      height: 1,
      kind: 1,
      data: new Uint8Array([0b10100000]),
    });
    expect([...rgba.slice(0, 4)]).toEqual([255, 255, 255, 255]);
    expect([...rgba.slice(4, 8)]).toEqual([0, 0, 0, 255]);
  });
});

describe('helpers', () => {
  it('지원 kind를 판별한다', () => {
    expect(isExtractableKind(1)).toBe(true);
    expect(isExtractableKind(2)).toBe(true);
    expect(isExtractableKind(3)).toBe(true);
    expect(isExtractableKind(4)).toBe(false);
  });

  it('작은 이미지를 걸러낸다', () => {
    expect(isTinyImage(10, 10)).toBe(true);
    expect(isTinyImage(16, 16)).toBe(false);
  });

  it('파일명을 만든다', () => {
    expect(extractedImageName(2, 3)).toBe('page-02-image-03.png');
  });
});
