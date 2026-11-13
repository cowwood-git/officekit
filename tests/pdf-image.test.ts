import { describe, expect, it } from 'vitest';
import { dpiToScale, megapixels, pageFileName, planPages } from '../src/lib/pdf-image';

describe('dpiToScale', () => {
  it('72dpi 는 배율 1이다', () => {
    expect(dpiToScale(72)).toBe(1);
    expect(dpiToScale(144)).toBe(2);
    expect(dpiToScale(216)).toBe(3);
  });

  it('범위를 벗어난 값을 보정한다', () => {
    expect(dpiToScale(10)).toBe(0.5);
    expect(dpiToScale(600)).toBe(300 / 72);
  });

  it('숫자가 아니면 기본값 2를 쓴다', () => {
    expect(dpiToScale(Number.NaN)).toBe(2);
  });
});

describe('planPages', () => {
  it('빈 입력은 전체 페이지', () => {
    expect(planPages('', 4)).toEqual({ pages: [1, 2, 3, 4], errors: [] });
  });

  it('범위를 지정하면 해당 페이지만', () => {
    expect(planPages('1-2, 4', 4)).toEqual({ pages: [1, 2, 4], errors: [] });
  });

  it('잘못된 범위는 오류를 전달한다', () => {
    expect(planPages('9', 4).errors.length).toBeGreaterThan(0);
  });

  it('페이지 수가 0이면 빈 배열', () => {
    expect(planPages('', 0).pages).toEqual([]);
  });
});

describe('pageFileName', () => {
  it('페이지 수에 맞춰 0을 채운다', () => {
    expect(pageFileName(3, 9)).toBe('page-03.jpg');
    expect(pageFileName(3, 12)).toBe('page-03.jpg');
    expect(pageFileName(12, 120)).toBe('page-012.jpg');
  });
});

describe('megapixels', () => {
  it('A4 144dpi 는 약 2MP', () => {
    const mp = megapixels({ width: 595, height: 842 }, 2);
    expect(mp).toBeGreaterThan(1.9);
    expect(mp).toBeLessThan(2.1);
  });
});
