import { describe, expect, it } from 'vitest';
import { GRAY_QUALITY, grayFileName, toGrayscale } from '../src/lib/pdf-grayscale';

describe('pdf-grayscale', () => {
  it('회색조: 밝기만 남긴다', () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 128]);
    toGrayscale(data);
    expect(Array.from(data)).toEqual([76, 76, 76, 255, 150, 150, 150, 128]);
  });

  it('흑백: 기준보다 밝으면 흰색', () => {
    const data = new Uint8ClampedArray([200, 200, 200, 255, 100, 100, 100, 255]);
    toGrayscale(data, 'bw', 160);
    expect(Array.from(data)).toEqual([255, 255, 255, 255, 0, 0, 0, 255]);
  });

  it('설정과 파일 이름', () => {
    expect(GRAY_QUALITY.normal.dpi).toBe(150);
    expect(grayFileName('보고서.pdf', 'gray')).toBe('보고서-gray.pdf');
    expect(grayFileName('x.pdf', 'bw')).toBe('x-bw.pdf');
  });
});
