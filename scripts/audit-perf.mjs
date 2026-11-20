#!/usr/bin/env node
/**
 * 초기 로딩 성능 예산 검사.
 * HTML이 직접 참조하는 JS/CSS(동적 import 제외)의 gzip 크기를 합산한다.
 * HTML 자체도 모든 페이지에 예산을 둔다(2026-11-20: 홈이 숨긴 양식 카드 149개로 487KB까지 커졌던 일).
 */
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = new URL('../dist/', import.meta.url).pathname;
const PAGES = [
  ['/', 40, 20],
  ['/tools/', 50, 25],
  ['/pdf/', 60, 30],
  ['/workflows/', 60, 30],
  ['/workflows/submit-pdf/', 60, 30],
  ['/tools/pdf-merge/', 60, 30],
  ['/tools/image-ocr/', 60, 30],
  ['/tools/docx-viewer/', 60, 30],
  ['/tools/pptx-viewer/', 60, 30],
  ['/tools/hwpx-viewer/', 60, 30],
  ['/tools/hwpx-to-pdf/', 60, 30],
  ['/tools/docx-to-pdf/', 60, 30],
  ['/tools/pptx-to-pdf/', 60, 30],
  ['/tools/vcf-ics-viewer/', 60, 30],
  ['/tools/quote-generator/', 60, 30],
  ['/tools/seal-maker/', 60, 30],
  ['/tools/password-generator/', 60, 30],
  ['/tools/file-hash/', 60, 30],
  ['/tools/label-print/', 60, 30],
  ['/tools/vcard-maker/', 60, 30],
  ['/tools/ics-maker/', 60, 30],
  ['/tools/zip/', 60, 30],
  ['/tools/qr-batch/', 60, 30],
  ['/tools/csv-stats/', 60, 30],
  ['/tools/merge-tables/', 60, 30],
  ['/tools/barcode-generator/', 60, 30],
  ['/forms/', 60, 30],
  ['/forms/leave-request/', 60, 30],
  ['/forms/meeting-minutes/', 60, 30],
  ['/forms/expense-report/', 60, 30],
  ['/forms/approval-request/', 60, 30],
  ['/forms/purchase-order/', 60, 30],
  ['/forms/delivery-confirmation/', 60, 30],
  ['/forms/travel-request/', 60, 30],
  ['/forms/travel-report/', 60, 30],
  ['/forms/travel-expense/', 60, 30],
  ['/forms/weekly-report/', 60, 30],
  ['/forms/handover/', 60, 30],
  ['/forms/employment-certificate/', 60, 30],
  ['/forms/delegation/', 60, 30],
  ['/forms/certificate/', 60, 30],
  ['/forms/award/', 60, 30],
  ['/forms/blank-table/', 60, 30],
  ['/forms/checklist/', 60, 30],
  ['/forms/quote/', 60, 30],
  ['/forms/statement/', 60, 30],
];

function localRefs(html) {
  const refs = new Set();
  for (const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    refs.add(match[1]);
  }
  for (const match of html.matchAll(
    /<link[^>]+rel="(?:stylesheet|modulepreload)"[^>]+href="([^"]+)"/g,
  )) {
    refs.add(match[1]);
  }
  return [...refs].filter((ref) => ref.startsWith('/'));
}

const results = [];
let failed = false;

for (const [path, maxJsKb, maxCssKb] of PAGES) {
  const file = join(DIST, path, 'index.html');
  const html = await readFile(file, 'utf8');
  let js = 0;
  let css = 0;
  let files = 0;

  for (const ref of localRefs(html)) {
    try {
      const body = await readFile(join(DIST, ref));
      const size = gzipSync(body).length;
      files += 1;
      if (extname(ref) === '.css') css += size;
      else js += size;
    } catch {
      // 누락된 자산은 콘텐츠 감사에서 별도로 잡는다.
    }
  }

  const jsKb = Math.round((js / 1024) * 10) / 10;
  const cssKb = Math.round((css / 1024) * 10) / 10;
  const ok = jsKb <= maxJsKb && cssKb <= maxCssKb;
  if (!ok) failed = true;
  results.push({ path, files, jsKb, cssKb, maxJsKb, maxCssKb, ok });
}

// HTML 예산: 목록이 많은 허브는 넉넉히, 나머지 페이지는 엄격히. gzip은 전송량, 원본은 DOM·파싱 비용.
const HUB_PAGES = new Set([
  '/',
  '/tools/',
  '/forms/',
  '/pdf/',
  '/image/',
  '/utility/',
  '/sheet/',
  '/office/',
  '/text/',
]);
const HTML_BUDGET = { hub: { gzipKb: 45, rawKb: 350 }, page: { gzipKb: 20, rawKb: 120 } };

async function htmlFiles(dir, base = '/') {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory())
      found.push(...(await htmlFiles(join(dir, entry.name), `${base}${entry.name}/`)));
    else if (entry.name === 'index.html') found.push(base);
  }
  return found;
}

const htmlResults = [];
for (const path of await htmlFiles(DIST)) {
  const body = await readFile(join(DIST, path, 'index.html'));
  const budget = HUB_PAGES.has(path) ? HTML_BUDGET.hub : HTML_BUDGET.page;
  const gzipKb = Math.round((gzipSync(body).length / 1024) * 10) / 10;
  const rawKb = Math.round(body.length / 1024);
  const ok = gzipKb <= budget.gzipKb && rawKb <= budget.rawKb;
  if (!ok) failed = true;
  htmlResults.push({ path, gzipKb, rawKb, budget, ok });
}
htmlResults.sort((a, b) => b.gzipKb - a.gzipKb);

console.log('\nHTML 예산 (허브 gzip 45KB·원본 350KB, 그 밖 20KB·120KB)');
console.log('─'.repeat(78));
for (const item of htmlResults.filter((row, index) => !row.ok || index < 5)) {
  console.log(
    `${item.ok ? '✓' : '✗'} ${item.path.padEnd(32)} ${String(item.gzipKb).padStart(5)}KB / ${item.budget.gzipKb}KB gzip   ${String(item.rawKb).padStart(4)}KB / ${item.budget.rawKb}KB`,
  );
}
console.log(`  … 검사한 페이지 ${htmlResults.length}개`);

console.log('\n초기 로딩 예산 (gzip)');
console.log('─'.repeat(78));
for (const item of results) {
  console.log(
    `${item.ok ? '✓' : '✗'} ${item.path.padEnd(24)} JS ${String(item.jsKb).padStart(6)}KB / ${item.maxJsKb}KB   CSS ${String(item.cssKb).padStart(5)}KB / ${item.maxCssKb}KB`,
  );
}
console.log('─'.repeat(78));

if (failed) {
  console.error('성능 예산을 초과했습니다.');
  process.exit(1);
}
console.log('모든 페이지가 성능 예산을 통과했습니다.\n');
