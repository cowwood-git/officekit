#!/usr/bin/env node
/**
 * 빌드 결과물 품질 게이트.
 * - 얇은 페이지, 중복 제목, H1 누락, JSON-LD 누락을 배포 전에 잡는다.
 * - 광고 정책상 문제가 되는 "내용 없는 페이지"를 만들지 않기 위한 장치.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const MIN_TOOL_TEXT = 700;
const MIN_PAGE_TEXT = 350;

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function pathFor(file) {
  const rel = relative(DIST, file).replaceAll('\\', '/');
  if (rel === 'index.html') return '/';
  return `/${rel.replace(/index\.html$/, '')}`;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const errors = [];
const warnings = [];
const rows = [];

const files = await walk(DIST);
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const path = pathFor(file);
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? '';
  const description =
    html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1]?.trim() ?? '';
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i)?.[1] ?? '';
  const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
  const text = stripHtml(main);
  const textLength = text.replace(/\s/g, '').length;
  const h1Count = (main.match(/<h1[\s>]/gi) ?? []).length;
  const jsonLdCount = (html.match(/application\/ld\+json/gi) ?? []).length;

  rows.push({ path, title: title.length, text: textLength, jsonLd: jsonLdCount });

  if (noindex) continue;

  if (path === '/404/') continue;

  if (title.length < 10 || title.length > 65) {
    errors.push(`${path}: title 길이 ${title.length}자 (10~65자 권장)`);
  }
  if (description.length < 50 || description.length > 170) {
    errors.push(`${path}: description 길이 ${description.length}자 (50~170자 권장)`);
  }
  if (!canonical.startsWith('https://')) {
    errors.push(`${path}: canonical 누락 또는 http`);
  }
  if (h1Count !== 1) {
    errors.push(`${path}: h1 ${h1Count}개 (정확히 1개 필요)`);
  }
  if (jsonLdCount < 1) {
    errors.push(`${path}: JSON-LD 없음`);
  }

  const minimum = path.startsWith('/tools/') && path !== '/tools/' ? MIN_TOOL_TEXT : MIN_PAGE_TEXT;
  if (textLength < minimum) {
    errors.push(`${path}: 본문 ${textLength}자 (최소 ${minimum}자)`);
  }

  if (/TODO|Lorem ipsum|여기에 내용/.test(text)) {
    errors.push(`${path}: 플레이스홀더 텍스트가 남아 있음`);
  }
}

// 사이트맵 확인
try {
  const sitemap = await readFile(join(DIST, 'sitemap-index.xml'), 'utf8');
  if (!sitemap.includes('<sitemapindex')) warnings.push('sitemap-index.xml 형식 확인 필요');
} catch {
  errors.push('sitemap-index.xml 이 생성되지 않았습니다.');
}

const sorted = rows.sort((a, b) => a.text - b.text);
console.log('\n페이지 품질 요약 (본문 글자수 오름차순)');
console.log('─'.repeat(72));
for (const row of sorted) {
  console.log(
    `${String(row.text).padStart(5)}자  title ${String(row.title).padStart(2)}자  ld+json ${row.jsonLd}  ${row.path}`,
  );
}
console.log('─'.repeat(72));
console.log(`검사한 페이지: ${rows.length}개`);

if (warnings.length > 0) {
  console.log('\n경고');
  for (const warning of warnings) console.log(`  ! ${warning}`);
}

if (errors.length > 0) {
  console.error('\n실패');
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log('\n모든 페이지가 품질 기준을 통과했습니다.\n');
