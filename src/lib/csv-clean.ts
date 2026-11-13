export type FilterOperator =
  | 'contains'
  | 'equals'
  | 'not-empty'
  | 'empty'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

export interface CsvCleanOptions {
  trim: boolean;
  removeEmptyRows: boolean;
  dedupe: boolean;
  filterColumn: number;
  filterOperator: FilterOperator;
  filterValue: string;
  sortColumn: number;
  sortDirection: 'asc' | 'desc';
  numericSort: boolean;
}

export interface CsvCleanStats {
  inputRows: number;
  outputRows: number;
  emptyRemoved: number;
  duplicatesRemoved: number;
  filteredOut: number;
}

export interface CsvCleanResult {
  rows: string[][];
  stats: CsvCleanStats;
}

export const FILTER_OPERATORS: Array<{ value: FilterOperator; label: string }> = [
  { value: 'contains', label: '포함' },
  { value: 'equals', label: '같음' },
  { value: 'not-empty', label: '값 있음' },
  { value: 'empty', label: '값 없음' },
  { value: 'gt', label: '초과 (>)' },
  { value: 'gte', label: '이상 (≥)' },
  { value: 'lt', label: '미만 (<)' },
  { value: 'lte', label: '이하 (≤)' },
];

export function headerLabels(header: string[]): string[] {
  return header.map((cell, index) => cell.trim() || `열 ${index + 1}`);
}

function numericValue(value: string): number | null {
  const cleaned = value.replace(/[,\s₩원%]/g, '');
  if (cleaned === '') return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function matches(value: string, operator: FilterOperator, target: string): boolean {
  const cell = value.trim();
  switch (operator) {
    case 'contains':
      return cell.toLowerCase().includes(target.trim().toLowerCase());
    case 'equals':
      return cell.toLowerCase() === target.trim().toLowerCase();
    case 'not-empty':
      return cell !== '';
    case 'empty':
      return cell === '';
    default: {
      const left = numericValue(cell);
      const right = numericValue(target);
      if (left === null || right === null) return false;
      if (operator === 'gt') return left > right;
      if (operator === 'gte') return left >= right;
      if (operator === 'lt') return left < right;
      return left <= right;
    }
  }
}

/** 첫 줄을 헤더로 보고 데이터 행만 정리한다. */
export function cleanTable(rows: string[][], options: CsvCleanOptions): CsvCleanResult {
  if (rows.length === 0) {
    return {
      rows: [],
      stats: {
        inputRows: 0,
        outputRows: 0,
        emptyRemoved: 0,
        duplicatesRemoved: 0,
        filteredOut: 0,
      },
    };
  }

  const headerRow = rows[0] ?? [];
  const header = options.trim ? headerRow.map((cell) => cell.trim()) : [...headerRow];
  let data = rows.slice(1).map((row) => (options.trim ? row.map((cell) => cell.trim()) : [...row]));
  const inputRows = data.length;

  let emptyRemoved = 0;
  if (options.removeEmptyRows) {
    const before = data.length;
    data = data.filter((row) => row.some((cell) => cell.trim() !== ''));
    emptyRemoved = before - data.length;
  }

  let duplicatesRemoved = 0;
  if (options.dedupe) {
    const seen = new Set<string>();
    data = data.filter((row) => {
      const key = row.join('\u0000');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    duplicatesRemoved = inputRows - emptyRemoved - data.length;
  }

  let filteredOut = 0;
  if (options.filterColumn >= 0) {
    const before = data.length;
    data = data.filter((row) =>
      matches(row[options.filterColumn] ?? '', options.filterOperator, options.filterValue),
    );
    filteredOut = before - data.length;
  }

  if (options.sortColumn >= 0) {
    const column = options.sortColumn;
    const direction = options.sortDirection === 'desc' ? -1 : 1;
    data = [...data].sort((a, b) => {
      const left = a[column] ?? '';
      const right = b[column] ?? '';
      if (options.numericSort) {
        const leftNumber = numericValue(left);
        const rightNumber = numericValue(right);
        if (leftNumber !== null && rightNumber !== null) {
          return (leftNumber - rightNumber) * direction;
        }
        if (leftNumber !== null) return -1;
        if (rightNumber !== null) return 1;
      }
      return left.localeCompare(right, 'ko', { numeric: true }) * direction;
    });
  }

  return {
    rows: [header, ...data],
    stats: {
      inputRows,
      outputRows: data.length,
      emptyRemoved,
      duplicatesRemoved: Math.max(0, duplicatesRemoved),
      filteredOut,
    },
  };
}

function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** CSV 문자열로 직렬화한다. */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\n');
}
