import { describe, expect, it } from 'vitest';
import {
  extractPalette,
  formatHsl,
  hexToRgb,
  inkFor,
  paletteCss,
  rgbToHex,
  rgbToHsl,
} from '../src/lib/color-palette';

function pixels(colors: [number, number, number, number][], repeat: number[]): Uint8ClampedArray {
  const out: number[] = [];
  colors.forEach((color, index) => {
    for (let i = 0; i < (repeat[index] ?? 1); i += 1) out.push(...color);
  });
  return new Uint8ClampedArray(out);
}

describe('color-palette', () => {
  it('표기 변환', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 16 })).toBe('#FF0010');
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('zz')).toBeNull();
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(formatHsl({ r: 0, g: 0, b: 255 })).toBe('hsl(240, 100%, 50%)');
    expect(rgbToHsl({ r: 128, g: 128, b: 128 }).s).toBe(0);
  });

  it('글자색', () => {
    expect(inkFor({ r: 255, g: 255, b: 255 })).toBe('#000000');
    expect(inkFor({ r: 10, g: 20, b: 60 })).toBe('#FFFFFF');
  });

  it('많이 쓰인 색 순서로 뽑고, 투명 픽셀은 뺀다', () => {
    const data = pixels(
      [
        [255, 0, 0, 255],
        [0, 0, 255, 255],
        [0, 255, 0, 0],
      ],
      [60, 30, 500],
    );
    const palette = extractPalette(data, 2);
    expect(palette).toHaveLength(2);
    expect(rgbToHex(palette[0] as never)).toBe('#FF0000');
    expect(rgbToHex(palette[1] as never)).toBe('#0000FF');
    expect(palette[0]?.share).toBeCloseTo(60 / 90);
  });

  it('색 수가 모자라면 있는 만큼만, 다 투명이면 빈 배열', () => {
    const single = pixels([[5, 5, 5, 255]], [10]);
    expect(extractPalette(single, 6).length).toBeGreaterThanOrEqual(1);
    expect(extractPalette(pixels([[0, 0, 0, 0]], [10]), 4)).toEqual([]);
  });

  it('CSS 변수', () => {
    expect(paletteCss([{ r: 0, g: 0, b: 0 }])).toBe(':root {\n  --color-1: #000000;\n}');
  });
});
