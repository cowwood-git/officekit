import { describe, expect, it } from 'vitest';
import { type MergeInput, mergeFileName, mergeTables, mergeToCsv } from '../src/lib/merge-tables';

const table = (name: string, headers: string[], rows: string[][]): MergeInput => ({
  name,
  headers,
  rows,
});

describe('여러 표 합치기', () => {
  it('같은 열은 하나로 모으고 행을 이어 붙인다', () => {
    const result = mergeTables([
      table('a', ['이름', '부서'], [['김', '개발']]),
      table('b', ['이름', '부서'], [['이', '디자인']]),
    ]);
    expect(result.headers).toEqual(['이름', '부서']);
    expect(result.rows).toEqual([
      ['김', '개발'],
      ['이', '디자인'],
    ]);
    expect(result.sourceRows).toBe(2);
  });

  it('다른 열은 합집합으로 만들고 빈 칸을 채운다', () => {
    const result = mergeTables([
      table('a', ['이름', '부서'], [['김', '개발']]),
      table('b', ['이름', '지역'], [['이', '서울']]),
    ]);
    expect(result.headers).toEqual(['이름', '부서', '지역']);
    expect(result.rows).toEqual([
      ['김', '개발', ''],
      ['이', '', '서울'],
    ]);
  });

  it('중복 행을 제거할 수 있다', () => {
    const result = mergeTables(
      [table('a', ['값'], [['1'], ['2']]), table('b', ['값'], [['2'], ['3']])],
      { dedupe: true },
    );
    expect(result.rows).toEqual([['1'], ['2'], ['3']]);
    expect(result.duplicateRows).toBe(1);
  });

  it('같은 표 안의 중복 열 이름을 구분한다', () => {
    const result = mergeTables([table('a', ['값', '값'], [['1', '2']])]);
    expect(result.headers).toEqual(['값', '값 (2)']);
    expect(result.rows).toEqual([['1', '2']]);
  });

  it('CSV와 파일 이름을 만든다', () => {
    const result = mergeTables([table('a', ['이름'], [['김, 옷깃']])]);
    expect(mergeToCsv(result)).toBe('이름\r\n"김, 옷깃"');
    expect(mergeFileName('csv', new Date(2026, 10, 13))).toBe('합친표-20261113.csv');
  });
});
