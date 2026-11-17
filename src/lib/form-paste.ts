import type { FormRow, RepeatColumn, RepeatGroup } from '@/lib/doc/types';

export interface PasteMergeResult {
  rows: FormRow[];
  applied: number;
  ignored: number;
  truncated: number;
  skippedHeader: boolean;
}

/** 엑셀/스프레드시트에서 복사한 셀을 2차원 문자열로 읽는다. */
export function parseClipboardTable(text: string): string[][] {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '');
  if (!normalized) return [];
  const delimiter = normalized.includes('\t') ? '\t' : normalized.includes(',') ? ',' : '';
  if (!delimiter) return [[normalized]];

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    if (quoted) {
      if (char === '"') {
        if (normalized[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"' && cell === '') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);

  return rows
    .map((cells) => {
      const next = cells.slice();
      while (next.length > 0 && (next[next.length - 1] ?? '') === '') next.pop();
      return next;
    })
    .filter((cells) => cells.length > 0);
}

function isHeaderRow(group: RepeatGroup, row: readonly string[], startColumn: number): boolean {
  const labels = group.columns
    .slice(startColumn)
    .map((column) => column.label.trim().toLowerCase());
  let compared = 0;
  let matched = 0;
  for (let index = 0; index < row.length; index += 1) {
    const value = (row[index] ?? '').trim().toLowerCase();
    const label = labels[index];
    if (!value || !label) continue;
    compared += 1;
    if (value === label) matched += 1;
  }
  return compared > 0 && compared === matched && (compared >= 2 || group.columns.length === 1);
}

function normalizeDate(raw: string): string | null {
  const value = raw.trim();
  if (!value) return '';
  if (/^\d{4,5}(\.\d+)?$/.test(value)) {
    const serial = Number(value);
    if (Number.isFinite(serial) && serial > 0) {
      const date = new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000);
      if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
  }
  const match = /^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeCell(column: RepeatColumn, raw: string): string | null {
  const value = raw.trim();
  if (!value) return '';
  if (column.type === 'date') return normalizeDate(value);
  if (column.type === 'number' || column.type === 'money') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    if (!cleaned || !Number.isFinite(Number(cleaned))) return null;
    return cleaned;
  }
  if (column.type === 'select') {
    return (
      column.options?.find((option) => option === value) ??
      column.options?.find((option) => option.toLowerCase() === value.toLowerCase()) ??
      null
    );
  }
  return column.maxLength ? value.slice(0, column.maxLength) : value;
}

/** 현재 표에 붙여넣은 셀을 병합한다. 시작 셀부터 행·열 방향으로 채운다. */
export function mergePastedRows(
  group: RepeatGroup,
  current: readonly FormRow[],
  matrix: readonly (readonly string[])[],
  startRow = 0,
  startColumn = 0,
): PasteMergeResult {
  const skippedHeader = isHeaderRow(group, matrix[0] ?? [], startColumn);
  const data = skippedHeader ? matrix.slice(1) : matrix;
  const maxRows = group.maxRows ?? 30;
  const available = Math.max(0, maxRows - startRow);
  const usedRows = data.slice(0, available);
  const normalizedRow = (row: FormRow): FormRow => {
    const next: FormRow = {};
    for (const column of group.columns) {
      if (column.type !== 'computed') next[column.id] = row[column.id] ?? '';
    }
    return next;
  };
  const rows = current.map(normalizedRow);
  while (rows.length < startRow + usedRows.length) rows.push(normalizedRow({}));

  let applied = 0;
  let ignored = 0;
  for (const [rowOffset, cells] of usedRows.entries()) {
    for (const [columnOffset, raw] of cells.entries()) {
      const column = group.columns[startColumn + columnOffset];
      if (!column || column.type === 'computed') continue;
      const value = normalizeCell(column, raw);
      if (value === null) {
        ignored += 1;
        continue;
      }
      rows[startRow + rowOffset] = {
        ...rows[startRow + rowOffset],
        [column.id]: value,
      };
      applied += 1;
    }
  }

  return {
    rows,
    applied,
    ignored,
    truncated: Math.max(0, data.length - usedRows.length),
    skippedHeader,
  };
}
