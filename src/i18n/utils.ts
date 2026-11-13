import { DEFAULT_LOCALE, type Locale } from './ui';

/**
 * 로케일 경로를 만든다. 기본 로케일(ko)은 접두사를 붙이지 않는다.
 * path 는 항상 '/' 로 시작하는 절대 경로를 받는다.
 */
export function localePath(locale: Locale, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === '/' ? `/${locale}/` : `/${locale}${clean}`;
}
