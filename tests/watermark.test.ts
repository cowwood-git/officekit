import { describe, expect, it } from 'vitest';
import {
  cornerAnchor,
  diagonal,
  outputScaleFor,
  tileStep,
  watermarkFontSize,
} from '../src/lib/watermark';

describe('watermarkFontSize', () => {
  it('짧은 변 기준으로 계산한다', () => {
    expect(watermarkFontSize({ width: 1000, height: 500 }, 5)).toBe(25);
  });

  it('너무 작거나 큰 값은 보정한다', () => {
    expect(watermarkFontSize({ width: 1000, height: 500 }, 1)).toBe(10);
    expect(watermarkFontSize({ width: 1000, height: 500 }, 100)).toBe(150);
  });
});

describe('tileStep', () => {
  it('글자 폭보다 넓게 간격을 둔다', () => {
    const step = tileStep(200, 40);
    expect(step.x).toBeGreaterThan(200);
    expect(step.y).toBe(120);
  });

  it('아주 좁은 글자도 최소 간격을 지킨다', () => {
    expect(tileStep(5, 40).x).toBeGreaterThanOrEqual(48);
  });
});

describe('cornerAnchor', () => {
  it('오른쪽 아래에서 여백을 뺀다', () => {
    expect(cornerAnchor({ width: 800, height: 600 }, 40)).toEqual({ x: 760, y: 560 });
  });

  it('여백이 커도 0 아래로 가지 않는다', () => {
    expect(cornerAnchor({ width: 100, height: 80 }, 200)).toEqual({ x: 0, y: 0 });
  });
});

describe('diagonal', () => {
  it('3-4-5 삼각형', () => {
    expect(diagonal({ width: 300, height: 400 })).toBe(500);
  });
});

describe('outputScaleFor', () => {
  it('6000px 이하는 유지', () => {
    expect(outputScaleFor({ width: 3000, height: 2000 })).toBe(1);
  });

  it('초과하면 축소', () => {
    expect(outputScaleFor({ width: 12000, height: 6000 })).toBe(0.5);
  });
});
