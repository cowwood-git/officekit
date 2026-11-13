export type Aggregate = 'sum' | 'count' | 'avg' | 'min' | 'max';

export interface PivotOptions {
  rowColumn: number;
  columnColumn: number;
  valueColumn: number;
  aggregate: Aggregate;
  includeTotals: boolean;
}

export interface PivotResult {
  headers: string[];
  rows: string[][];
  rowLabels: string[];
  columnLabels: string[];
}

export function parseNumeric(value: string): number | null {
  const cleaned = value.replace(/[,\s₩원%]/g, '');
  if (cleaned === '') return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function aggregateValues(values: string[], aggregate: Aggregate): number {
  if (aggregate === 'count') return values.length;
  const numbers = values.map(parseNumeric).filter((value): value is number => value !== null);
  if (numbers.length === 0) return 0;
  if (aggregate === 'sum') return numbers.reduce((sum, value) => sum + value, 0);
  if (aggregate === 'avg') return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  if (aggregate === 'min') return Math.min(...numbers);
  return Math.max(...numbers);
}

function formatAggregate(value: number, aggregate: Aggregate): string {
  if (aggregate === 'count') return String(value);
  if (aggregate === 'avg') return String(Number(value.toFixed(2)));
  return String(Number(value.toFixed(6)));
}

/** 첫 행을 헤더로 보고 행·열 교차 집계표를 만든다. */
export function pivotTable(rows: string[][], options: PivotOptions): PivotResult {
  if (rows.length < 2) {
    return { headers: [], rows: [], rowLabels: [], columnLabels: [] };
  }
  const header = rows[0] ?? [];
  const data = rows.slice(1);
  const rowLabels = [
    ...new Set(data.map((row) => row[options.rowColumn] ?? '').filter((value) => value !== '')),
  ].sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }));
  const columnLabels = [
    ...new Set(data.map((row) => row[options.columnColumn] ?? '').filter((value) => value !== '')),
  ].sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }));

  const buckets = new Map<string, string[]>();
  for (const row of data) {
    const rowLabel = row[options.rowColumn] ?? '';
    const columnLabel = row[options.columnColumn] ?? '';
    if (rowLabel === '' || columnLabel === '') continue;
    const key = `${rowLabel}\u0000${columnLabel}`;
    const list = buckets.get(key) ?? [];
    list.push(row[options.valueColumn] ?? '');
    buckets.set(key, list);
  }

  const body: string[][] = [];
  for (const rowLabel of rowLabels) {
    const values = columnLabels.map((columnLabel) =>
      formatAggregate(
        aggregateValues(buckets.get(`${rowLabel}\u0000${columnLabel}`) ?? [], options.aggregate),
        options.aggregate,
      ),
    );
    if (options.includeTotals) {
      const all: string[] = [];
      for (const columnLabel of columnLabels) {
        all.push(...(buckets.get(`${rowLabel}\u0000${columnLabel}`) ?? []));
      }
      values.push(formatAggregate(aggregateValues(all, options.aggregate), options.aggregate));
    }
    body.push([rowLabel, ...values]);
  }

  if (options.includeTotals && rowLabels.length > 0) {
    const totals = columnLabels.map((columnLabel) => {
      const all: string[] = [];
      for (const rowLabel of rowLabels) {
        all.push(...(buckets.get(`${rowLabel}\u0000${columnLabel}`) ?? []));
      }
      return formatAggregate(aggregateValues(all, options.aggregate), options.aggregate);
    });
    if (options.includeTotals) {
      const all: string[] = [];
      for (const values of buckets.values()) all.push(...values);
      totals.push(formatAggregate(aggregateValues(all, options.aggregate), options.aggregate));
    }
    body.push(['합계', ...totals]);
  }

  const rowHeader = header[options.rowColumn] || '행';
  const headers = [rowHeader, ...columnLabels];
  if (options.includeTotals) headers.push('합계');
  return { headers, rows: body, rowLabels, columnLabels };
}

export function pivotToCsv(result: PivotResult): string {
  const escapeCsv = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return [result.headers, ...result.rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}

export function pivotFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'pivot'}-pivot.csv`;
}
