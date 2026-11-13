import { describe, expect, it } from 'vitest';
import { type JoinOptions, joinFileName, joinTables, joinToCsv } from '../src/lib/csv-join';

const left = [
  ['사번', '이름', '부서'],
  ['1', '김오피스', '개발'],
  ['2', '이데이터', '영업'],
  ['3', '박없음', '영업'],
];
const right = [
  ['사번', '이메일', '연락처'],
  ['1', 'a@officekit.kr', '010-1111-1111'],
  ['2', 'b@officekit.kr', '010-2222-2222'],
  ['4', 'd@officekit.kr', '010-4444-4444'],
];

const options: JoinOptions = { leftKey: 0, rightKey: 0, type: 'inner' };

describe('joinTables inner', () => {
  it('키가 일치하는 행만 결합한다', () => {
    const result = joinTables(left, right, options);
    expect(result.headers).toEqual(['사번', '이름', '부서', '이메일', '연락처']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual(['1', '김오피스', '개발', 'a@officekit.kr', '010-1111-1111']);
    expect(result.matched).toBe(2);
    expect(result.leftOnly).toBe(1);
  });
});

describe('joinTables left/full', () => {
  it('왼쪽 기준 조인은 빈 값을 채운다', () => {
    const result = joinTables(left, right, { ...options, type: 'left' });
    expect(result.rows).toHaveLength(3);
    expect(result.rows[2]).toEqual(['3', '박없음', '영업', '', '']);
  });

  it('전체 조인은 오른쪽에만 있는 행도 포함한다', () => {
    const result = joinTables(left, right, { ...options, type: 'full' });
    expect(result.rows).toHaveLength(4);
    expect(result.rows[3]).toEqual(['4', '', '', 'd@officekit.kr', '010-4444-4444']);
    expect(result.rightOnly).toBe(1);
  });

  it('한쪽 표가 비면 빈 결과', () => {
    expect(joinTables([], right, options).rows).toEqual([]);
  });
});

describe('CSV serialization', () => {
  it('파이프·쉼표를 이스케이프한다', () => {
    const result = joinTables(
      [
        ['키', '메모'],
        ['1', '쉼표, 있음'],
      ],
      [
        ['키', '값'],
        ['1', '그는 "개발자"'],
      ],
      options,
    );
    const csv = joinToCsv(result);
    expect(csv).toContain('"쉼표, 있음"');
    expect(csv).toContain('"그는 ""개발자"""');
  });

  it('파일명을 만든다', () => {
    expect(joinFileName('명단.csv')).toBe('명단-joined.csv');
  });
});
