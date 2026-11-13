import { safeFileName } from './files';
import { sheetFileName } from './sheet';

export type ConversionDirection = 'to-xlsx' | 'to-csv';
export type CsvDelimiter = 'comma' | 'tab' | 'semicolon';
export type CsvEncoding = 'auto' | 'utf-8' | 'euc-kr';

/** 파일 확장자로 변환 방향을 정한다. 지원하지 않으면 null. */
export function conversionDirection(fileName: string): ConversionDirection | null {
  if (/\.(csv|tsv)$/i.test(fileName)) return 'to-xlsx';
  if (/\.(xlsx|xls|ods)$/i.test(fileName)) return 'to-csv';
  return null;
}

/** 엑셀 시트 이름 규칙: 31자, \ / ? * [ ] : 금지. */
export function defaultSheetName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').trim();
  const safe = base
    .replace(/[\\/?*[\]:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 31);
  return safe || 'Sheet1';
}

export function xlsxFileName(fileName: string): string {
  const base = safeFileName(fileName.replace(/\.[^.]+$/, '')) || 'table';
  return `${base}.xlsx`;
}

export function csvFileName(fileName: string, sheetName: string): string {
  return sheetFileName(fileName, sheetName || 'Sheet1', 'csv');
}

export function delimiterChar(delimiter: CsvDelimiter): string {
  if (delimiter === 'tab') return '\t';
  if (delimiter === 'semicolon') return ';';
  return ',';
}

/** 한글 엑셀이 UTF-8 CSV를 바로 열도록 BOM을 붙인다. */
export function withBom(text: string, bom: boolean): string {
  return bom ? `\uFEFF${text}` : text;
}

/** 화면·파일명에 쓰는 방향 설명. */
export function directionLabel(direction: ConversionDirection, fileName: string): string {
  const lower = fileName.toLowerCase();
  if (direction === 'to-xlsx') return lower.endsWith('.tsv') ? 'TSV → XLSX' : 'CSV → XLSX';
  if (lower.endsWith('.ods')) return 'ODS → CSV';
  if (lower.endsWith('.xls')) return 'XLS → CSV';
  return 'XLSX → CSV';
}

/** 표의 실제 데이터 범위(마지막 빈 행·열 제외)를 줄인다. */
export function trimEmptyEdges(rows: string[][]): string[][] {
  let lastRow = rows.length - 1;
  while (lastRow >= 0 && (rows[lastRow] ?? []).every((cell) => cell.trim() === '')) lastRow -= 1;

  if (lastRow < 0) return [];

  let lastColumn = 0;
  for (let row = 0; row <= lastRow; row += 1) {
    const cells = rows[row] ?? [];
    for (let column = cells.length - 1; column >= 0; column -= 1) {
      if ((cells[column] ?? '').trim() !== '') {
        lastColumn = Math.max(lastColumn, column);
        break;
      }
    }
  }

  return rows.slice(0, lastRow + 1).map((row) => {
    const next = [...row];
    while (next.length < lastColumn + 1) next.push('');
    return next.slice(0, lastColumn + 1);
  });
}

/** 표 미리보기에 필요한 행·열 수를 계산한다. */
export function previewWindow(
  rowCount: number,
  columnCount: number,
  maxRows = 20,
  maxColumns = 12,
): { rows: number; columns: number; truncated: boolean } {
  const rows = Math.max(0, Math.min(rowCount, maxRows));
  const columns = Math.max(0, Math.min(columnCount, maxColumns));
  return {
    rows,
    columns,
    truncated: rowCount > rows || columnCount > columns,
  };
}
