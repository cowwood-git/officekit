import { describe, expect, it } from 'vitest';
import { fitRect, PAGE_SIZES, pageSizeFor } from '../src/lib/image-pdf';

describe('pageSizeFor', () => {
  it('A4 는 이미지 방향에 맞춰 세로/가로를 고른다', () => {
    expect(pageSizeFor('a4', { width: 4000, height: 3000 })).toEqual(PAGE_SIZES.a4.landscape);
    expect(pageSizeFor('a4', { width: 3000, height: 4000 })).toEqual(PAGE_SIZES.a4.portrait);
  });

  it('Letter 도 방향을 따른다', () => {
    expect(pageSizeFor('letter', { width: 4000, height: 3000 })).toEqual(
      PAGE_SIZES.letter.landscape,
    );
  });

  it('이미지 크기 모드는 원본 픽셀을 그대로 쓴다', () => {
    expect(pageSizeFor('image', { width: 800, height: 600 })).toEqual({ width: 800, height: 600 });
  });

  it('0 이하 크기를 1로 보정한다', () => {
    expect(pageSizeFor('image', { width: 0, height: -10 })).toEqual({ width: 1, height: 1 });
  });
});

describe('fitRect', () => {
  const page = { width: 595.28, height: 841.89 };

  it('여백 안에 비율을 유지하며 가운데 배치한다', () => {
    const rect = fitRect({ width: 1600, height: 900 }, page, 24);

    expect(rect.width).toBeLessThanOrEqual(page.width - 48 + 0.01);
    expect(rect.height).toBeLessThanOrEqual(page.height - 48 + 0.01);
    expect(rect.width / rect.height).toBeCloseTo(1600 / 900, 5);
    expect(rect.x * 2 + rect.width).toBeCloseTo(page.width, 5);
    expect(rect.y * 2 + rect.height).toBeCloseTo(page.height, 5);
  });

  it('작은 이미지도 페이지에 맞게 확대한다', () => {
    const rect = fitRect({ width: 100, height: 50 }, page, 24);
    expect(rect.width).toBeGreaterThan(100);
  });

  it('여백이 0이면 페이지 폭을 꽉 채운다', () => {
    const rect = fitRect({ width: 1000, height: 1000 }, page, 0);
    expect(rect.width).toBeCloseTo(page.width, 5);
    expect(rect.x).toBeCloseTo(0, 5);
    expect(rect.y * 2 + rect.height).toBeCloseTo(page.height, 5);
  });

  it('음수 여백은 0으로 처리한다', () => {
    const withNegative = fitRect({ width: 1000, height: 1000 }, page, -50);
    const withZero = fitRect({ width: 1000, height: 1000 }, page, 0);
    expect(withNegative).toEqual(withZero);
  });
});
