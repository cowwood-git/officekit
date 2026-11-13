import { describe, expect, it } from 'vitest';
import {
  chooseRows,
  collageFileName,
  collageLayout,
  coverCrop,
  gridLayout,
  horizontalLayout,
  justifiedLayout,
  verticalLayout,
} from '../src/lib/image-collage';

const base = { width: 1000, height: 1000, gap: 0, margin: 0, mode: 'justified' as const };

describe('chooseRows', () => {
  it('캔버스 비율에 맞춰 행 수를 고른다', () => {
    expect(chooseRows(1, 1000, 1000)).toBe(1);
    expect(chooseRows(2, 1000, 1000)).toBe(1);
    expect(chooseRows(2, 1000, 1400)).toBe(2);
    expect(chooseRows(4, 1000, 1000)).toBe(2);
    expect(chooseRows(9, 1000, 1000)).toBe(3);
  });
});

describe('justifiedLayout', () => {
  it('4장을 2×2로 채운다', () => {
    const rects = justifiedLayout([1, 1, 1, 1], base);
    expect(rects).toHaveLength(4);
    expect(rects[0]).toMatchObject({ x: 0, y: 0, width: 500, height: 500 });
    expect(rects[3]).toMatchObject({ x: 500, y: 500, width: 500, height: 500 });
  });

  it('여백·간격을 반영한다', () => {
    const rects = justifiedLayout([1, 1], { ...base, gap: 10, margin: 20 });
    expect(rects[0]?.x).toBe(20);
    expect(rects[1]?.x).toBe(20 + 475 + 10);
    expect(rects[0]?.width).toBeCloseTo(475);
  });

  it('모든 사각형이 캔버스 안에 들어온다', () => {
    const rects = collageLayout([1.5, 0.8, 1, 1.2, 0.7], {
      ...base,
      gap: 8,
      margin: 12,
    });
    for (const rect of rects) {
      expect(rect.x).toBeGreaterThanOrEqual(12);
      expect(rect.y).toBeGreaterThanOrEqual(12);
      expect(rect.x + rect.width).toBeLessThanOrEqual(1000 - 12 + 0.001);
      expect(rect.y + rect.height).toBeLessThanOrEqual(1000 - 12 + 0.001);
    }
  });
});

describe('gridLayout', () => {
  it('마지막 행을 가운데 정렬한다', () => {
    const rects = gridLayout([1, 1, 1], base);
    expect(rects[0]).toMatchObject({ x: 0, width: 500 });
    expect(rects[2]).toMatchObject({ x: 250, y: 500, width: 500 });
  });
});

describe('horizontal / vertical', () => {
  it('가로 스트립은 한 행으로 채운다', () => {
    const rects = horizontalLayout([1, 2], { ...base, height: 500 });
    expect(rects).toHaveLength(2);
    expect(rects[0]).toMatchObject({ x: 0, y: 0, height: 500 });
    expect(rects[0]?.width).toBeCloseTo(333.33);
    expect(rects[1]?.x).toBeCloseTo(333.33);
    expect(rects[1]?.width).toBeCloseTo(666.67);
  });

  it('세로 스트립은 비율에 따라 높이를 나눈다', () => {
    const rects = verticalLayout([1, 2], base);
    expect(rects[0]?.height).toBeCloseTo(666.67);
    expect(rects[1]?.height).toBeCloseTo(333.33);
  });
});

describe('coverCrop', () => {
  it('가로 이미지를 정사각형에 맞게 자른다', () => {
    expect(coverCrop(1200, 800, 500, 500)).toEqual({
      x: 200,
      y: 0,
      width: 800,
      height: 800,
    });
  });

  it('세로 이미지를 가로 셀에 맞게 자른다', () => {
    expect(coverCrop(800, 1200, 500, 300)).toEqual({
      x: 0,
      y: 360,
      width: 800,
      height: 480,
    });
  });
});

describe('collageFileName', () => {
  it('파일명을 만든다', () => {
    expect(collageFileName('사진.jpg')).toBe('사진-collage.png');
  });
});
