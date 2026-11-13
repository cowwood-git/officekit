import { describe, expect, it } from 'vitest';
import { blurRadius, centeredRegion, exportScaleFor, mosaicBlock } from '../src/lib/redact';

describe('centeredRegion', () => {
  it('이미지 중앙에 비율만큼 만든다', () => {
    const region = centeredRegion({ width: 1000, height: 500 }, 0.4);
    expect(region).toEqual({ x: 300, y: 150, width: 400, height: 200 });
  });

  it('작은 이미지에서도 최소 크기를 지킨다', () => {
    const region = centeredRegion({ width: 20, height: 20 }, 0.1);
    expect(region.width).toBeGreaterThanOrEqual(16);
    expect(region.height).toBeGreaterThanOrEqual(16);
  });
});

describe('mosaicBlock', () => {
  it('배율에 따라 블록을 조정한다', () => {
    expect(mosaicBlock(20, 1)).toBe(20);
    expect(mosaicBlock(20, 0.25)).toBe(5);
  });

  it('최소 2px 를 보장한다', () => {
    expect(mosaicBlock(2, 0.1)).toBe(2);
  });
});

describe('blurRadius', () => {
  it('강도의 절반을 반경으로 쓴다', () => {
    expect(blurRadius(20, 1)).toBe(10);
    expect(blurRadius(20, 0.5)).toBe(5);
  });

  it('최소 1px 를 보장한다', () => {
    expect(blurRadius(2, 0.1)).toBe(1);
  });
});

describe('exportScaleFor', () => {
  it('6000px 이하는 원본 유지', () => {
    expect(exportScaleFor({ width: 4000, height: 3000 })).toBe(1);
  });

  it('6000px 초과는 축소한다', () => {
    expect(exportScaleFor({ width: 12000, height: 6000 })).toBe(0.5);
  });
});
