#!/usr/bin/env node
/**
 * rhwp(HWP/HWPX 파서) WASM을 public/rhwp/ 로 압축 복사한다.
 * - 원본 rhwp_bg.wasm 은 25MiB 가 넘어 Cloudflare Pages 파일 제한을 넘는다.
 * - gzip 으로 압축해 두고, HWP를 열 때 브라우저에서 DecompressionStream 으로 푼다.
 * - public/rhwp/ 는 git 에 커밋하지 않는다.
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const source = 'node_modules/@rhwp/core/rhwp_bg.wasm';
const target = 'public/rhwp/rhwp_bg.wasm.gz';
const moduleTarget = 'public/rhwp/rhwp.js';

await mkdir('public/rhwp', { recursive: true });
const bytes = await readFile(source);
const compressed = gzipSync(bytes, { level: 9 });
await writeFile(target, compressed);
await copyFile('node_modules/@rhwp/core/rhwp.js', moduleTarget);

const mb = (value) => `${(value / 1024 / 1024).toFixed(1)}MB`;
console.log(
  `rhwp WASM 압축 복사 완료 → ${target} (${mb(bytes.length)} → ${mb(compressed.length)})`,
);
