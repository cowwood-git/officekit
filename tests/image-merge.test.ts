import { describe, expect, it } from 'vitest';
import { gridDimensions, mergeLayout } from '../src/lib/image-merge';

const sizes = [
  { width: 100, height: 200 },
  { width: 100, height: 100 },
];

describe('gridDimensions', () => {
  it('개수에 맞는 격자를 만든다', () => {
    expect(gridDimensions(1)).toEqual({ cols: 1, rows: 1 });
    expect(gridDimensions(4)).toEqual({ cols: 2, rows: 2 });
    expect(gridDimensions(5)).toEqual({ cols: 3, rows: 2 });
  });
});

describe('mergeLayout horizontal', () => {
  it('가장 높은 이미지에 맞춰 비율을 유지한다', () => {
    const layout = mergeLayout(sizes, 'horizontal', 10);
    expect(layout.height).toBe(200);
    expect(layout.placements[0]).toEqual({ x: 0, y: 0, width: 100, height: 200 });
    expect(layout.placements[1]).toEqual({ x: 110, y: 0, width: 200, height: 200 });
    expect(layout.width).toBe(310);
  });
});

describe('mergeLayout vertical', () => {
  it('가장 넓은 이미지에 맞춘다', () => {
    const layout = mergeLayout(sizes, 'vertical', 5);
    expect(layout.width).toBe(100);
    expect(layout.placements[1]).toEqual({ x: 0, y: 205, width: 100, height: 100 });
    expect(layout.height).toBe(305);
  });
});

describe('mergeLayout grid', () => {
  it('균일한 셀 안에 가운데 배치한다', () => {
    const layout = mergeLayout(sizes, 'grid', 10);
    expect(layout.width).toBe(210);
    expect(layout.height).toBe(200);
    expect(layout.placements[0]).toEqual({ x: 0, y: 0, width: 100, height: 200 });
    expect(layout.placements[1]).toEqual({ x: 110, y: 50, width: 100, height: 100 });
  });
});

describe('mergeLayout empty', () => {
  it('이미지가 없으면 0 크기', () => {
    expect(mergeLayout([], 'horizontal')).toEqual({ width: 0, height: 0, placements: [] });
  });
});
