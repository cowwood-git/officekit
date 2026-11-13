import { safeFileName } from './files';

/** 0 → A, 25 → Z, 26 → AA */
export function columnLabel(index: number): string {
  let value = Math.max(0, Math.floor(index));
  let label = '';
  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return label;
}

export interface Pagination {
  page: number;
  pageCount: number;
  /** 0-based, inclusive */
  start: number;
  /** 0-based, exclusive */
  end: number;
}

export function paginate(total: number, pageSize: number, page: number): Pagination {
  const safeTotal = Math.max(0, Math.floor(total));
  const size = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(safeTotal / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * size;
  const end = Math.min(safeTotal, start + size);
  return { page: current, pageCount, start, end };
}

export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

const NUMERIC = /^-?[\d,]+(\.\d+)?%?$/;

export function isNumericCell(text: string): boolean {
  return NUMERIC.test(text.trim());
}

export function sheetFileName(originalName: string, sheetName: string, extension: string): string {
  const base = safeFileName(originalName.replace(/\.[^.]+$/, '')) || 'sheet';
  const sheet = safeFileName(sheetName) || 'sheet';
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return `${base}-${sheet}${ext}`;
}
