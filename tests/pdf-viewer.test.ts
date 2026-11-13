import { describe, expect, it } from 'vitest';
import { clampPage, fitWidthZoom, MAX_ZOOM, MIN_ZOOM, nextZoom } from '../src/lib/pdf-viewer';

describe('pdf-viewer', () => {
  it('배율을 한 단계씩 바꾼다', () => {
    expect(nextZoom(1, 1)).toBe(1.25);
    expect(nextZoom(1, -1)).toBe(0.8);
    expect(nextZoom(1.1, 1)).toBe(1.25);
    expect(nextZoom(1.1, -1)).toBe(1);
    expect(nextZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM);
    expect(nextZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM);
  });

  it('폭 맞춤 배율은 범위 안', () => {
    expect(fitWidthZoom(632, 600)).toBe(1);
    expect(fitWidthZoom(100, 600)).toBe(MIN_ZOOM);
    expect(fitWidthZoom(0, 600)).toBe(1);
  });

  it('쪽 번호를 범위로 자른다', () => {
    expect(clampPage('7', 5)).toBe(5);
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage('abc', 5)).toBeNull();
  });
});
