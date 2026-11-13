import { describe, expect, it } from 'vitest';
import { analyzeTable, parseNumber, statsFileName, statsToCsv } from '../src/lib/csv-stats';

describe('CSV 통계', () => {
  it('쉼표·통화·퍼센트 숫자를 읽는다', () => {
    expect(parseNumber('1,200')).toBe(1200);
    expect(parseNumber('₩ 3,500')).toBe(3500);
    expect(parseNumber('12.5%')).toBe(12.5);
    expect(parseNumber('(1,000)')).toBe(-1000);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('사과')).toBeNull();
  });

  it('숫자 열과 문자 열을 구분해 요약한다', () => {
    const stats = analyzeTable([
      ['이름', '점수', '부서'],
      ['김', '80', '개발'],
      ['이', '90', '개발'],
      ['박', '', '디자인'],
      ['최', '100', '개발'],
    ]);
    expect(stats.rowCount).toBe(4);
    const name = stats.columns[0];
    const score = stats.columns[1];
    const team = stats.columns[2];
    expect(name?.type).toBe('text');
    expect(score?.type).toBe('numeric');
    expect(score?.numeric).toMatchObject({
      count: 3,
      missing: 1,
      min: 80,
      max: 100,
      mean: 90,
      median: 90,
    });
    expect(team?.top[0]).toEqual({ value: '개발', count: 3, percent: 75 });
  });

  it('상관관계를 계산한다', () => {
    const stats = analyzeTable([
      ['x', 'y'],
      ['1', '2'],
      ['2', '4'],
      ['3', '6'],
    ]);
    expect(stats.correlations[0]).toMatchObject({ x: 'x', y: 'y', r: 1, count: 3 });
  });

  it('머리글 없이도 읽는다', () => {
    const stats = analyzeTable(
      [
        ['1', '가'],
        ['2', '나'],
      ],
      { headerRow: false },
    );
    expect(stats.headers).toEqual(['열 1', '열 2']);
    expect(stats.rowCount).toBe(2);
    expect(stats.columns[0]?.type).toBe('numeric');
  });

  it('요약 CSV와 파일 이름을 만든다', () => {
    const stats = analyzeTable([['값'], ['1'], ['2']]);
    const csv = statsToCsv(stats);
    expect(csv).toContain('열,유형,값 수');
    expect(csv).toContain('값,숫자,2');
    expect(statsFileName('sales.xlsx')).toBe('sales-통계.csv');
  });
});
