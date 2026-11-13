import { describe, expect, it } from 'vitest';
import {
  conversionDirection,
  csvFileName,
  defaultSheetName,
  delimiterChar,
  directionLabel,
  previewWindow,
  trimEmptyEdges,
  withBom,
  xlsxFileName,
} from '../src/lib/csv-xlsx';

describe('conversionDirection', () => {
  it('CSV·TSV는 XLSX로, 엑셀 파일은 CSV로 보낸다', () => {
    expect(conversionDirection('명단.csv')).toBe('to-xlsx');
    expect(conversionDirection('명단.TSV')).toBe('to-xlsx');
    expect(conversionDirection('명단.xlsx')).toBe('to-csv');
    expect(conversionDirection('명단.xls')).toBe('to-csv');
    expect(conversionDirection('명단.ods')).toBe('to-csv');
  });

  it('지원하지 않는 형식은 null', () => {
    expect(conversionDirection('명단.pdf')).toBeNull();
    expect(conversionDirection('명단.csvx')).toBeNull();
  });
});

describe('defaultSheetName', () => {
  it('파일명에서 시트 이름을 만든다', () => {
    expect(defaultSheetName('2026 매출.xlsx')).toBe('2026 매출');
  });

  it('금지 문자를 지우고 31자로 자른다', () => {
    expect(defaultSheetName('a/b:c*?[d].csv')).toBe('a b c d');
    expect(defaultSheetName(`${'가'.repeat(40)}.csv`)).toHaveLength(31);
  });

  it('빈 이름은 Sheet1', () => {
    expect(defaultSheetName('.csv')).toBe('Sheet1');
    expect(defaultSheetName('   ')).toBe('Sheet1');
  });
});

describe('file names', () => {
  it('XLSX 파일명을 만든다', () => {
    expect(xlsxFileName('명단.csv')).toBe('명단.xlsx');
    expect(xlsxFileName('a/b.csv')).toBe('a_b.xlsx');
  });

  it('CSV 파일명에 시트 이름을 붙인다', () => {
    expect(csvFileName('매출.xlsx', '1월')).toBe('매출-1월.csv');
    expect(csvFileName('a/b.xlsx', 'Sheet1')).toBe('a_b-Sheet1.csv');
  });
});

describe('delimiter', () => {
  it('구분자를 문자로 바꾼다', () => {
    expect(delimiterChar('comma')).toBe(',');
    expect(delimiterChar('tab')).toBe('\t');
    expect(delimiterChar('semicolon')).toBe(';');
  });
});

describe('withBom', () => {
  it('BOM을 앞에 붙인다', () => {
    expect(withBom('이름,금액', true)).toBe('\uFEFF이름,금액');
    expect(withBom('이름,금액', false)).toBe('이름,금액');
  });
});

describe('directionLabel', () => {
  it('파일 형식에 맞는 방향을 보여 준다', () => {
    expect(directionLabel('to-xlsx', 'a.csv')).toBe('CSV → XLSX');
    expect(directionLabel('to-xlsx', 'a.tsv')).toBe('TSV → XLSX');
    expect(directionLabel('to-csv', 'a.xlsx')).toBe('XLSX → CSV');
    expect(directionLabel('to-csv', 'a.xls')).toBe('XLS → CSV');
    expect(directionLabel('to-csv', 'a.ods')).toBe('ODS → CSV');
  });
});

describe('trimEmptyEdges', () => {
  it('끝의 빈 행과 빈 열을 제거한다', () => {
    expect(
      trimEmptyEdges([
        ['이름', '금액', ''],
        ['김', '1000', ''],
        ['', '', ''],
      ]),
    ).toEqual([
      ['이름', '금액'],
      ['김', '1000'],
    ]);
  });

  it('중간 빈 행은 남긴다', () => {
    expect(trimEmptyEdges([['a'], [''], ['b']])).toEqual([['a'], [''], ['b']]);
  });

  it('빈 표는 빈 배열', () => {
    expect(trimEmptyEdges([])).toEqual([]);
    expect(trimEmptyEdges([[''], ['']])).toEqual([]);
  });
});

describe('previewWindow', () => {
  it('미리보기 행·열과 잘림 여부를 계산한다', () => {
    expect(previewWindow(100, 30)).toEqual({ rows: 20, columns: 12, truncated: true });
    expect(previewWindow(5, 3)).toEqual({ rows: 5, columns: 3, truncated: false });
  });
});
