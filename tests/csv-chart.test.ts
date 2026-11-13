import { describe, expect, it } from 'vitest';
import {
  buildChartData,
  chartFileName,
  chartTypeLabel,
  columnProfiles,
  formatAxisNumber,
  formatChartNumber,
  formatPercent,
  limitChartPoints,
  niceScale,
  parseChartNumber,
  piePoints,
  suggestChartColumns,
} from '../src/lib/csv-chart';

describe('parseChartNumber', () => {
  it('쉼표·통화·퍼센트를 읽는다', () => {
    expect(parseChartNumber('1,200')).toBe(1200);
    expect(parseChartNumber('₩1,200')).toBe(1200);
    expect(parseChartNumber('12%')).toBe(12);
    expect(parseChartNumber('  -3.5  ')).toBe(-3.5);
  });

  it('괄호 음수를 읽는다', () => {
    expect(parseChartNumber('(1,200)')).toBe(-1200);
  });

  it('숫자가 아닌 값은 null', () => {
    expect(parseChartNumber('')).toBeNull();
    expect(parseChartNumber('사내한정')).toBeNull();
    expect(parseChartNumber('2026-11-12')).toBeNull();
    expect(parseChartNumber('1.2.3')).toBeNull();
  });
});

describe('columnProfiles', () => {
  const rows = [
    ['지역', '매출', '비고'],
    ['서울', '1,200', ''],
    ['부산', '950', '신규'],
    ['대구', '800', ''],
    ['', '', ''],
  ];

  it('열마다 숫자·문자·빈 값을 센다', () => {
    const profiles = columnProfiles(rows);
    expect(profiles[0]).toMatchObject({ label: '지역', numeric: 0, text: 3, empty: 1 });
    expect(profiles[1]).toMatchObject({ label: '매출', numeric: 3, text: 0, empty: 1 });
    expect(profiles[2]).toMatchObject({ label: '비고', numeric: 0, text: 1, empty: 3 });
  });

  it('범주와 값 열을 자동으로 고른다', () => {
    expect(suggestChartColumns(rows)).toEqual({ category: 0, value: 1 });
  });

  it('빈 표도 안전하다', () => {
    expect(columnProfiles([])).toEqual([]);
    expect(suggestChartColumns([])).toEqual({ category: 0, value: -1 });
  });
});

describe('buildChartData', () => {
  const rows = [
    ['지역', '매출'],
    ['서울', '1,200'],
    ['부산', '950'],
    ['서울', '300'],
    ['대구', '확인 필요'],
    ['', '100'],
  ];

  it('행 순서대로 점을 만든다', () => {
    const result = buildChartData(rows, { categoryColumn: 0, valueColumn: 1, aggregate: false });
    expect(result.points).toEqual([
      { label: '서울', value: 1200 },
      { label: '부산', value: 950 },
      { label: '서울', value: 300 },
      { label: '(빈 값)', value: 100 },
    ]);
    expect(result.skipped).toBe(1);
    expect(result.rows).toBe(5);
  });

  it('같은 범주를 합산한다', () => {
    const result = buildChartData(rows, { categoryColumn: 0, valueColumn: 1, aggregate: true });
    expect(result.points).toEqual([
      { label: '서울', value: 1500 },
      { label: '부산', value: 950 },
      { label: '(빈 값)', value: 100 },
    ]);
    expect(result.merged).toBe(1);
  });

  it('값 열이 없으면 빈 결과', () => {
    const result = buildChartData(rows, { categoryColumn: 0, valueColumn: -1, aggregate: false });
    expect(result.points).toEqual([]);
  });
});

describe('piePoints', () => {
  it('상위 N개만 남기고 나머지를 기타로 묶는다', () => {
    const points = [
      { label: 'a', value: 10 },
      { label: 'b', value: 30 },
      { label: 'c', value: 20 },
      { label: 'd', value: 5 },
    ];
    expect(piePoints(points, 3)).toEqual([
      { label: 'b', value: 30 },
      { label: 'c', value: 20 },
      { label: '기타', value: 15 },
    ]);
  });

  it('0 이하 값은 파이에서 뺀다', () => {
    expect(
      piePoints([
        { label: 'a', value: 10 },
        { label: 'b', value: -5 },
      ]),
    ).toEqual([{ label: 'a', value: 10 }]);
  });
});

describe('limitChartPoints', () => {
  it('막대는 큰 값 위주로 줄인다', () => {
    const points = Array.from({ length: 100 }, (_, index) => ({
      label: `c${index}`,
      value: index,
    }));
    const result = limitChartPoints(points, 'bar', 10);
    expect(result.points).toHaveLength(10);
    expect(result.points[0]?.value).toBe(99);
    expect(result.truncated).toBe(true);
  });

  it('선은 전체 구간을 고르게 샘플링한다', () => {
    const points = Array.from({ length: 1000 }, (_, index) => ({
      label: `c${index}`,
      value: index,
    }));
    const result = limitChartPoints(points, 'line', 10);
    expect(result.points).toHaveLength(10);
    expect(result.points[0]?.value).toBe(0);
    expect(result.points[9]?.value).toBe(999);
  });
});

describe('niceScale', () => {
  it('0을 포함한 보기 좋은 눈금을 만든다', () => {
    const scale = niceScale([1200, 950, 800], 5);
    expect(scale.min).toBe(0);
    expect(scale.max).toBeGreaterThanOrEqual(1200);
    expect(scale.ticks[0]).toBe(0);
    expect(scale.ticks).toContain(scale.max);
  });

  it('음수 범위도 처리한다', () => {
    const scale = niceScale([-300, 500], 5);
    expect(scale.min).toBeLessThanOrEqual(-300);
    expect(scale.max).toBeGreaterThanOrEqual(500);
    expect(scale.ticks).toContain(0);
  });

  it('모든 값이 0이어도 눈금이 있다', () => {
    const scale = niceScale([0, 0], 5);
    expect(scale.ticks.length).toBeGreaterThan(1);
  });
});

describe('format', () => {
  it('큰 수를 만·억으로 줄인다', () => {
    expect(formatAxisNumber(1200)).toBe('1,200');
    expect(formatAxisNumber(12_000)).toBe('1.2만');
    expect(formatAxisNumber(120_000_000)).toBe('1.2억');
  });

  it('일반 숫자와 퍼센트를 표시한다', () => {
    expect(formatChartNumber(1234.567)).toBe('1,234.57');
    expect(formatPercent(25, 100)).toBe('25%');
    expect(formatPercent(1, 3)).toBe('33.3%');
    expect(formatPercent(1, 0)).toBe('0%');
  });

  it('파일명과 차트 이름을 만든다', () => {
    expect(chartFileName('매출.xlsx')).toBe('매출-chart.png');
    expect(chartFileName('a/b.csv')).toBe('a_b-chart.png');
    expect(chartTypeLabel('bar')).toBe('세로 막대');
    expect(chartTypeLabel('bar-horizontal')).toBe('가로 막대');
    expect(chartTypeLabel('line')).toBe('선');
    expect(chartTypeLabel('pie')).toBe('파이');
  });
});
