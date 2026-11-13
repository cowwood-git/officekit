import { describe, expect, it } from 'vitest';
import {
  type PivotOptions,
  parseNumeric,
  pivotFileName,
  pivotTable,
  pivotToCsv,
} from '../src/lib/csv-pivot';

const rows = [
  ['지역', '제품', '금액'],
  ['서울', 'A', '100'],
  ['서울', 'B', '200'],
  ['부산', 'A', '300'],
  ['부산', 'A', '150'],
];

const options: PivotOptions = {
  rowColumn: 0,
  columnColumn: 1,
  valueColumn: 2,
  aggregate: 'sum',
  includeTotals: false,
};

describe('parseNumeric', () => {
  it('쉼표·원을 제거한다', () => {
    expect(parseNumeric('1,200원')).toBe(1200);
    expect(parseNumeric('')).toBeNull();
    expect(parseNumeric('가')).toBeNull();
  });
});

describe('pivotTable', () => {
  it('행·열 교차 합계를 계산한다', () => {
    const result = pivotTable(rows, options);
    expect(result.headers).toEqual(['지역', 'A', 'B']);
    expect(result.rowLabels).toEqual(['부산', '서울']);
    expect(result.rows).toEqual([
      ['부산', '450', '0'],
      ['서울', '100', '200'],
    ]);
  });

  it('합계 행·열을 추가한다', () => {
    const result = pivotTable(rows, { ...options, includeTotals: true });
    expect(result.headers).toEqual(['지역', 'A', 'B', '합계']);
    expect(result.rows[0]).toEqual(['부산', '450', '0', '450']);
    expect(result.rows[2]).toEqual(['합계', '550', '200', '750']);
  });

  it('개수·평균·최소·최대를 계산한다', () => {
    expect(pivotTable(rows, { ...options, aggregate: 'count' }).rows[0]).toEqual([
      '부산',
      '2',
      '0',
    ]);
    expect(pivotTable(rows, { ...options, aggregate: 'avg' }).rows[0]).toEqual([
      '부산',
      '225',
      '0',
    ]);
    expect(pivotTable(rows, { ...options, aggregate: 'max' }).rows[1]).toEqual([
      '서울',
      '100',
      '200',
    ]);
  });

  it('데이터가 부족하면 빈 결과', () => {
    expect(pivotTable([], options).rows).toEqual([]);
  });
});

describe('pivotToCsv', () => {
  it('CSV로 직렬화한다', () => {
    const csv = pivotToCsv(pivotTable(rows, options));
    expect(csv.split('\n')[0]).toBe('지역,A,B');
    expect(csv).toContain('부산,450,0');
  });

  it('파일명을 만든다', () => {
    expect(pivotFileName('매출.csv')).toBe('매출-pivot.csv');
  });
});
