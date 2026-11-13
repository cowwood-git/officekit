export type Delimiter = ',' | ';' | '\t';

/** 첫 줄에서 가장 많이 쓰인 구분자를 고른다. */
export function detectDelimiter(text: string): Delimiter {
  const line = text.split(/\r?\n/).find((item) => item.trim() !== '') ?? '';
  const counts: Record<Delimiter, number> = {
    ',': (line.match(/,/g) ?? []).length,
    ';': (line.match(/;/g) ?? []).length,
    '\t': (line.match(/\t/g) ?? []).length,
  };
  const best = (Object.entries(counts) as Array<[Delimiter, number]>).sort(
    (a, b) => b[1] - a[1],
  )[0];
  return best && best[1] > 0 ? best[0] : ',';
}

const NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?$/;

/** "123" → 123, "true" → true. 숫자처럼 보여도 00123 같은 코드는 문자열로 둔다. */
export function coerceScalar(value: string): string | number | boolean {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if (NUMBER.test(trimmed)) return Number(trimmed);
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return value;
}

/** 헤더의 빈 칸과 중복을 정리한다. */
export function uniqueHeaders(headers: string[]): string[] {
  const used = new Map<string, number>();
  return headers.map((header, index) => {
    const base = header.trim() || `열${index + 1}`;
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

/**
 * 중첩 객체를 점 표기법으로 평탄화한다. 배열은 JSON 문자열로 둔다.
 * JSON → CSV 변환에서 열을 안정적으로 만들기 위해 사용한다.
 */
export function flattenJson(
  value: unknown,
  prefix = '',
  output: Record<string, unknown> = {},
): Record<string, unknown> {
  if (value === null || value === undefined) {
    if (prefix) output[prefix] = null;
    return output;
  }

  if (Array.isArray(value)) {
    if (prefix) output[prefix] = JSON.stringify(value);
    return output;
  }

  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      flattenJson(child, path, output);
    }
    return output;
  }

  if (prefix) output[prefix] = value;
  return output;
}

export interface JsonRowResult {
  rows: Array<Record<string, unknown>>;
  headers: string[];
}

/** JSON 배열을 CSV용 행과 헤더로 정규화한다. 모든 객체의 키를 합집합으로 모은다. */
export function normalizeJsonRows(value: unknown, flatten = true): JsonRowResult {
  if (!Array.isArray(value)) {
    throw new Error('JSON 최상위는 배열이어야 합니다. 예: [{ "name": "A" }]');
  }

  const objects = value.map((item, index) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`${index + 1}번째 항목이 객체가 아닙니다.`);
    }
    return flatten ? flattenJson(item) : { ...(item as Record<string, unknown>) };
  });

  const headers: string[] = [];
  const seen = new Set<string>();
  for (const object of objects) {
    for (const key of Object.keys(object)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }

  return { rows: objects, headers };
}

export function convertFileName(original: string | null, target: 'json' | 'csv'): string {
  const base = (original ?? 'converted').replace(/\.[^.]+$/, '');
  return `${base || 'converted'}.${target}`;
}
