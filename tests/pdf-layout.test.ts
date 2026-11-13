import { describe, expect, it } from 'vitest';
import {
  cellRects,
  fitPageOnSheet,
  gridFor,
  PAGE_SIZES,
  paginatePages,
  placePage,
  sheetCount,
  sheetSize,
} from '../src/lib/pdf-layout';

describe('page sizes', () => {
  it('A4·Letter 크기를 포인트로 제공한다', () => {
    expect(PAGE_SIZES.a4.width).toBeCloseTo(595.28);
    expect(PAGE_SIZES.letter.width).toBe(612);
  });

  it('가로 방향은 가로·세로를 바꾼다', () => {
    expect(sheetSize('a4', 'portrait')).toEqual({ width: 595.28, height: 841.89 });
    expect(sheetSize('a4', 'landscape')).toEqual({ width: 841.89, height: 595.28 });
  });
});

describe('gridFor', () => {
  it('쪽수별 행·열을 만든다', () => {
    expect(gridFor(2)).toEqual({ cols: 1, rows: 2 });
    expect(gridFor(4)).toEqual({ cols: 2, rows: 2 });
    expect(gridFor(6)).toEqual({ cols: 2, rows: 3 });
    expect(gridFor(9)).toEqual({ cols: 3, rows: 3 });
  });

  it('가로 방향은 행·열을 바꾼다', () => {
    expect(gridFor(2, 'landscape')).toEqual({ cols: 2, rows: 1 });
    expect(gridFor(6, 'landscape')).toEqual({ cols: 3, rows: 2 });
  });
});

describe('cellRects', () => {
  it('여백과 간격을 반영해 위에서 아래로 만든다', () => {
    const cells = cellRects(1000, 1000, 2, 2, 50, 20);
    expect(cells).toHaveLength(4);
    expect(cells[0]).toEqual({ x: 50, y: 510, width: 440, height: 440 });
    expect(cells[1]?.x).toBe(510);
    expect(cells[2]?.y).toBe(50);
  });

  it('잘못된 행·열은 1로 보정한다', () => {
    expect(cellRects(100, 100, 0, -1, 10, 5)).toHaveLength(1);
  });
});

describe('placePage', () => {
  const cell = { x: 10, y: 20, width: 400, height: 300 };

  it('가로세로 비율을 유지해 가운데 배치한다', () => {
    const placement = placePage(100, 200, 0, cell);
    expect(placement.width).toBe(150);
    expect(placement.height).toBe(300);
    expect(placement.x).toBe(135);
    expect(placement.y).toBe(20);
    expect(placement.rotate).toBe(0);
  });

  it('90도 회전 페이지는 표시 크기를 기준으로 맞춘다', () => {
    const placement = placePage(100, 200, 90, cell);
    expect(placement.width).toBe(200);
    expect(placement.height).toBe(400);
    expect(placement.rotate).toBe(-90);
  });

  it('270도 회전은 반대 각도로 그린다', () => {
    expect(placePage(100, 200, 270, cell).rotate).toBe(90);
    expect(placePage(100, 200, 180, cell).rotate).toBe(180);
  });
});

describe('paginatePages / sheetCount', () => {
  it('쪽수를 시트 단위로 나눈다', () => {
    expect(paginatePages(5, 4)).toEqual([[0, 1, 2, 3], [4]]);
    expect(sheetCount(5, 4)).toBe(2);
    expect(sheetCount(0, 4)).toBe(0);
  });
});

describe('fitPageOnSheet', () => {
  it('새 용지 안에 여백을 두고 맞춘다', () => {
    const placement = fitPageOnSheet(595, 842, 0, 595, 842, 20);
    expect(placement.width).toBeCloseTo(555);
    expect(placement.height).toBeCloseTo(785.4, 0);
    expect(placement.x).toBeCloseTo(20);
  });
});
