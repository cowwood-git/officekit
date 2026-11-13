/**
 * 사이트맵 <lastmod> — 페이지가 스스로 밝힌 수정일(JSON-LD dateModified)을 그대로 쓴다.
 *
 * 왜: 구글·네이버는 lastmod 가 «정확할 때만» 재수집 우선순위에 쓴다. 빌드 날짜를 일괄로 넣으면
 * 신뢰를 잃으므로, 화면에 표시한 수정일과 같은 값을 쓴다. 날짜가 없는 페이지는 비워 둔다.
 * 홈·허브처럼 도구 목록을 보여 주는 페이지는 «가장 최근에 바뀐 도구»의 날짜를 쓴다.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DATE_RE = /"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/;

/** 목록 페이지 — 도구가 바뀌면 함께 바뀐다. */
export const LIST_PATHS = new Set([
  '/',
  '/pdf/',
  '/office/',
  '/image/',
  '/sheet/',
  '/text/',
  '/utility/',
  '/workflows/',
]);

/** HTML 에서 dateModified 를 읽는다. 없으면 undefined. */
export function dateModifiedOf(html) {
  return html.match(DATE_RE)?.[1];
}

function htmlFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(path));
    else if (entry.name === 'index.html') out.push(path);
  }
  return out;
}

/** distDir 안 페이지의 lastmod 를 돌려주는 함수를 만든다(최신 날짜는 한 번만 계산). */
export function createLastmod(distDir = 'dist') {
  let latest;
  const latestDate = () => {
    if (latest === undefined) {
      latest = '';
      for (const file of htmlFiles(join(distDir, 'tools'))) {
        const date = dateModifiedOf(readFileSync(file, 'utf8'));
        if (date && date > latest) latest = date;
      }
    }
    return latest || undefined;
  };

  return (url) => {
    const { pathname } = new URL(url);
    if (LIST_PATHS.has(pathname)) return latestDate();
    const file = join(distDir, pathname, 'index.html');
    if (!existsSync(file)) return undefined;
    return dateModifiedOf(readFileSync(file, 'utf8'));
  };
}
