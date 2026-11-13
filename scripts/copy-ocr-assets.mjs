#!/usr/bin/env node
/**
 * tesseract.js 실행에 필요한 자산만 public/ocr/ 로 복사한다.
 * - worker.min.js
 * - SIMD LSTM 코어 (wasm + js)
 * - 한국어·영어 언어 데이터 (best_int, gzip)
 *
 * public/ocr/ 는 git 에 커밋하지 않고 predev/prebuild 에서 생성한다.
 */
import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const target = 'public/ocr';

await rm(target, { recursive: true, force: true });
await mkdir(join(target, 'core'), { recursive: true });
await mkdir(join(target, 'lang'), { recursive: true });

await cp('node_modules/tesseract.js/dist/worker.min.js', join(target, 'worker.min.js'));

for (const file of ['tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm']) {
  await cp(join('node_modules/tesseract.js-core', file), join(target, 'core', file));
}

for (const [language, source] of [
  ['kor', 'node_modules/@tesseract.js-data/kor/4.0.0_best_int/kor.traineddata.gz'],
  ['eng', 'node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'],
]) {
  await cp(source, join(target, 'lang', `${language}.traineddata.gz`));
}

console.log(`OCR 자산 복사 완료 → ${target}`);
