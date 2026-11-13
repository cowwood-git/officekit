import { describe, expect, it } from 'vitest';
import {
  clampFilters,
  DEFAULT_FILTERS,
  filterCss,
  isDefaultFilters,
} from '../src/lib/image-filter';

describe('clampFilters', () => {
  it('각 값을 안전한 범위로 제한한다', () => {
    expect(
      clampFilters({
        brightness: 999,
        contrast: -20,
        saturation: 120,
        grayscale: 130,
        sepia: -1,
        blur: 99,
      }),
    ).toEqual({
      brightness: 200,
      contrast: 0,
      saturation: 120,
      grayscale: 100,
      sepia: 0,
      blur: 20,
    });
  });

  it('빈 값은 기본값을 쓴다', () => {
    expect(clampFilters({})).toEqual(DEFAULT_FILTERS);
  });
});

describe('filterCss', () => {
  it('CSS filter 문자열을 만든다', () => {
    expect(filterCss({ brightness: 110, grayscale: 100 })).toBe(
      'brightness(110%) contrast(100%) saturate(100%) grayscale(100%) sepia(0%) blur(0px)',
    );
  });

  it('미리보기 배율에 따라 blur를 조정한다', () => {
    expect(filterCss({ blur: 10 }, 0.5)).toContain('blur(5px)');
  });
});

describe('isDefaultFilters', () => {
  it('기본값 여부를 판별한다', () => {
    expect(isDefaultFilters({})).toBe(true);
    expect(isDefaultFilters({ sepia: 20 })).toBe(false);
  });
});
