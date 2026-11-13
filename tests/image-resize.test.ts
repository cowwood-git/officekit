import { describe, expect, it } from 'vitest';
import { keepFormat, MAX_SIDE, resizeError, resizeTarget } from '../src/lib/image-resize';

const base = { percent: 50, width: 800, height: 600, keepRatio: true };
const photo = { width: 4000, height: 3000 };

describe('resizeTarget', () => {
  it('비율로 줄인다', () => {
    expect(resizeTarget(photo, { ...base, mode: 'percent', percent: 25 })).toEqual({
      width: 1000,
      height: 750,
    });
  });

  it('가로·세로 하나만 정하면 나머지는 비율대로', () => {
    expect(resizeTarget(photo, { ...base, mode: 'width', width: 1200 })).toEqual({
      width: 1200,
      height: 900,
    });
    expect(resizeTarget(photo, { ...base, mode: 'height', height: 600 })).toEqual({
      width: 800,
      height: 600,
    });
  });

  it('가로×세로: 비율 유지면 상자 안에 맞추고, 아니면 정확히 그 크기', () => {
    expect(resizeTarget(photo, { ...base, mode: 'box', width: 1000, height: 1000 })).toEqual({
      width: 1000,
      height: 750,
    });
    expect(
      resizeTarget(photo, { ...base, mode: 'box', width: 1000, height: 1000, keepRatio: false }),
    ).toEqual({ width: 1000, height: 1000 });
  });

  it('너무 크면 최대 크기로 줄이고, 1px 미만은 1px', () => {
    const big = resizeTarget(photo, { ...base, mode: 'percent', percent: 1000 });
    expect(Math.max(big.width, big.height)).toBe(MAX_SIDE);
    expect(
      resizeTarget({ width: 10, height: 1 }, { ...base, mode: 'percent', percent: 10 }),
    ).toEqual({
      width: 1,
      height: 1,
    });
  });
});

describe('resizeError · keepFormat', () => {
  it('잘못된 값을 알린다', () => {
    expect(resizeError({ ...base, mode: 'percent', percent: 0 })).not.toBe('');
    expect(resizeError({ ...base, mode: 'width', width: 99999 })).not.toBe('');
    expect(resizeError({ ...base, mode: 'box' })).toBe('');
  });

  it('저장할 수 없는 형식은 PNG로', () => {
    expect(keepFormat('image/webp')).toBe('image/webp');
    expect(keepFormat('image/gif')).toBe('image/png');
  });
});
