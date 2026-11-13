import { describe, expect, it } from 'vitest';
import { type CsvCleanOptions, cleanTable, headerLabels, toCsv } from '../src/lib/csv-clean';

const rows = [
  [' 이름 ', '부서', '금액'],
  [' 김오피스 ', '개발', '1,200,000'],
  ['이데이터', '영업', '950000'],
  ['김오피스', '개발', '1,200,000'],
  ['', '', ''],
  ['박영업', '영업', '800000'],
];

const base: CsvCleanOptions = {
  trim: true,
  removeEmptyRows: true,
  dedupe: true,
  filterColumn: -1,
  filterOperator: 'contains',
  filterValue: '',
  sortColumn: -1,
  sortDirection: 'asc',
  numericSort: false,
};

describe('cleanTable', () => {
  it('공백·빈 행·중복을 제거한다', () => {
    const result = cleanTable(rows, base);
    expect(result.rows[0]).toEqual(['이름', '부서', '금액']);
    expect(result.stats.inputRows).toBe(5);
    expect(result.stats.emptyRemoved).toBe(1);
    expect(result.stats.duplicatesRemoved).toBe(1);
    expect(result.stats.outputRows).toBe(3);
    expect(result.rows[1]).toEqual(['김오피스', '개발', '1,200,000']);
  });

  it('필터를 적용한다', () => {
    const result = cleanTable(rows, {
      ...base,
      filterColumn: 1,
      filterOperator: 'equals',
      filterValue: '영업',
    });
    expect(result.stats.filteredOut).toBe(1);
    expect(result.rows.slice(1).every((row) => row[1] === '영업')).toBe(true);
  });

  it('숫자 정렬은 쉼표를 무시한다', () => {
    const result = cleanTable(rows, {
      ...base,
      sortColumn: 2,
      sortDirection: 'desc',
      numericSort: true,
    });
    expect(result.rows.slice(1).map((row) => row[2])).toEqual(['1,200,000', '950000', '800000']);
  });

  it('문자 정렬은 한국어 로캘과 숫자를 함께 처리한다', () => {
    const result = cleanTable([['이름'], ['10번'], ['2번'], ['가나']], { ...base, sortColumn: 0 });
    expect(result.rows.slice(1).map((row) => row[0])).toEqual(['2번', '10번', '가나']);
  });

  it('빈 표도 안전하게 처리한다', () => {
    const result = cleanTable([], base);
    expect(result.rows).toEqual([]);
    expect(result.stats.outputRows).toBe(0);
  });
});

describe('headerLabels', () => {
  it('빈 헤더에 열 번호를 붙인다', () => {
    expect(headerLabels(['이름', '', '금액'])).toEqual(['이름', '열 2', '금액']);
  });
});

describe('toCsv', () => {
  it('쉼표·따옴표·줄바꿈을 이스케이프한다', () => {
    const csv = toCsv([
      ['이름', '메모'],
      ['김,오피스', '그는 "개발자"입니다'],
      ['줄\n바꿈', ''],
    ]);
    expect(csv).toBe('이름,메모\n"김,오피스","그는 ""개발자""입니다"\n"줄\n바꿈",');
  });
});
