/**
 * 즐겨찾기 — 이 브라우저의 localStorage 에만 저장한다(로그인·서버 전송 없음).
 * 브라우저를 닫아도 남고, 사이트 데이터를 지우거나 시크릿 창이면 사라진다.
 */
import { parseRecent } from './recent-tools';

export const FAVORITES_KEY = 'officekit-favorites';
export const FAVORITES_LIMIT = 18;
/** 즐겨찾기가 바뀌면 같은 페이지의 다른 별 버튼·홈 섹션이 다시 그리도록 알린다. */
export const FAVORITES_EVENT = 'officekit:favorites';

const SLUG = /^[a-z0-9-]{1,60}$/;

/** 있으면 빼고 없으면 끝에 더한다(추가한 순서 유지). */
export function toggleSlug(
  list: readonly string[],
  slug: string,
  limit = FAVORITES_LIMIT,
): { list: string[]; on: boolean } {
  if (!SLUG.test(slug)) return { list: [...list], on: false };
  if (list.includes(slug)) return { list: list.filter((item) => item !== slug), on: false };
  if (list.length >= limit) return { list: [...list], on: false };
  return { list: [...list, slug], on: true };
}

export function parseFavorites(raw: string | null): string[] {
  return parseRecent(raw, FAVORITES_LIMIT);
}

export function readFavorites(): string[] {
  try {
    return parseFavorites(localStorage.getItem(FAVORITES_KEY));
  } catch {
    return [];
  }
}

/** 토글하고 새 상태(true=즐겨찾기됨)를 돌려준다. 저장이 막히면 false. */
export function toggleFavorite(slug: string): boolean {
  try {
    const { list, on } = toggleSlug(readFavorites(), slug);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
    return on;
  } catch {
    return false;
  }
}
