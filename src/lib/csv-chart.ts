import { safeFileName } from './files';

export type ChartType = 'bar' | 'bar-horizontal' | 'line' | 'pie';
export type ChartPalette = 'default' | 'warm' | 'mono';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartData {
  points: ChartPoint[];
  /** 숫자로 읽지 못해 제외한 행 수 */
  skipped: number;
  /** 머리글을 뺀 전체 행 수 */
  rows: number;
  /** 같은 이름을 합쳤을 때 합쳐진 행 수 */
  merged: number;
}

export interface ChartOptions {
  categoryColumn: number;
  valueColumn: number;
  /** 같은 이름의 범주를 합산한다. */
  aggregate: boolean;
}

export interface ColumnProfile {
  index: number;
  label: string;
  numeric: number;
  text: number;
  empty: number;
  total: number;
}

export interface ChartScale {
  min: number;
  max: number;
  step: number;
  ticks: number[];
}

export const PALETTES: Record<ChartPalette, string[]> = {
  default: [
    '#2563eb',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#f97316',
    '#84cc16',
    '#ec4899',
    '#14b8a6',
  ],
  warm: [
    '#b45309',
    '#dc2626',
    '#d97706',
    '#ea580c',
    '#a16207',
    '#be123c',
    '#c2410c',
    '#92400e',
    '#e11d48',
    '#f59e0b',
  ],
  mono: [
    '#0f172a',
    '#334155',
    '#475569',
    '#64748b',
    '#94a3b8',
    '#1e293b',
    '#cbd5e1',
    '#e2e8f0',
    '#475569',
    '#64748b',
  ],
};

const NUMBER_PATTERN = /^\(?-?[\d,.]+\)?%?$/;

/** "1,200", "₩1,200", "12%", "(1,200)" 같은 표시값을 숫자로 바꾼다. */
export function parseChartNumber(text: string): number | null {
  const raw = text.trim();
  if (raw === '') return null;

  let value = raw.replace(/[\s₩$€£¥원]/g, '');
  if (value.endsWith('%')) value = value.slice(0, -1);
  let negative = false;
  if (value.startsWith('(') && value.endsWith(')')) {
    negative = true;
    value = value.slice(1, -1);
  }
  value = value.replace(/,/g, '');
  if (!NUMBER_PATTERN.test(raw) && !/^-?[\d.]+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
}

/** 머리글을 뺀 데이터로 열마다 숫자·문자 비율을 계산한다. */
export function columnProfiles(rows: string[][]): ColumnProfile[] {
  if (rows.length === 0) return [];
  const header = rows[0] ?? [];
  const data = rows.slice(1);
  const width = Math.max(header.length, ...data.map((row) => row.length), 0);

  const profiles: ColumnProfile[] = [];
  for (let index = 0; index < width; index += 1) {
    let numeric = 0;
    let text = 0;
    let empty = 0;
    for (const row of data) {
      const cell = (row[index] ?? '').trim();
      if (cell === '') {
        empty += 1;
      } else if (parseChartNumber(cell) !== null) {
        numeric += 1;
      } else {
        text += 1;
      }
    }
    profiles.push({
      index,
      label: (header[index] ?? '').trim() || `열 ${index + 1}`,
      numeric,
      text,
      empty,
      total: data.length,
    });
  }
  return profiles;
}

/** 범주 열은 글자가 많은 열, 값 열은 숫자가 많은 열로 자동 제안한다. */
export function suggestChartColumns(rows: string[][]): { category: number; value: number } {
  const profiles = columnProfiles(rows);
  if (profiles.length === 0) return { category: 0, value: -1 };
  const nonEmpty = (profile: ColumnProfile) => profile.total - profile.empty;
  const category =
    profiles.find((profile) => nonEmpty(profile) > 0 && profile.numeric <= profile.text)?.index ??
    0;
  const value =
    profiles.find(
      (profile) =>
        profile.index !== category && nonEmpty(profile) > 0 && profile.numeric > profile.text,
    )?.index ??
    profiles.find((profile) => profile.index !== category && nonEmpty(profile) > 0)?.index ??
    -1;
  return { category, value };
}

/** 표에서 차트에 쓸 범주·값 쌍을 만든다. */
export function buildChartData(rows: string[][], options: ChartOptions): ChartData {
  const data = rows.slice(1);
  if (options.valueColumn < 0) return { points: [], skipped: 0, rows: data.length, merged: 0 };

  if (!options.aggregate) {
    const points: ChartPoint[] = [];
    let skipped = 0;
    for (const row of data) {
      const label = (row[options.categoryColumn] ?? '').trim() || '(빈 값)';
      const value = parseChartNumber(row[options.valueColumn] ?? '');
      if (value === null) {
        skipped += 1;
        continue;
      }
      points.push({ label, value });
    }
    return { points, skipped, rows: data.length, merged: 0 };
  }

  const buckets = new Map<string, number>();
  let skipped = 0;
  let valid = 0;
  for (const row of data) {
    const label = (row[options.categoryColumn] ?? '').trim() || '(빈 값)';
    const value = parseChartNumber(row[options.valueColumn] ?? '');
    if (value === null) {
      skipped += 1;
      continue;
    }
    valid += 1;
    buckets.set(label, (buckets.get(label) ?? 0) + value);
  }
  return {
    points: [...buckets].map(([label, value]) => ({ label, value })),
    skipped,
    rows: data.length,
    merged: Math.max(0, valid - buckets.size),
  };
}

/** 파이 차트는 상위 N개만 남기고 나머지를 기타로 묶는다. */
export function piePoints(points: ChartPoint[], maxSlices = 8): ChartPoint[] {
  const positive = points.filter((point) => point.value > 0);
  if (positive.length <= maxSlices) return positive;
  const sorted = [...positive].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, Math.max(1, maxSlices) - 1);
  const rest = sorted.slice(Math.max(1, maxSlices) - 1);
  const etc = rest.reduce((sum, point) => sum + point.value, 0);
  return [...head, { label: '기타', value: etc }];
}

/** 막대·선 차트의 점이 너무 많으면 읽을 수 있는 수로 줄인다. */
export function limitChartPoints(
  points: ChartPoint[],
  type: ChartType,
  max = type === 'line' ? 500 : 60,
): { points: ChartPoint[]; truncated: boolean } {
  if (type === 'pie') {
    const limited = piePoints(points, max);
    return {
      points: limited,
      truncated: limited.length < points.filter((p) => p.value > 0).length,
    };
  }
  if (points.length <= max) return { points, truncated: false };

  if (type === 'line') {
    const step = (points.length - 1) / Math.max(1, max - 1);
    const sampled: ChartPoint[] = [];
    for (let index = 0; index < max; index += 1) {
      const point = points[Math.min(points.length - 1, Math.round(index * step))];
      if (point) sampled.push(point);
    }
    return { points: sampled, truncated: true };
  }

  const sorted = [...points].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, max);
  return { points: sorted, truncated: true };
}

function niceNumber(range: number, round: boolean): number {
  if (range <= 0 || !Number.isFinite(range)) return 1;
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  let nice: number;
  if (round) {
    if (fraction < 1.5) nice = 1;
    else if (fraction < 3) nice = 2;
    else if (fraction < 7) nice = 5;
    else nice = 10;
  } else if (fraction <= 1) nice = 1;
  else if (fraction <= 2) nice = 2;
  else if (fraction <= 5) nice = 5;
  else nice = 10;
  return nice * 10 ** exponent;
}

function roundTick(value: number): number {
  return Number(value.toPrecision(12));
}

/** 축 눈금을 보기 좋은 숫자로 만든다. 0을 포함한다. */
export function niceScale(values: number[], tickCount = 5): ChartScale {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return { min: 0, max: 1, step: 1, ticks: [0, 1] };

  const min = Math.min(0, ...finite);
  let max = Math.max(0, ...finite);
  if (min === max) max = min + 1;

  const range = niceNumber(max - min, false);
  const step = niceNumber(range / Math.max(1, tickCount - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = niceMin; value <= niceMax + step / 2; value += step) {
    ticks.push(roundTick(value));
    if (ticks.length > 50) break;
  }
  return { min: niceMin, max: niceMax, step, ticks };
}

function plainNumber(value: number, digits = 2): string {
  const rounded = Number(value.toFixed(digits));
  const [integer = '0', fraction] = String(rounded).split('.');
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction ? `${formatted}.${fraction}` : formatted;
}

/** 축·표 레이블용 숫자. 큰 수는 만·억으로 줄인다. */
export function formatAxisNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${plainNumber(value / 100_000_000, 1)}억`;
  if (abs >= 10_000) return `${plainNumber(value / 10_000, 1)}만`;
  return plainNumber(value);
}

export function formatChartNumber(value: number): string {
  return plainNumber(value);
}

export function formatPercent(value: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((value / total) * 1000) / 10}%`;
}

export function chartFileName(originalName: string): string {
  const base = safeFileName(originalName.replace(/\.[^.]+$/, '')) || 'chart';
  return `${base}-chart.png`;
}

export function chartTypeLabel(type: ChartType): string {
  if (type === 'bar-horizontal') return '가로 막대';
  if (type === 'line') return '선';
  if (type === 'pie') return '파이';
  return '세로 막대';
}
