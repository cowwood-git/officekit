#!/usr/bin/env node
/**
 * pdf.js 가 필요할 때만 불러오는 정적 자산을 public/ 으로 복사한다.
 * - cmaps: CJK CID 폰트 매핑
 * - standard_fonts: Helvetica 등 표준 14폰트
 * - wasm: JBIG2/JPEG2000 이미지 디코더
 * - iccs: 색상 프로파일
 *
 * 빌드/개발 시작 시 자동 실행되며, public/pdfjs/ 는 git 에 커밋하지 않는다.
 */
import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const source = 'node_modules/pdfjs-dist';
const target = 'public/pdfjs';
const dirs = ['cmaps', 'standard_fonts', 'wasm', 'iccs'];

await mkdir(target, { recursive: true });

for (const dir of dirs) {
  const to = join(target, dir);
  await rm(to, { recursive: true, force: true });
  await cp(join(source, dir), to, { recursive: true });
}

console.log(`pdf.js 정적 자산 복사 완료 → ${target}`);
