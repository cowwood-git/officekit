import { describe, expect, it } from 'vitest';
import {
  anchorFor,
  clampNumberMargin,
  clampNumberSize,
  clampStartNumber,
  mapAnchorToPage,
  pageNumberFileName,
  pageNumberLabel,
  parseHexColor,
} from '../src/lib/pdf-page-number';

describe('pageNumberLabel', () => {
  it('형식별로 번호를 만든다', () => {
    expect(pageNumberLabel(1, 5, 'number')).toBe('1');
    expect(pageNumberLabel(3, 5, 'fraction')).toBe('3 / 5');
    expect(pageNumberLabel(3, 5, 'page-of')).toBe('Page 3 of 5');
    expect(pageNumberLabel(3, 5, 'dash')).toBe('- 3 -');
  });

  it('시작 번호를 반영한다', () => {
    expect(pageNumberLabel(2, 5, 'number', 10)).toBe('11');
    expect(pageNumberLabel(1, 5, 'number', 0)).toBe('0');
  });
});

describe('clamp helpers', () => {
  it('번호·크기·여백을 안전한 범위로 보정한다', () => {
    expect(clampStartNumber(-5)).toBe(0);
    expect(clampStartNumber(Number.NaN)).toBe(1);
    expect(clampNumberSize(2)).toBe(6);
    expect(clampNumberSize(99)).toBe(36);
    expect(clampNumberMargin(-10)).toBe(0);
    expect(clampNumberMargin(999)).toBe(120);
  });
});

describe('anchorFor', () => {
  it('여섯 위치의 기준점을 계산한다', () => {
    expect(anchorFor(600, 800, 'bottom-center', 30, 100, 12)).toEqual({ x: 250, y: 30 });
    expect(anchorFor(600, 800, 'bottom-right', 30, 100, 12)).toEqual({ x: 470, y: 30 });
    expect(anchorFor(600, 800, 'top-left', 30, 100, 12)).toEqual({ x: 30, y: 758 });
    expect(anchorFor(600, 800, 'top-center', 30, 100, 12)).toEqual({ x: 250, y: 758 });
  });

  it('좁은 페이지에서도 음수 좌표를 만들지 않는다', () => {
    const anchor = anchorFor(80, 80, 'top-right', 30, 100, 12);
    expect(anchor.x).toBeGreaterThanOrEqual(30);
    expect(anchor.y).toBeGreaterThanOrEqual(30);
  });
});

describe('mapAnchorToPage', () => {
  it('회전 0도는 그대로 둔다', () => {
    expect(mapAnchorToPage(595, 842, 0, 100, 20)).toEqual({
      x: 100,
      y: 20,
      rotate: 0,
    });
  });

  it('90도 회전 페이지의 좌표와 각도를 되돌린다', () => {
    expect(mapAnchorToPage(595, 842, 90, 100, 20)).toEqual({
      x: 575,
      y: 100,
      rotate: 90,
    });
  });

  it('180·270도도 계산한다', () => {
    expect(mapAnchorToPage(595, 842, 180, 100, 20)).toEqual({
      x: 495,
      y: 822,
      rotate: 180,
    });
    expect(mapAnchorToPage(595, 842, 270, 100, 20)).toEqual({
      x: 20,
      y: 742,
      rotate: -90,
    });
  });
});

describe('parseHexColor', () => {
  it('6자리 HEX를 0~1 RGB로 바꾼다', () => {
    expect(parseHexColor('#ff0000')).toEqual({ r: 1, g: 0, b: 0 });
    expect(parseHexColor('000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('잘못된 값은 검정으로 본다', () => {
    expect(parseHexColor('red')).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe('pageNumberFileName', () => {
  it('결과 파일명을 만든다', () => {
    expect(pageNumberFileName('보고서.pdf')).toBe('보고서-numbered.pdf');
  });
});
