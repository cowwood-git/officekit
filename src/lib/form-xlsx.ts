import * as XLSX from 'xlsx';
import { isDocNoHidden } from '@/lib/doc/format';
import type {
  FormRows,
  FormTemplate,
  FormValues,
  RepeatColumn,
  RepeatGroup,
} from '@/lib/doc/types';

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const MAX_SHEET_NAME = 31;

function toNumber(value: string): number | null {
  const cleaned = value.replace(/[^\d.-]/g, '');
  if (!cleaned) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function cellValue(column: RepeatColumn, raw: string | undefined): string | number {
  const value = (raw ?? '').trim();
  if (!value) return '';
  if (column.type === 'number' || column.type === 'money') {
    return toNumber(value) ?? value;
  }
  return value;
}

function emptyRow(
  row: Record<string, string> | undefined,
  group: RepeatGroup,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const column of group.columns) {
    if (column.type !== 'computed') next[column.id] = row?.[column.id] ?? '';
  }
  return next;
}

function hasValue(row: Record<string, string>, group: RepeatGroup): boolean {
  return group.columns.some(
    (column) => column.type !== 'computed' && (row[column.id] ?? '').trim() !== '',
  );
}

function uniqueSheetName(label: string, id: string, used: Set<string>): string {
  const base =
    label
      .replace(/[:\\/?*[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_SHEET_NAME) || id;
  let name = base;
  let index = 2;
  while (used.has(name)) {
    const suffix = ` ${index}`;
    name = `${base.slice(0, MAX_SHEET_NAME - suffix.length)}${suffix}`;
    index += 1;
  }
  used.add(name);
  return name;
}

function columnWidth(header: string, values: readonly (string | number)[]): number {
  const longest = Math.max(header.length, ...values.map((value) => String(value).length));
  return Math.max(8, Math.min(44, longest + 2));
}

function buildGroupSheet(
  group: RepeatGroup,
  rows: readonly Record<string, string>[],
  values: FormValues,
): XLSX.WorkSheet {
  const filled = rows.filter((row) => hasValue(row, group));
  const data = filled.length > 0 ? filled : [emptyRow(undefined, group)];
  const headers = group.columns.map((column) => column.label);
  const aoa: (string | number)[][] = [headers];
  for (const row of data) {
    const derived = group.computeRow?.(row) ?? {};
    aoa.push(
      group.columns.map((column) =>
        cellValue(
          column,
          column.type === 'computed' ? (derived[column.id] ?? row[column.id]) : row[column.id],
        ),
      ),
    );
  }

  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  let lastRow = data.length;
  let lastColumn = Math.max(0, group.columns.length - 1);
  sheet['!cols'] = group.columns.map((column, index) => ({
    wch: columnWidth(
      column.label,
      aoa.slice(1).map((row) => row[index] ?? ''),
    ),
  }));
  sheet['!autofilter'] = {
    ref: `A1:${XLSX.utils.encode_col(group.columns.length - 1)}${data.length + 1}`,
  };

  const indexOf = (id: string): number => group.columns.findIndex((column) => column.id === id);
  const basePayIndex = indexOf('basePay');
  const allowanceIndex = indexOf('allowance');
  const grossIndex = indexOf('gross');
  const deductionIndex = indexOf('deduction');
  const netIndex = indexOf('net');
  const grantedIndex = indexOf('granted');
  const usedIndex = indexOf('used');
  const remainingIndex = indexOf('remaining');

  const setFormula = (
    rowIndex: number,
    columnIndex: number,
    formula: string,
    format: string,
  ): void => {
    if (columnIndex < 0) return;
    sheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })] = {
      t: 'n',
      f: formula,
      z: format,
    };
  };

  for (let index = 0; index < data.length; index += 1) {
    const rowNumber = index + 2;
    if (basePayIndex >= 0 && allowanceIndex >= 0 && grossIndex >= 0) {
      setFormula(
        rowNumber - 1,
        grossIndex,
        `${XLSX.utils.encode_col(basePayIndex)}${rowNumber}+${XLSX.utils.encode_col(allowanceIndex)}${rowNumber}`,
        '#,##0',
      );
    }
    if (grossIndex >= 0 && deductionIndex >= 0 && netIndex >= 0) {
      setFormula(
        rowNumber - 1,
        netIndex,
        `MAX(0,${XLSX.utils.encode_col(grossIndex)}${rowNumber}-${XLSX.utils.encode_col(deductionIndex)}${rowNumber})`,
        '#,##0',
      );
    }
    if (grantedIndex >= 0 && usedIndex >= 0 && remainingIndex >= 0) {
      setFormula(
        rowNumber - 1,
        remainingIndex,
        `MAX(0,${XLSX.utils.encode_col(grantedIndex)}${rowNumber}-${XLSX.utils.encode_col(usedIndex)}${rowNumber})`,
        '0.#',
      );
    }
  }

  const quantityIndex = group.columns.findIndex((column) => column.id === 'quantity');
  const unitPriceIndex = group.columns.findIndex((column) => column.id === 'unitPrice');
  const amountIndex = group.columns.findIndex((column) => column.id === 'amount');
  const isItemTable = quantityIndex >= 0 && unitPriceIndex >= 0 && amountIndex >= 0;

  if (isItemTable) {
    const quantityCol = XLSX.utils.encode_col(quantityIndex);
    const unitPriceCol = XLSX.utils.encode_col(unitPriceIndex);
    const amountCol = XLSX.utils.encode_col(amountIndex);
    for (let index = 0; index < data.length; index += 1) {
      const rowNumber = index + 2;
      sheet[XLSX.utils.encode_cell({ r: rowNumber - 1, c: amountIndex })] = {
        t: 'n',
        f: `${quantityCol}${rowNumber}*${unitPriceCol}${rowNumber}`,
        z: '#,##0',
      };
    }

    const totalRow = data.length + 1;
    sheet[XLSX.utils.encode_cell({ r: totalRow, c: 0 })] = {
      t: 's',
      v: '합계',
    };
    sheet[XLSX.utils.encode_cell({ r: totalRow, c: amountIndex })] = {
      t: 'n',
      f: `SUM(${amountCol}2:${amountCol}${data.length + 1})`,
      z: '#,##0',
    };
    lastRow = totalRow;
  }

  for (const [columnIndex, column] of group.columns.entries()) {
    if (column.type !== 'money' && column.type !== 'number') continue;
    for (let index = 1; index <= data.length; index += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: index, c: columnIndex })];
      if (cell && cell.t === 'n') {
        cell.z = column.type === 'money' ? '#,##0' : '#,##0.##';
      }
    }
  }

  const summaryField = group.summaryField;
  const summaryValue = summaryField ? (values[summaryField] ?? '').trim() : '';
  if (summaryField && summaryValue) {
    const summaryRow = data.length + (isItemTable ? 2 : 1);
    sheet[XLSX.utils.encode_cell({ r: summaryRow, c: 0 })] = {
      t: 's',
      v: group.summaryLabel ?? '요약',
    };
    sheet[XLSX.utils.encode_cell({ r: summaryRow, c: 1 })] = {
      t: 's',
      v: summaryValue,
    };
    lastRow = summaryRow;
    lastColumn = Math.max(lastColumn, 1);
  }

  sheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: lastRow, c: lastColumn },
  });

  return sheet;
}

/** 현재 입력값과 반복 표를 편집 가능한 XLSX로 만든다. */
export function buildFormWorkbook(
  template: FormTemplate,
  values: FormValues,
  rows: FormRows,
): Uint8Array {
  const workbook = XLSX.utils.book_new();

  const info: (string | number)[][] = [
    ['항목', '값'],
    ['양식', template.title],
    ...(isDocNoHidden(values) ? [] : [['문서 번호', values.docNo ?? '']]),
    ['작성일', values.date ?? ''],
  ];
  for (const field of template.fields) {
    if (field.type === 'computed' || field.id === 'docNo' || field.id === 'date') continue;
    info.push([field.label, values[field.id] ?? '']);
  }
  const infoSheet = XLSX.utils.aoa_to_sheet(info);
  infoSheet['!cols'] = [{ wch: 24 }, { wch: 52 }];
  XLSX.utils.book_append_sheet(workbook, infoSheet, '문서 정보');

  const used = new Set(['문서 정보']);
  for (const group of template.groups ?? []) {
    const name = uniqueSheetName(group.label, group.id, used);
    const sheet = buildGroupSheet(group, rows[group.id] ?? [], values);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }

  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Uint8Array(output);
}
