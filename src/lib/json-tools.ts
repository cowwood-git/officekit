export interface JsonResult {
  ok: boolean;
  text: string;
  error?: string;
  line?: number;
  column?: number;
  bytes: number;
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function validateJson(text: string): JsonResult {
  if (text.trim() === '') {
    return { ok: false, text: '', error: 'JSON을 입력하세요.', bytes: 0 };
  }
  try {
    JSON.parse(text);
    return { ok: true, text, bytes: byteLength(text) };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'JSON 문법 오류';
    const positionMatch = /position\s+(\d+)/i.exec(message);
    if (positionMatch?.[1]) {
      const position = Number(positionMatch[1]);
      const before = text.slice(0, position);
      const line = before.split('\n').length;
      const column = position - before.lastIndexOf('\n');
      return { ok: false, text: '', error: message, line, column, bytes: byteLength(text) };
    }
    const lineMatch = /line\s+(\d+)\s+column\s+(\d+)/i.exec(message);
    return {
      ok: false,
      text: '',
      error: message,
      line: lineMatch ? Number(lineMatch[1]) : undefined,
      column: lineMatch ? Number(lineMatch[2]) : undefined,
      bytes: byteLength(text),
    };
  }
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort((a, b) => a.localeCompare(b))) {
      sorted[key] = sortValue(source[key]);
    }
    return sorted;
  }
  return value;
}

export interface FormatOptions {
  indent: number;
  sortKeys: boolean;
}

export function formatJson(text: string, options: FormatOptions): JsonResult {
  const checked = validateJson(text);
  if (!checked.ok) return checked;
  try {
    const parsed = JSON.parse(text);
    const value = options.sortKeys ? sortValue(parsed) : parsed;
    const indent = Math.min(8, Math.max(0, Math.trunc(options.indent)));
    const output = JSON.stringify(value, null, indent === 0 ? undefined : indent);
    return { ok: true, text: output, bytes: byteLength(output) };
  } catch (cause) {
    return {
      ok: false,
      text: '',
      error: cause instanceof Error ? cause.message : 'JSON 변환 오류',
      bytes: 0,
    };
  }
}

export function minifyJson(text: string): JsonResult {
  const checked = validateJson(text);
  if (!checked.ok) return checked;
  const output = JSON.stringify(JSON.parse(text));
  return { ok: true, text: output, bytes: byteLength(output) };
}

export interface JsonDiffEntry {
  path: string;
  type: 'added' | 'removed' | 'changed';
  before?: string;
  after?: string;
}

function preview(value: unknown): string {
  const text = JSON.stringify(value);
  if (text === undefined) return String(value);
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

function walk(before: unknown, after: unknown, path: string, out: JsonDiffEntry[]): void {
  if (out.length >= 300) return;
  if (before === after) return;
  const bothObjects =
    before !== null &&
    after !== null &&
    typeof before === 'object' &&
    typeof after === 'object' &&
    !Array.isArray(before) &&
    !Array.isArray(after);

  if (bothObjects) {
    const left = before as Record<string, unknown>;
    const right = after as Record<string, unknown>;
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of [...keys].sort()) {
      const nextPath = path === '' ? key : `${path}.${key}`;
      if (!(key in left)) {
        out.push({ path: nextPath, type: 'added', after: preview(right[key]) });
      } else if (!(key in right)) {
        out.push({ path: nextPath, type: 'removed', before: preview(left[key]) });
      } else {
        walk(left[key], right[key], nextPath, out);
      }
    }
    return;
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    for (let index = 0; index < length; index += 1) {
      const nextPath = `${path}[${index}]`;
      if (index >= before.length) {
        out.push({ path: nextPath, type: 'added', after: preview(after[index]) });
      } else if (index >= after.length) {
        out.push({ path: nextPath, type: 'removed', before: preview(before[index]) });
      } else {
        walk(before[index], after[index], nextPath, out);
      }
    }
    return;
  }

  out.push({
    path: path === '' ? '$' : path,
    type: 'changed',
    before: preview(before),
    after: preview(after),
  });
}

export function diffJson(
  beforeText: string,
  afterText: string,
): {
  ok: boolean;
  entries: JsonDiffEntry[];
  error?: string;
} {
  const first = validateJson(beforeText);
  if (!first.ok) return { ok: false, entries: [], error: `첫 번째 JSON: ${first.error}` };
  const second = validateJson(afterText);
  if (!second.ok) return { ok: false, entries: [], error: `두 번째 JSON: ${second.error}` };
  const entries: JsonDiffEntry[] = [];
  walk(JSON.parse(beforeText), JSON.parse(afterText), '', entries);
  return { ok: true, entries };
}

export function diffText(entries: JsonDiffEntry[]): string {
  if (entries.length === 0) return '차이가 없습니다.';
  return entries
    .map((entry) => {
      if (entry.type === 'added') return `+ ${entry.path}: ${entry.after ?? ''}`;
      if (entry.type === 'removed') return `- ${entry.path}: ${entry.before ?? ''}`;
      return `~ ${entry.path}: ${entry.before ?? ''} → ${entry.after ?? ''}`;
    })
    .join('\n');
}
