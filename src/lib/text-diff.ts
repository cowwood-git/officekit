/**
 * 줄 단위 텍스트 비교(Myers diff).
 *
 * 문서 전체를 서버로 보내지 않고 브라우저에서 비교하기 위해 외부 라이브러리 없이 구현한다.
 * 앞뒤가 같은 줄은 먼저 걷어내고, 가운데만 Myers O(ND)로 계산한다.
 * 편집 거리가 너무 크면(완전히 다른 문서) 통째로 삭제·추가로 표시해 UI가 멈추지 않게 한다.
 */

export type DiffRowType = 'same' | 'add' | 'remove' | 'change';

export interface DiffOptions {
  /** 줄 앞뒤 공백과 연속 공백을 무시한다. */
  ignoreWhitespace?: boolean;
  /** 영문 대소문자를 무시한다. */
  ignoreCase?: boolean;
}

export interface DiffRow {
  type: DiffRowType;
  /** 1부터 시작하는 원본 줄 번호. 추가 줄에는 없다. */
  oldLine?: number;
  /** 1부터 시작하는 수정본 줄 번호. 삭제 줄에는 없다. */
  newLine?: number;
  oldText: string;
  newText?: string;
}

export interface DiffStats {
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
  oldLines: number;
  newLines: number;
}

export interface DiffResult {
  rows: DiffRow[];
  stats: DiffStats;
  /** 비교 옵션을 적용했을 때 두 입력이 같은지 */
  identical: boolean;
}

interface RawOp {
  type: 'same' | 'add' | 'remove';
  text: string;
}

/** Myers 추적 메모리를 제한한다. 이보다 많이 달라지면 전체 삭제·추가로 대체한다. */
const MAX_EDIT_DISTANCE = 500;
const MAX_LINES = 20_000;

/** CRLF를 LF로 맞추고 마지막 빈 줄 하나는 줄 수에서 뺀다. */
export function splitLines(text: string): string[] {
  const normalized = text.replace(/\r\n?/g, '\n');
  if (normalized === '') return [];
  const lines = normalized.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function normalizeLine(line: string, options: DiffOptions): string {
  let value = line;
  if (options.ignoreWhitespace) value = value.replace(/\s+/g, ' ').trim();
  if (options.ignoreCase) value = value.toLocaleLowerCase('ko');
  return value;
}

function myers(a: string[], b: string[]): RawOp[] {
  const n = a.length;
  const m = b.length;
  if (n === 0) return b.map((text) => ({ type: 'add', text }));
  if (m === 0) return a.map((text) => ({ type: 'remove', text }));

  const max = n + m;
  const offset = max + 1;
  const v = new Int32Array(2 * max + 3);
  v[offset + 1] = 0;
  const trace: Int32Array[] = [];

  for (let d = 0; d <= max; d += 1) {
    if (d > MAX_EDIT_DISTANCE) break;
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      const index = offset + k;
      let x: number;
      if (k === -d || (k !== d && (v[index - 1] ?? 0) < (v[index + 1] ?? 0))) {
        x = v[index + 1] ?? 0;
      } else {
        x = (v[index - 1] ?? 0) + 1;
      }
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x += 1;
        y += 1;
      }
      v[index] = x;
      if (x >= n && y >= m) {
        return backtrack(trace, a, b, d, offset);
      }
    }
  }

  return [
    ...a.map((text): RawOp => ({ type: 'remove', text })),
    ...b.map((text): RawOp => ({ type: 'add', text })),
  ];
}

function backtrack(
  trace: Int32Array[],
  a: string[],
  b: string[],
  distance: number,
  offset: number,
): RawOp[] {
  const ops: RawOp[] = [];
  let x = a.length;
  let y = b.length;

  for (let d = distance; d >= 0; d -= 1) {
    const v = trace[d];
    if (!v) break;
    const k = x - y;
    const index = offset + k;
    const goDown = k === -d || (k !== d && (v[index - 1] ?? 0) < (v[index + 1] ?? 0));
    const prevK = goDown ? k + 1 : k - 1;
    const prevX = v[offset + prevK] ?? 0;
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      const text = a[x - 1];
      if (text !== undefined) ops.push({ type: 'same', text });
      x -= 1;
      y -= 1;
    }

    if (d === 0) break;
    if (x === prevX) {
      const text = b[y - 1];
      if (text !== undefined) ops.push({ type: 'add', text });
      y -= 1;
    } else {
      const text = a[x - 1];
      if (text !== undefined) ops.push({ type: 'remove', text });
      x -= 1;
    }
  }

  return ops.reverse();
}

/** 같은 접두·접미 줄을 걷어내고 가운데만 비교한다. */
function diffCore(a: string[], b: string[]): RawOp[] {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;

  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA -= 1;
    endB -= 1;
  }

  const ops: RawOp[] = [];
  for (let index = 0; index < start; index += 1) {
    const text = a[index];
    if (text !== undefined) ops.push({ type: 'same', text });
  }
  ops.push(...myers(a.slice(start, endA), b.slice(start, endB)));
  for (let index = endA; index < a.length; index += 1) {
    const text = a[index];
    if (text !== undefined) ops.push({ type: 'same', text });
  }
  return ops;
}

/** 삭제·추가가 번갈아 나오는 묶음을 “변경” 줄끼리 짝지어 보여 준다. */
function toRows(ops: RawOp[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let oldLine = 1;
  let newLine = 1;
  let index = 0;

  while (index < ops.length) {
    const op = ops[index];
    if (!op) break;

    if (op.type === 'same') {
      rows.push({
        type: 'same',
        oldLine,
        newLine,
        oldText: op.text,
        newText: op.text,
      });
      oldLine += 1;
      newLine += 1;
      index += 1;
      continue;
    }

    const removes: string[] = [];
    const adds: string[] = [];
    while (index < ops.length && ops[index]?.type !== 'same') {
      const current = ops[index];
      if (!current) break;
      if (current.type === 'remove') removes.push(current.text);
      else adds.push(current.text);
      index += 1;
    }

    const pairs = Math.min(removes.length, adds.length);
    for (let pair = 0; pair < pairs; pair += 1) {
      rows.push({
        type: 'change',
        oldLine,
        newLine,
        oldText: removes[pair] ?? '',
        newText: adds[pair] ?? '',
      });
      oldLine += 1;
      newLine += 1;
    }
    for (let rest = pairs; rest < removes.length; rest += 1) {
      rows.push({ type: 'remove', oldLine, oldText: removes[rest] ?? '' });
      oldLine += 1;
    }
    for (let rest = pairs; rest < adds.length; rest += 1) {
      rows.push({ type: 'add', newLine, oldText: '', newText: adds[rest] ?? '' });
      newLine += 1;
    }
  }

  return rows;
}

function statsFor(rows: DiffRow[]): DiffStats {
  let added = 0;
  let removed = 0;
  let changed = 0;
  let unchanged = 0;
  for (const row of rows) {
    if (row.type === 'add') added += 1;
    else if (row.type === 'remove') removed += 1;
    else if (row.type === 'change') changed += 1;
    else unchanged += 1;
  }
  return {
    added,
    removed,
    changed,
    unchanged,
    oldLines: unchanged + changed + removed,
    newLines: unchanged + changed + added,
  };
}

/** 두 텍스트를 줄 단위로 비교한다. */
export function diffLines(oldText: string, newText: string, options: DiffOptions = {}): DiffResult {
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  const oldKeys = oldLines.map((line) => normalizeLine(line, options));
  const newKeys = newLines.map((line) => normalizeLine(line, options));

  if (oldLines.length > MAX_LINES || newLines.length > MAX_LINES) {
    throw new Error(`한 번에 ${MAX_LINES.toLocaleString('ko-KR')}줄까지 비교할 수 있습니다.`);
  }

  const rows = toRows(diffCore(oldKeys, newKeys));
  // 표시는 원문을 쓰되, 짝지은 변경 줄은 원본/수정본 원문을 각각 보여 준다.
  const sourceRows = rows.map((row) => {
    if (row.type === 'same') {
      const text = oldLines[(row.oldLine ?? 1) - 1] ?? '';
      return { ...row, oldText: text, newText: text };
    }
    if (row.type === 'remove') {
      return { ...row, oldText: oldLines[(row.oldLine ?? 1) - 1] ?? '' };
    }
    if (row.type === 'add') {
      return { ...row, newText: newLines[(row.newLine ?? 1) - 1] ?? '' };
    }
    return {
      ...row,
      oldText: oldLines[(row.oldLine ?? 1) - 1] ?? '',
      newText: newLines[(row.newLine ?? 1) - 1] ?? '',
    };
  });

  const stats = statsFor(sourceRows);
  return {
    rows: sourceRows,
    stats,
    identical: stats.added === 0 && stats.removed === 0 && stats.changed === 0,
  };
}

/** 복사·저장용 통합 diff 텍스트. 변경 줄은 삭제·추가 두 줄로 적는다. */
export function toDiffText(rows: DiffRow[]): string {
  const lines: string[] = [];
  for (const row of rows) {
    if (row.type === 'same') lines.push(`  ${row.oldText}`);
    else if (row.type === 'remove') lines.push(`- ${row.oldText}`);
    else if (row.type === 'add') lines.push(`+ ${row.newText ?? ''}`);
    else {
      lines.push(`- ${row.oldText}`);
      lines.push(`+ ${row.newText ?? ''}`);
    }
  }
  return lines.join('\n');
}

export function diffFileName(oldName = '원본', newName = '수정본'): string {
  const clean = (value: string) =>
    value
      .replace(/\.[^.]+$/, '')
      .replace(/[\\/:*?"<>|]+/g, '_')
      .trim()
      .slice(0, 60) || 'text';
  return `${clean(oldName)}-vs-${clean(newName)}.diff.txt`;
}

/** 화면에 보여 줄 요약 문장. */
export function diffSummary(stats: DiffStats): string {
  if (stats.added === 0 && stats.removed === 0 && stats.changed === 0) {
    return '두 텍스트가 같습니다.';
  }
  const parts: string[] = [];
  if (stats.changed > 0) parts.push(`변경 ${stats.changed}줄`);
  if (stats.added > 0) parts.push(`추가 ${stats.added}줄`);
  if (stats.removed > 0) parts.push(`삭제 ${stats.removed}줄`);
  return `${parts.join(' · ')} — 같은 줄 ${stats.unchanged}줄`;
}
