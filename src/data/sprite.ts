/**
 * 아이콘 스프라이트 URL.
 *
 * `/icons.svg` 는 고정 경로라 브라우저·서비스 워커 캐시에 오래 남는다. 아이콘 목록이 바뀌면
 * URL 도 바뀌어야 새 도구의 아이콘이 빈칸으로 보이지 않는다.
 * → 쓰는 아이콘 이름 목록의 해시를 버전으로 붙인다(손으로 올리다 빠뜨리는 일이 없게).
 *   아이콘 모양만 바뀌는 경우(Phosphor 업그레이드 등)는 SHAPE_REVISION 을 올린다.
 */
import { FALLBACK_ICON, TOOL_ICONS, UI_ICONS } from './app-icons';

const SHAPE_REVISION = '1';

/** FNV-1a 32비트 — 짧고 결정적인 문자열 해시 */
export function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

export function spriteVersion(names: readonly string[]): string {
  return `${SHAPE_REVISION}-${fnv1a([...new Set(names)].sort().join(','))}`;
}

export const SPRITE_URL = `/icons.svg?v=${spriteVersion([
  ...Object.values(TOOL_ICONS),
  FALLBACK_ICON,
  ...UI_ICONS,
])}`;
