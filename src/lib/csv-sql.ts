export type SqlDialect = 'mysql' | 'postgres' | 'sqlite';

export type SqlColumnType = 'INTEGER' | 'REAL' | 'BOOLEAN' | 'DATE' | 'TEXT';

export interface SqlOptions {
  table: string;
  dialect: SqlDialect;
  nullEmpty: boolean;
  batchSize: number;
}

const NUMERIC = /^-?\d+(\.\d+)?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** 값 목록으로 열 타입을 추정한다. */
export function inferColumnType(values: string[]): SqlColumnType {
  const sample = values.map((value) => value.trim()).filter(Boolean);
  if (sample.length === 0) return 'TEXT';
  if (sample.every((value) => /^(true|false|0|1)$/i.test(value))) return 'BOOLEAN';
  if (sample.every((value) => DATE.test(value))) return 'DATE';
  if (sample.every((value) => NUMERIC.test(value))) {
    return sample.some((value) => value.includes('.')) ? 'REAL' : 'INTEGER';
  }
  return 'TEXT';
}

export function sanitizeTableName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\p{L}\p{N}_]+/gu, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned === '' ? 'table_name' : cleaned.slice(0, 60);
}

export function sanitizeColumnName(name: string, index: number): string {
  const cleaned = name
    .trim()
    .replace(/[^\p{L}\p{N}_]+/gu, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned === '' ? `column_${index + 1}` : cleaned.slice(0, 60);
}

export function quoteIdentifier(name: string, dialect: SqlDialect): string {
  if (dialect === 'mysql') return `\`${name.replace(/`/g, '``')}\``;
  return `"${name.replace(/"/g, '""')}"`;
}

export function escapeSqlValue(value: string, options: SqlOptions): string {
  const trimmed = value.trim();
  if (trimmed === '') return options.nullEmpty ? 'NULL' : "''";
  if (/^(true|false)$/i.test(trimmed)) {
    return options.dialect === 'sqlite'
      ? trimmed.toLowerCase() === 'true'
        ? '1'
        : '0'
      : trimmed.toUpperCase();
  }
  if (NUMERIC.test(trimmed)) return trimmed;
  return `'${value.replace(/'/g, "''")}'`;
}

export interface SqlResult {
  create: string;
  inserts: string;
  full: string;
}

export function buildSql(rows: string[][], options: SqlOptions): SqlResult {
  if (rows.length === 0) return { create: '', inserts: '', full: '' };
  const headers = rows[0] ?? [];
  const data = rows.slice(1);
  const columns = headers.map((header, index) => sanitizeColumnName(header, index));
  const types = columns.map((_, index) => inferColumnType(data.map((row) => row[index] ?? '')));
  const table = sanitizeTableName(options.table);
  const quotedTable = quoteIdentifier(table, options.dialect);
  const createLines = [
    `CREATE TABLE ${quotedTable} (`,
    ...columns.map(
      (column, index) =>
        `  ${quoteIdentifier(column, options.dialect)} ${types[index]}${index === columns.length - 1 ? '' : ','}`,
    ),
    ');',
  ];
  const create = createLines.join('\n');

  const columnsSql = columns.map((column) => quoteIdentifier(column, options.dialect)).join(', ');
  const batchSize = Math.max(1, Math.min(500, Math.trunc(options.batchSize) || 100));
  const insertLines: string[] = [];
  for (let start = 0; start < data.length; start += batchSize) {
    const batch = data.slice(start, start + batchSize);
    const values = batch
      .map(
        (row) =>
          `(${columns.map((_, index) => escapeSqlValue(row[index] ?? '', options)).join(', ')})`,
      )
      .join(',\n  ');
    insertLines.push(`INSERT INTO ${quotedTable} (${columnsSql}) VALUES\n  ${values};`);
  }

  return { create, inserts: insertLines.join('\n\n'), full: [create, ...insertLines].join('\n\n') };
}

export function sqlFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'table'}.sql`;
}
