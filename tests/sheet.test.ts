import { describe, expect, it } from 'vitest';
import {
  columnLabel,
  formatCellValue,
  isNumericCell,
  paginate,
  sheetFileName,
} from '../src/lib/sheet';

describe('columnLabel', () => {
  it('A~Z 를 만든다', () => {
    expect(columnLabel(0)).toBe('A');
    expect(columnLabel(25)).toBe('Z');
  });

  it('AA, AB, BA 를 만든다', () => {
    expect(columnLabel(26)).toBe('AA');
    expect(columnLabel(27)).toBe('AB');
    expect(columnLabel(52)).toBe('BA');
  });

  it('음수는 A 로 보정한다', () => {
    expect(columnLabel(-5)).toBe('A');
  });
});

describe('paginate', () => {
  it('첫 페이지 범위', () => {
    expect(paginate(250, 100, 1)).toEqual({ page: 1, pageCount: 3, start: 0, end: 100 });
  });

  it('마지막 페이지는 남는 행까지만', () => {
    expect(paginate(250, 100, 3)).toEqual({ page: 3, pageCount: 3, start: 200, end: 250 });
  });

  it('범위를 벗어난 페이지를 보정한다', () => {
    expect(paginate(250, 100, 99).page).toBe(3);
    expect(paginate(250, 100, 0).page).toBe(1);
  });

  it('행이 없어도 1페이지', () => {
    expect(paginate(0, 50, 1)).toEqual({ page: 1, pageCount: 1, start: 0, end: 0 });
  });
});

describe('formatCellValue', () => {
  it('null·불리언·날짜를 처리한다', () => {
    expect(formatCellValue(null)).toBe('');
    expect(formatCellValue(true)).toBe('TRUE');
    expect(formatCellValue(new Date('2026-11-10T00:00:00Z'))).toBe('2026-11-10');
    expect(formatCellValue(1234.5)).toBe('1234.5');
  });
});

describe('isNumericCell', () => {
  it('숫자·통화·퍼센트를 인식한다', () => {
    expect(isNumericCell('1,250,000')).toBe(true);
    expect(isNumericCell('-3.5')).toBe(true);
    expect(isNumericCell('12%')).toBe(true);
    expect(isNumericCell('2026-11-10')).toBe(false);
    expect(isNumericCell('사내한정')).toBe(false);
  });
});

describe('sheetFileName', () => {
  it('원본·시트 이름으로 파일명을 만든다', () => {
    expect(sheetFileName('report.xlsx', '매출 요약', 'csv')).toBe('report-매출 요약.csv');
    expect(sheetFileName('a/b.xlsx', 'Sheet1', '.json')).toBe('a_b-Sheet1.json');
  });
});
