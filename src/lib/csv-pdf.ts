export interface PdfTableOptions {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  fontSize: number;
  header: boolean;
}

export function chunkRows<T>(items: T[], size: number): T[][] {
  const safe = Math.max(1, Math.trunc(size));
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += safe) {
    chunks.push(items.slice(index, index + safe));
  }
  return chunks;
}

/** 문자 수를 기준으로 열 너비를 배분한다. */
export function columnWidths(rows: string[][], totalWidth: number, minWidth = 24): number[] {
  if (rows.length === 0) return [];
  const columns = Math.max(...rows.map((row) => row.length));
  if (columns === 0) return [];
  const weights = Array.from({ length: columns }, (_, index) => {
    const longest = Math.max(1, ...rows.slice(0, 200).map((row) => (row[index] ?? '').length));
    return Math.min(40, Math.max(4, longest));
  });
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const available = Math.max(columns * minWidth, totalWidth);
  return weights.map((weight) => Math.max(minWidth, (weight / weightSum) * available));
}

export function truncateCell(value: string, width: number, fontSize: number): string {
  const maxChars = Math.max(2, Math.floor(width / (fontSize * 0.55)));
  return value.length > maxChars ? `${value.slice(0, maxChars - 1)}…` : value;
}

/** 한 페이지에 들어갈 수 있는 행 수(헤더 제외). */
export function rowsPerPage(options: PdfTableOptions): number {
  const available = options.pageHeight - options.margin * 2 - (options.header ? 30 : 0);
  return Math.max(1, Math.floor(available / (options.fontSize * 1.7)));
}

export function tablePages(
  rows: string[][],
  options: PdfTableOptions,
): { rows: string[][]; pageNumber: number }[] {
  if (rows.length === 0) return [];
  const header = options.header ? [rows[0] ?? []] : [];
  const body = options.header ? rows.slice(1) : rows;
  const perPage = rowsPerPage(options);
  const chunks = chunkRows(body, perPage);
  return chunks.map((chunk, index) => ({
    rows: [...header, ...chunk],
    pageNumber: index + 1,
  }));
}

export function pdfTableFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'table'}.pdf`;
}
