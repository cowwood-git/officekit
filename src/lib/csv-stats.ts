/** CSV 통계 — 숫자 요약·빈도·상관관계를 브라우저에서 계산한다. */

export interface NumericSummary {
  count: number;
  missing: number;
  unique: number;
  min: number;
  max: number;
  sum: number;
  mean: number;
  median: number;
  stddev: number;
  q1: number;
  q3: number;
}

export interface Frequency {
  value: string;
  count: number;
  percent: number;
}

export interface ColumnSummary {
  index: number;
  header: string;
  type: 'numeric' | 'text' | 'empty';
  nonEmpty: number;
  missing: number;
  unique: number;
  numeric?: NumericSummary;
  top: Frequency[];
}

export interface Correlation {
  x: string;
  y: string;
  r: number | null;
  count: number;
}

export interface TableStats {
  headers: string[];
  rowCount: number;
  columns: ColumnSummary[];
  correlations: Correlation[];
  numericHeaders: string[];
}

export const MAX_STATS_ROWS = 100_000;
export const MAX_STATS_BYTES = 50 * 1024 * 1024;
export const MAX_CORRELATION_COLUMNS = 8;

/** 쉼표·통화 기호·퍼센트를 허용해 숫자로 읽는다. 실패하면 null. */
export function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let text = trimmed.replace(/[,\s₩$€£¥]/g, '');
  const negativeParens = /^\((.*)\)$/.exec(text);
  if (negativeParens) text = `-${negativeParens[1] ?? ''}`;
  const percent = text.endsWith('%');
  if (percent) text = text.slice(0, -1);
  if (!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0] ?? 0;
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const weight = position - lower;
  return (sorted[lower] ?? 0) * (1 - weight) + (sorted[upper] ?? 0) * weight;
}

function numericSummary(
  values: readonly number[],
  missing: number,
  unique: number,
): NumericSummary {
  const sorted = [...values].sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((total, value) => total + value, 0);
  const mean = count > 0 ? sum / count : 0;
  const variance =
    count > 1 ? values.reduce((total, value) => total + (value - mean) ** 2, 0) / (count - 1) : 0;
  return {
    count,
    missing,
    unique,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    sum,
    mean,
    median: quantile(sorted, 0.5),
    stddev: Math.sqrt(variance),
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
  };
}

function topValues(values: readonly string[], total: number): Frequency[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .slice(0, 5)
    .map(([value, count]) => ({
      value,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }));
}

function pearson(pairs: ReadonlyArray<readonly [number, number]>): number | null {
  if (pairs.length < 2) return null;
  const n = pairs.length;
  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of pairs) {
    sumX += x;
    sumY += y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (const [x, y] of pairs) {
    const dx = x - meanX;
    const dy = y - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }
  if (varianceX === 0 || varianceY === 0) return null;
  return covariance / Math.sqrt(varianceX * varianceY);
}

/** 첫 행을 머리글로 보고 각 열의 숫자 요약·빈도·상관관계를 계산한다. */
export function analyzeTable(
  rows: readonly (readonly string[])[],
  options: { headerRow?: boolean } = {},
): TableStats {
  const headerRow = options.headerRow ?? true;
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const headers = headerRow
    ? Array.from(
        { length: maxColumns },
        (_, index) => (rows[0]?.[index] ?? '').trim() || `열 ${index + 1}`,
      )
    : Array.from({ length: maxColumns }, (_, index) => `열 ${index + 1}`);
  const data = headerRow ? rows.slice(1) : rows;
  const columns: ColumnSummary[] = [];
  const numericColumns: Array<{ index: number; header: string; values: Array<number | null> }> = [];

  for (let index = 0; index < maxColumns; index += 1) {
    const values = data.map((row) => (row[index] ?? '').trim());
    const nonEmpty = values.filter(Boolean);
    const missing = data.length - nonEmpty.length;
    const unique = new Set(nonEmpty).size;
    const numbers = values.map((value) => (value ? parseNumber(value) : null));
    const numericValues = numbers.filter((value): value is number => value !== null);
    const numeric = nonEmpty.length > 0 && numericValues.length / nonEmpty.length >= 0.8;
    const header = headers[index] ?? `열 ${index + 1}`;

    if (numeric) {
      columns.push({
        index,
        header,
        type: 'numeric',
        nonEmpty: nonEmpty.length,
        missing,
        unique,
        numeric: numericSummary(numericValues, missing, unique),
        top: [],
      });
      numericColumns.push({ index, header, values: numbers });
    } else {
      columns.push({
        index,
        header,
        type: nonEmpty.length > 0 ? 'text' : 'empty',
        nonEmpty: nonEmpty.length,
        missing,
        unique,
        top: topValues(nonEmpty, nonEmpty.length),
      });
    }
  }

  const correlations: Correlation[] = [];
  const limited = numericColumns.slice(0, MAX_CORRELATION_COLUMNS);
  for (let x = 0; x < limited.length; x += 1) {
    for (let y = x + 1; y < limited.length; y += 1) {
      const left = limited[x];
      const right = limited[y];
      if (!left || !right) continue;
      const pairs: Array<readonly [number, number]> = [];
      for (let row = 0; row < data.length; row += 1) {
        const a = left.values[row];
        const b = right.values[row];
        if (a !== null && a !== undefined && b !== null && b !== undefined) pairs.push([a, b]);
      }
      correlations.push({
        x: left.header,
        y: right.header,
        r: pearson(pairs),
        count: pairs.length,
      });
    }
  }

  return {
    headers,
    rowCount: data.length,
    columns,
    correlations,
    numericHeaders: numericColumns.map((column) => column.header),
  };
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function statsToCsv(stats: TableStats): string {
  const header = [
    '열',
    '유형',
    '값 수',
    '결측',
    '고유값',
    '최소',
    '최대',
    '합계',
    '평균',
    '중앙값',
    '표준편차',
    'Q1',
    'Q3',
    '상위값',
  ];
  const rows = stats.columns.map((column) => {
    const numeric = column.numeric;
    return [
      column.header,
      column.type === 'numeric' ? '숫자' : column.type === 'text' ? '문자' : '빈 열',
      String(column.nonEmpty),
      String(column.missing),
      String(column.unique),
      numeric ? String(numeric.min) : '',
      numeric ? String(numeric.max) : '',
      numeric ? String(numeric.sum) : '',
      numeric ? String(numeric.mean) : '',
      numeric ? String(numeric.median) : '',
      numeric ? String(numeric.stddev) : '',
      numeric ? String(numeric.q1) : '',
      numeric ? String(numeric.q3) : '',
      column.top.map((item) => `${item.value} (${item.count})`).join(' / '),
    ];
  });
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
}

export function statsFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim() || 'table';
  return `${base}-통계.csv`;
}
