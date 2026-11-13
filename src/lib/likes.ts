/**
 * 도구 좋아요 — 익명 방문자 ID와 좋아요 상태만 이 브라우저에 저장한다.
 * 실제 합계는 /api/likes(Cloudflare D1)에서 가져온다.
 */
export const LIKED_KEY = 'officekit-liked-tools';
export const VISITOR_KEY = 'officekit-visitor-id';

let memoryVisitor = '';

export function readVisitorId(): string {
  try {
    const saved = localStorage.getItem(VISITOR_KEY);
    if (saved && /^[A-Za-z0-9_-]{8,80}$/.test(saved)) return saved;
    const created =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `v-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    if (!memoryVisitor) {
      memoryVisitor = `v-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    }
    return memoryVisitor;
  }
}

export function readLikedTools(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

export function writeLiked(slug: string, liked: boolean): void {
  try {
    const current = readLikedTools();
    if (liked) current.add(slug);
    else current.delete(slug);
    localStorage.setItem(LIKED_KEY, JSON.stringify([...current]));
  } catch {
    // 저장이 막혀도 이번 페이지의 좋아요 표시는 유지한다.
  }
}

export function formatLikeCount(count: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.max(0, Math.trunc(count)));
}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 5000);
  try {
    return await run(controller.signal);
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchLikeCounts(
  slugs: readonly string[],
): Promise<Record<string, number> | null> {
  if (slugs.length === 0) return {};
  try {
    return await withTimeout(async (signal) => {
      const counts: Record<string, number> = {};
      for (let index = 0; index < slugs.length; index += 50) {
        const chunk = slugs.slice(index, index + 50);
        const response = await fetch(`/api/likes?slugs=${encodeURIComponent(chunk.join(','))}`, {
          signal,
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) return null;
        const data = (await response.json()) as { counts?: Record<string, number> };
        for (const slug of chunk) {
          const count = data.counts?.[slug];
          counts[slug] = typeof count === 'number' ? count : 0;
        }
      }
      return counts;
    });
  } catch {
    return null;
  }
}

export async function fetchLikeCount(slug: string): Promise<number | null> {
  const counts = await fetchLikeCounts([slug]);
  return counts ? (counts[slug] ?? 0) : null;
}

export async function sendLike(
  slug: string,
  action: 'like' | 'unlike',
  visitorId: string,
): Promise<{ count: number; liked: boolean } | null> {
  try {
    return await withTimeout(async (signal) => {
      const response = await fetch(`/api/likes/${encodeURIComponent(slug)}`, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ visitorId, action }),
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { count?: number; liked?: boolean };
      if (typeof data.count !== 'number' || typeof data.liked !== 'boolean') return null;
      return { count: data.count, liked: data.liked };
    });
  } catch {
    return null;
  }
}

export interface TopLikeItem {
  slug: string;
  count: number;
  title?: string;
  summary?: string;
  path?: string;
  iconName?: string;
}

export const TOP_LIKES_MIN_TOOLS = 20;
export const TOP_LIKES_MIN_COUNT = 3;
export const TOP_LIKES_LIMIT = 8;

/** 상위 좋아요 섹션은 충분한 도구가 쌓였을 때만 보여 준다(빈 사회적 증거 방지). */
export function hasEnoughTopLikes(
  items: readonly TopLikeItem[],
  minTools = TOP_LIKES_MIN_TOOLS,
  minCount = TOP_LIKES_MIN_COUNT,
): boolean {
  return items.filter((item) => item.count >= minCount).length >= minTools;
}

export function selectTopLikeCards(
  items: readonly TopLikeItem[],
  limit = TOP_LIKES_LIMIT,
): TopLikeItem[] {
  return items
    .filter((item) => item.count > 0)
    .slice()
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
    .slice(0, Math.max(0, limit));
}

export interface RelatedLikeItem extends TopLikeItem {
  overlap: number;
}

export async function fetchRelatedLikes(slug: string): Promise<RelatedLikeItem[] | null> {
  try {
    return await withTimeout(async (signal) => {
      const response = await fetch(`/api/likes/related?slug=${encodeURIComponent(slug)}`, {
        signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { items?: RelatedLikeItem[] };
      if (!Array.isArray(data.items)) return null;
      return data.items.filter(
        (item) => item && typeof item.slug === 'string' && typeof item.count === 'number',
      );
    });
  } catch {
    return null;
  }
}
