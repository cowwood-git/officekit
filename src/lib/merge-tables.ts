/** 여러 CSV·엑셀 표를 열 이름 기준으로 이어 붙인다. */

export interface MergeInput {
  name: string;
  sheetName?: string;
  headers: readonly string[];
  rows: ReadonlyArray<readonly string[]>;
}

export interface MergeResult {
  headers: string[];
  rows: string[][];
  sourceRows: number;
  duplicateRows: number;
}

export const MAX_MERGE_FILES = 20;
export const MAX_MERGE_ROWS = 100_000;
export const MAX_MERGE_BYTES = 50 * 1024 * 1024;

function normalizeHeaders(headers: readonly string[], width: number): string[] {
  const used = new Set<string>();
  return Array.from({ length: width }, (_, index) => {
    const base = (headers[index] ?? '').trim() || `열 ${index + 1}`;
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) {
      candidate = `${base} (${suffix})`;
      suffix += 1;
    }
    used.add(candidate);
    return candidate;
  });
}

/** 열 이름의 합집합을 만들고, 각 표의 열을 그 위치에 매핑한다. */
export function mergeTables(
  inputs: readonly MergeInput[],
  options: { dedupe?: boolean } = {},
): MergeResult {
  const union: string[] = [];
  const unionSet = new Set<string>();
  const maps: number[][] = [];

  for (const input of inputs) {
    const width = input.rows.reduce((max, row) => Math.max(max, row.length), input.headers.length);
    const headers = normalizeHeaders(input.headers, width);
    const map: number[] = [];
    headers.forEach((header, index) => {
      if (!unionSet.has(header)) {
        unionSet.add(header);
        union.push(header);
      }
      map[index] = union.indexOf(header);
    });
    maps.push(map);
  }

  const rows: string[][] = [];
  const seen = new Set<string>();
  let sourceRows = 0;
  let duplicateRows = 0;

  inputs.forEach((input, tableIndex) => {
    const map = maps[tableIndex] ?? [];
    for (const source of input.rows) {
      sourceRows += 1;
      const row = Array.from({ length: union.length }, () => '');
      for (let column = 0; column < map.length; column += 1) {
        const target = map[column];
        if (target === undefined) continue;
        row[target] = (source[column] ?? '').trim();
      }
      const key = row.join('\u0001');
      if (options.dedupe && seen.has(key)) {
        duplicateRows += 1;
        continue;
      }
      seen.add(key);
      rows.push(row);
    }
  });

  return { headers: union, rows, sourceRows, duplicateRows };
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function mergeToCsv(result: MergeResult): string {
  return [result.headers, ...result.rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
}

export function mergeFileName(extension: 'csv' | 'xlsx', date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `합친표-${date.getFullYear()}${month}${day}.${extension}`;
}
