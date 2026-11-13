/**
 * 최근 사용한 도구 — 이 브라우저의 localStorage 에만 저장한다(서버 전송 없음).
 * 저장소가 막힌 환경(사생활 보호 모드 등)에서는 조용히 빈 목록으로 동작한다.
 */
export const RECENT_KEY = 'officekit-recent';
export const RECENT_LIMIT = 6;

const SLUG = /^[a-z0-9-]{1,60}$/;

/** 방문한 slug 를 맨 앞으로 옮기고, 중복 제거·최대 개수를 지킨 새 목록을 돌려준다. */
export function pushRecent(list: readonly string[], slug: string, limit = RECENT_LIMIT): string[] {
  if (!SLUG.test(slug)) return [...list];
  return [slug, ...list.filter((item) => item !== slug)].slice(0, limit);
}

/** 저장된 값을 검증해 slug 목록으로 바꾼다. 형식이 틀리면 빈 목록. */
export function parseRecent(raw: string | null, limit = RECENT_LIMIT): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string' && SLUG.test(item))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function readRecentTools(): string[] {
  try {
    return parseRecent(localStorage.getItem(RECENT_KEY));
  } catch {
    return [];
  }
}

export function recordRecentTool(slug: string): void {
  try {
    const next = pushRecent(readRecentTools(), slug);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // 저장소를 쓸 수 없으면 기록하지 않는다.
  }
}
