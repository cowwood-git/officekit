export type JoinType = 'inner' | 'left' | 'full';

export interface JoinOptions {
  leftKey: number;
  rightKey: number;
  type: JoinType;
}

export interface JoinResult {
  headers: string[];
  rows: string[][];
  matched: number;
  leftOnly: number;
  rightOnly: number;
}

function uniqueHeaders(left: string[], right: string[], rightKey: number): string[] {
  const headers = [...left.map((header, index) => header || `열 ${index + 1}`)];
  const used = new Set(headers.map((header) => header.toLowerCase()));
  right.forEach((header, index) => {
    if (index === rightKey) return;
    const label = header || `열 ${index + 1}`;
    let candidate = label;
    let suffix = 2;
    while (used.has(candidate.toLowerCase())) {
      candidate = `${label}_${suffix}`;
      suffix += 1;
    }
    used.add(candidate.toLowerCase());
    headers.push(candidate);
  });
  return headers;
}

/** 두 표를 키 기준으로 결합한다. 왼쪽 열을 먼저 두고, 오른쪽 키 열은 중복을 피한다. */
export function joinTables(left: string[][], right: string[][], options: JoinOptions): JoinResult {
  if (left.length === 0 || right.length === 0) {
    return { headers: [], rows: [], matched: 0, leftOnly: 0, rightOnly: 0 };
  }
  const leftHeader = left[0] ?? [];
  const rightHeader = right[0] ?? [];
  const headers = uniqueHeaders(leftHeader, rightHeader, options.rightKey);
  const rightIndex = new Map<string, string[][]>();

  for (const row of right.slice(1)) {
    const key = (row[options.rightKey] ?? '').trim();
    if (key === '') continue;
    const list = rightIndex.get(key) ?? [];
    list.push(row);
    rightIndex.set(key, list);
  }

  const rows: string[][] = [];
  const usedRightKeys = new Set<string>();
  let matched = 0;
  let leftOnly = 0;

  const rightValues = (row: string[] | undefined, key: string) => {
    const values: string[] = [];
    for (let index = 0; index < rightHeader.length; index += 1) {
      if (index === options.rightKey) continue;
      values.push(row?.[index] ?? '');
    }
    void key;
    return values;
  };

  for (const row of left.slice(1)) {
    const key = (row[options.leftKey] ?? '').trim();
    const matches = key === '' ? undefined : rightIndex.get(key);
    if (matches && matches.length > 0) {
      matched += 1;
      usedRightKeys.add(key);
      for (const match of matches) {
        rows.push([...row, ...rightValues(match, key)]);
      }
    } else {
      leftOnly += 1;
      if (options.type !== 'inner') {
        rows.push([...row, ...rightValues(undefined, key)]);
      }
    }
  }

  let rightOnly = 0;
  if (options.type === 'full') {
    for (const [key, list] of rightIndex) {
      if (usedRightKeys.has(key)) continue;
      rightOnly += list.length;
      for (const match of list) {
        rows.push([
          ...Array.from({ length: leftHeader.length }, (_, index) =>
            index === options.leftKey ? (match[options.rightKey] ?? '') : '',
          ),
          ...rightValues(match, key),
        ]);
      }
    }
  }

  return { headers, rows, matched, leftOnly, rightOnly };
}

export function joinToCsv(result: JoinResult): string {
  const escapeCsv = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return [result.headers, ...result.rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}

export function joinFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'join'}-joined.csv`;
}
