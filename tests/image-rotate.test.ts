import { describe, expect, it } from 'vitest';
import { canvasTransform, normalizeTurns, rotatedSize } from '../src/lib/image-rotate';

describe('normalizeTurns', () => {
  it('0~3 범위로 정규화한다', () => {
    expect(normalizeTurns(1)).toBe(1);
    expect(normalizeTurns(4)).toBe(0);
    expect(normalizeTurns(-1)).toBe(3);
    expect(normalizeTurns(9)).toBe(1);
    expect(normalizeTurns(Number.NaN)).toBe(0);
  });
});

describe('rotatedSize', () => {
  it('홀수 회전에서 가로·세로를 바꾼다', () => {
    expect(rotatedSize(1200, 800, 0)).toEqual({ width: 1200, height: 800 });
    expect(rotatedSize(1200, 800, 1)).toEqual({ width: 800, height: 1200 });
    expect(rotatedSize(1200, 800, 2)).toEqual({ width: 1200, height: 800 });
    expect(rotatedSize(1200, 800, 3)).toEqual({ width: 800, height: 1200 });
  });
});

describe('canvasTransform', () => {
  it('회전 각도와 뒤집기 배율을 만든다', () => {
    const transform = canvasTransform(400, 300, 1, true, false);
    expect(transform.translateX).toBe(200);
    expect(transform.translateY).toBe(150);
    expect(transform.rotate).toBeCloseTo(Math.PI / 2);
    expect(transform.scaleX).toBe(-1);
    expect(transform.scaleY).toBe(1);
  });
});
