// 배경 지우기(imgly) 실행 파일을 이 사이트(/bg/)에서 내려주도록 준비한다.
// - 모델: IMG.LY 배포본을 받아 SHA-256 을 저장소에 고정된 목록(bg-models-<버전>.json)과 대조한다.
//   한 번 받으면 .cache/bg 에 두고 다시 받지 않는다.
// - onnxruntime 실행 파일: npm 의 onnxruntime-web 에서 그대로 복사한다(라이브러리와 같은 버전).
// 결과는 public/bg/<모델 버전>/ 와 public/bg/ort-<버전>/ (저장소에는 넣지 않는다).
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
export const BG_VERSION = '1.7.0';
export const ORT_FILES = [
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.jsep.wasm',
  'ort-wasm-simd-threaded.jsep.mjs',
];
/** onnxruntime 실행 파일 폴더 — 버전을 이름에 넣어 영구 캐시해도 낡은 파일이 남지 않게 한다 */
export const ORT_VERSION = JSON.parse(
  readFileSync(join(ROOT, 'node_modules', 'onnxruntime-web', 'package.json'), 'utf8'),
).version;
export const ORT_DIR = `ort-${ORT_VERSION}`;
const CDN = `https://staticimgly.com/@imgly/background-removal-data/${BG_VERSION}/dist/`;
const CACHE = join(ROOT, '.cache', 'bg', BG_VERSION);
const OUT = join(ROOT, 'public', 'bg');

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/** 모든 조각의 해시가 이름과 같은지 확인한다. 하나라도 다르면 받지 않은 것으로 본다. */
export function verifyChunk(name, buffer, expectedSize) {
  return /^[0-9a-f]{64}$/.test(name) && buffer.length === expectedSize && sha256(buffer) === name;
}

async function ensureChunk(chunk) {
  const file = join(CACHE, chunk.name);
  const size = chunk.offsets[1] - chunk.offsets[0];
  if (existsSync(file) && verifyChunk(chunk.name, readFileSync(file), size)) return file;
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(new URL(chunk.name, CDN), {
        signal: AbortSignal.timeout(180_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      // 해시가 다르면 재시도하지 않고 바로 멈춘다(내용이 바뀐 파일은 받지 않는다).
      if (!verifyChunk(chunk.name, buffer, size)) {
        throw Object.assign(new Error(`모델 조각 해시가 맞지 않습니다: ${chunk.name}`), {
          fatal: true,
        });
      }
      mkdirSync(CACHE, { recursive: true });
      writeFileSync(file, buffer);
      return file;
    } catch (error) {
      if (error.fatal) throw error;
      lastError = error;
    }
  }
  throw new Error(`모델 조각을 받지 못했습니다: ${chunk.name} (${lastError?.message})`);
}

/** 조각을 4개씩 동시에 받는다 */
async function ensureAll(chunks) {
  const queue = [...chunks];
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length > 0) await ensureChunk(queue.shift());
  });
  await Promise.all(workers);
}

export async function prepare() {
  const models = JSON.parse(
    readFileSync(join(ROOT, 'scripts', `bg-models-${BG_VERSION}.json`), 'utf8'),
  );
  rmSync(OUT, { recursive: true, force: true });
  const modelDir = join(OUT, BG_VERSION);
  mkdirSync(modelDir, { recursive: true });
  let bytes = 0;
  await ensureAll(Object.values(models).flatMap((entry) => entry.chunks));
  for (const entry of Object.values(models)) {
    for (const chunk of entry.chunks) {
      copyFileSync(join(CACHE, chunk.name), join(modelDir, chunk.name));
      bytes += chunk.offsets[1] - chunk.offsets[0];
    }
  }
  writeFileSync(join(modelDir, 'resources.json'), JSON.stringify(models));

  const ortDir = join(OUT, ORT_DIR);
  mkdirSync(ortDir, { recursive: true });
  const ortDist = join(ROOT, 'node_modules', 'onnxruntime-web', 'dist');
  for (const name of ORT_FILES) {
    copyFileSync(join(ortDist, name), join(ortDir, name));
  }
  mkdirSync(dirname(OUT), { recursive: true });
  return bytes;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  prepare()
    .then((bytes) => console.log(`public/bg: 모델 ${(bytes / 1e6).toFixed(1)}MB 준비`))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
