import { describe, expect, it } from 'vitest';
import { compareSize, diffPixels, formatRatio, thresholdFor } from '../src/lib/image-diff';

describe('image-diff', () => {
  it('바뀐 픽셀만 센다', () => {
    const a = new Uint8ClampedArray([
      0, 0, 0, 255, 100, 100, 100, 255, 10, 10, 10, 255, 9, 9, 9, 255,
    ]);
    const b = new Uint8ClampedArray([
      0, 0, 0, 255, 100, 160, 100, 255, 12, 10, 10, 255, 9, 9, 9, 0,
    ]);
    const result = diffPixels(a, b, 10);
    expect(result.changed).toBe(2);
    expect(result.ratio).toBe(0.5);
    expect(Array.from(result.mask.slice(4, 8))).toEqual([230, 30, 60, 255]);
    expect(result.mask[0]).toBeGreaterThan(180); // 그대로인 곳은 흐리게
    expect(diffPixels(a, b, 1).changed).toBe(3);
  });

  it('크기가 다르면 오류', () => {
    expect(() => diffPixels(new Uint8ClampedArray(4), new Uint8ClampedArray(8), 1)).toThrow();
  });

  it('민감도와 크기', () => {
    expect(thresholdFor(100)).toBe(1);
    expect(thresholdFor(0)).toBe(121);
    expect(thresholdFor(200)).toBe(1);
    expect(compareSize(4000, 3000)).toEqual({ width: 2000, height: 1500 });
    expect(compareSize(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it('비율 표기', () => {
    expect(formatRatio(0)).toBe('0%');
    expect(formatRatio(0.0004)).toBe('0.1% 미만');
    expect(formatRatio(0.1234)).toBe('12.3%');
  });
});
