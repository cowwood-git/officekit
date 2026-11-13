export interface ParseResult {
  /** 1부터 시작하는 페이지 번호. 입력 순서를 유지하고 중복은 제거한다. */
  pages: number[];
  errors: string[];
}

const TOKEN = /^(\d*)(?:\s*[-–~]\s*(\d*))?$/;

/**
 * "1-3, 5, 8~10" 형태의 범위 문자열을 페이지 번호 배열로 바꾼다.
 * "2-"는 2쪽부터 끝까지, "-3"은 1쪽부터 3쪽까지를 뜻한다.
 * 페이지 번호는 1부터 시작한다.
 */
export function parsePageRanges(raw: string, pageCount: number): ParseResult {
  const errors: string[] = [];
  const pages: number[] = [];
  const seen = new Set<number>();

  if (!Number.isInteger(pageCount) || pageCount < 1) {
    return { pages: [], errors: ['PDF 페이지 수를 확인할 수 없습니다.'] };
  }

  const tokens = raw
    .trim()
    .split(/[,\s]+/)
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return { pages: [], errors: ['나눌 페이지 범위를 입력하세요. 예: 1-3, 5'] };
  }

  for (const token of tokens) {
    const match = TOKEN.exec(token);
    if (!match || (match[1] === '' && (match[2] === undefined || match[2] === ''))) {
      errors.push(`"${token}" 형식이 올바르지 않습니다. 예: 1-3, 5`);
      continue;
    }

    const start = match[1] === '' ? 1 : Number(match[1]);
    const end = match[2] === undefined ? start : match[2] === '' ? pageCount : Number(match[2]);

    if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
      errors.push(`"${token}" 범위가 페이지 수(1~${pageCount})를 벗어났습니다.`);
      continue;
    }

    if (end < start) {
      errors.push(`"${token}" 범위의 시작이 끝보다 큽니다.`);
      continue;
    }

    for (let page = start; page <= end; page += 1) {
      if (!seen.has(page)) {
        seen.add(page);
        pages.push(page);
      }
    }
  }

  if (pages.length === 0 && errors.length === 0) {
    errors.push('추출할 페이지가 없습니다.');
  }

  return { pages, errors };
}

/** 페이지를 size 개씩 묶는다. 마지막 묶음은 남는 페이지로 구성된다. */
export function chunkPages(pageCount: number, size: number): number[][] {
  if (!Number.isInteger(pageCount) || pageCount < 1) return [];
  if (!Number.isInteger(size) || size < 1) return [];

  const chunks: number[][] = [];
  for (let start = 1; start <= pageCount; start += size) {
    const chunk: number[] = [];
    for (let page = start; page < start + size && page <= pageCount; page += 1) {
      chunk.push(page);
    }
    chunks.push(chunk);
  }
  return chunks;
}

/** 1,2,3 → "1-3" / 1,3,4 → "1, 3-4" (파일명·요약 표시용) */
export function formatPageList(pages: number[]): string {
  if (pages.length === 0) return '';
  const sorted = [...pages].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0] as number;
  let previous = start;

  for (let index = 1; index <= sorted.length; index += 1) {
    const current = sorted[index];
    if (current !== undefined && current === previous + 1) {
      previous = current;
      continue;
    }
    parts.push(start === previous ? String(start) : `${start}-${previous}`);
    if (current !== undefined) {
      start = current;
      previous = current;
    }
  }

  return parts.join(', ');
}
