import { describe, expect, it } from 'vitest';
import {
  clampSignatureRect,
  DEFAULT_SIGNATURE_RECT,
  isPointInsideRect,
  signatureFileName,
  transparentBounds,
} from '../src/lib/pdf-sign';

describe('clampSignatureRect', () => {
  it('페이지 안으로 제한한다', () => {
    const clamped = clampSignatureRect({ x: -1, y: 2, width: 2, height: 2 });
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBeCloseTo(0.1);
    expect(clamped.width).toBe(0.9);
    expect(clamped.height).toBe(0.9);
  });

  it('기본값은 안전한 범위', () => {
    expect(clampSignatureRect(DEFAULT_SIGNATURE_RECT)).toEqual(DEFAULT_SIGNATURE_RECT);
  });
});

describe('transparentBounds', () => {
  it('불투명 픽셀 경계를 찾는다', () => {
    const width = 4;
    const height = 3;
    const data = new Uint8ClampedArray(width * height * 4);
    const set = (x: number, y: number) => {
      data[(y * width + x) * 4 + 3] = 255;
    };
    set(1, 1);
    set(2, 2);
    expect(transparentBounds(data, width, height)).toEqual({
      x: 1,
      y: 1,
      width: 2,
      height: 2,
    });
  });

  it('빈 캔버스는 null', () => {
    expect(transparentBounds(new Uint8ClampedArray(16), 2, 2)).toBeNull();
  });
});

describe('isPointInsideRect / filename', () => {
  it('좌표 포함 여부를 판단한다', () => {
    const rect = { x: 0.5, y: 0.5, width: 0.2, height: 0.2 };
    expect(isPointInsideRect(0.6, 0.6, rect)).toBe(true);
    expect(isPointInsideRect(0.1, 0.1, rect)).toBe(false);
  });

  it('파일명을 만든다', () => {
    expect(signatureFileName('계약서.pdf')).toBe('계약서-signed.pdf');
  });
});
