#!/usr/bin/env node
/**
 * 초기 로딩 성능 예산 검사.
 * HTML이 직접 참조하는 JS/CSS(동적 import 제외)의 gzip 크기를 합산한다.
 */
import { readFile } from 'node:fs/promises';
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
