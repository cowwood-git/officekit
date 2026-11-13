import { describe, expect, it } from 'vitest';
import {
  boxFromPoints,
  normalizeRedactionRect,
  rectToPixels,
  redactedPageCount,
  redactionFileName,
  totalBoxes,
} from '../src/lib/pdf-redact';

describe('normalizeRedactionRect', () => {
  it('페이지 안으로 제한한다', () => {
    const rect = normalizeRedactionRect({ x: -0.2, y: 0.8, width: 0.5, height: 0.5 });
    expect(rect).toMatchObject({ x: 0, y: 0.8, width: 0.5 });
    expect(rect?.height).toBeCloseTo(0.2);
  });

  it('너무 작은 사각형은 무시한다', () => {
    expect(normalizeRedactionRect({ x: 0.5, y: 0.5, width: 0.001, height: 0.1 })).toBeNull();
  });
});

describe('boxFromPoints', () => {
  it('어느 방향으로 그어도 사각형을 만든다', () => {
    expect(boxFromPoints(80, 60, 20, 10, 100, 100)).toEqual({
      x: 0.2,
      y: 0.1,
      width: 0.6,
      height: 0.5,
    });
  });

  it('캔버스 크기가 0이면 null', () => {
    expect(boxFromPoints(0, 0, 10, 10, 0, 100)).toBeNull();
  });
});

describe('rectToPixels', () => {
  it('픽셀 좌표로 바꾼다', () => {
    expect(rectToPixels({ x: 0.25, y: 0.5, width: 0.5, height: 0.25 }, 1000, 800)).toEqual({
      x: 250,
      y: 400,
      width: 500,
      height: 200,
    });
  });
});

describe('counts', () => {
  it('전체 상자와 가린 페이지 수를 센다', () => {
    const boxes = new Map([
      [1, [{ x: 0, y: 0, width: 0.1, height: 0.1 }]],
      [2, []],
      [
        3,
        [
          { x: 0, y: 0, width: 0.1, height: 0.1 },
          { x: 0.2, y: 0.2, width: 0.1, height: 0.1 },
        ],
      ],
    ]);
    expect(totalBoxes(boxes)).toBe(3);
    expect(redactedPageCount(boxes)).toBe(2);
  });
});

describe('redactionFileName', () => {
  it('결과 파일명을 만든다', () => {
    expect(redactionFileName('계약서.pdf')).toBe('계약서-redacted.pdf');
  });
});
