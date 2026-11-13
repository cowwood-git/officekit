import { describe, expect, it } from 'vitest';
import {
  clampRect,
  displayScale,
  fitAspect,
  moveRect,
  resizeRect,
  scaledSize,
} from '../src/lib/crop';

const bounds = { width: 200, height: 100 };

describe('clampRect', () => {
  it('이미지 밖으로 나간 영역을 안으로 당긴다', () => {
    expect(clampRect({ x: -20, y: -10, width: 50, height: 40 }, bounds)).toEqual({
      x: 0,
      y: 0,
      width: 50,
      height: 40,
    });
  });

  it('이미지보다 큰 영역을 줄인다', () => {
    expect(clampRect({ x: 0, y: 0, width: 400, height: 300 }, bounds)).toEqual({
      x: 0,
      y: 0,
      width: 200,
      height: 100,
    });
  });

  it('오른쪽 아래로 넘치면 위치를 당긴다', () => {
    const rect = clampRect({ x: 180, y: 90, width: 50, height: 40 }, bounds);
    expect(rect.x + rect.width).toBeLessThanOrEqual(bounds.width);
    expect(rect.y + rect.height).toBeLessThanOrEqual(bounds.height);
  });
});

describe('fitAspect', () => {
  it('1:1 비율로 중앙에 맞춘다', () => {
    const rect = fitAspect({ x: 0, y: 0, width: 200, height: 100 }, 1, bounds);
    expect(rect.width).toBe(100);
    expect(rect.height).toBe(100);
    expect(rect.x).toBe(50);
    expect(rect.y).toBe(0);
  });

  it('16:9 비율을 유지한다', () => {
    const rect = fitAspect({ x: 0, y: 0, width: 200, height: 100 }, 16 / 9, bounds);
    expect(rect.width / rect.height).toBeCloseTo(16 / 9, 5);
    expect(rect.width).toBeLessThanOrEqual(bounds.width);
    expect(rect.height).toBeLessThanOrEqual(bounds.height);
  });

  it('잘못된 비율은 그대로 둔다', () => {
    const input = { x: 10, y: 10, width: 50, height: 30 };
    expect(fitAspect(input, 0, bounds)).toEqual(input);
  });
});

describe('moveRect', () => {
  it('이동하되 경계에서 멈춘다', () => {
    const moved = moveRect({ x: 0, y: 0, width: 50, height: 40 }, -30, 100, bounds);
    expect(moved.x).toBe(0);
    expect(moved.y).toBe(bounds.height - 40);
  });
});

describe('resizeRect', () => {
  const rect = { x: 10, y: 10, width: 50, height: 50 };

  it('남동쪽 모서리를 끌면 크기가 커진다', () => {
    const next = resizeRect(rect, 'se', { x: 80, y: 90 }, bounds);
    expect(next).toEqual({ x: 10, y: 10, width: 70, height: 80 });
  });

  it('북서쪽 모서리를 끌면 반대편이 고정된다', () => {
    const next = resizeRect(rect, 'nw', { x: 20, y: 30 }, bounds);
    expect(next).toEqual({ x: 20, y: 30, width: 40, height: 30 });
  });

  it('비율을 유지한다', () => {
    const next = resizeRect(rect, 'se', { x: 90, y: 20 }, bounds, 1);
    expect(next.width).toBeCloseTo(next.height, 5);
  });

  it('이미지 경계를 넘지 않는다', () => {
    const next = resizeRect(rect, 'se', { x: 999, y: 999 }, bounds);
    expect(next.x + next.width).toBeLessThanOrEqual(bounds.width);
    expect(next.y + next.height).toBeLessThanOrEqual(bounds.height);
  });

  it('최소 크기 아래로 줄지 않는다', () => {
    const next = resizeRect(rect, 'se', { x: 11, y: 11 }, bounds);
    expect(next.width).toBeGreaterThanOrEqual(16);
    expect(next.height).toBeGreaterThanOrEqual(16);
  });
});

describe('displayScale', () => {
  it('큰 이미지는 축소한다', () => {
    expect(displayScale({ width: 1000, height: 500 }, { width: 400, height: 300 })).toBe(0.4);
  });

  it('작은 이미지는 확대하지 않는다', () => {
    expect(displayScale({ width: 100, height: 100 }, { width: 400, height: 300 })).toBe(1);
  });
});

describe('scaledSize', () => {
  it('가로 기준으로 세로를 계산한다', () => {
    expect(scaledSize({ width: 1000, height: 500 }, 400)).toEqual({ width: 400, height: 200 });
  });

  it('세로 기준으로 가로를 계산한다', () => {
    expect(scaledSize({ width: 1000, height: 500 }, undefined, 250)).toEqual({
      width: 500,
      height: 250,
    });
  });

  it('값이 없으면 원본 크기', () => {
    expect(scaledSize({ width: 320, height: 240 })).toEqual({ width: 320, height: 240 });
  });
});
