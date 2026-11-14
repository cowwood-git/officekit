import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ORT_DIR,
  BG_VERSION as SCRIPT_BG_VERSION,
  sha256,
  verifyChunk,
} from '../scripts/bg-assets.mjs';
import { NDARRAY_SAFE, REPLACEMENTS, rewriteImgly } from '../scripts/vite-imgly-self-host.mjs';
import { getTool } from '../src/data/tools';
import {
  BG_MODEL,
  BG_VERSION,
  cutoutName,
  DOWNLOAD_MB,
  downloadMb,
  fitSide,
  GPU_EXTRA_MB,
  isHexColor,
  MAX_SIDE,
} from '../src/lib/remove-bg';

const manifest = JSON.parse(readFileSync(`scripts/bg-models-${BG_VERSION}.json`, 'utf8')) as Record<
  string,
  { chunks: Array<{ name: string; offsets: [number, number] }> }
>;
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const ortSize = (name: string) => statSync(`node_modules/onnxruntime-web/dist/${name}`).size / 1e6;

describe('remove-bg 설정', () => {
  it('긴 변이 MAX_SIDE 를 넘으면 비율을 지켜 줄인다', () => {
    expect(fitSide(800, 600)).toEqual({ width: 800, height: 600 });
    expect(fitSide(8192, 4096)).toEqual({ width: MAX_SIDE, height: 2048 });
    expect(fitSide(3000, 6000, 1000)).toEqual({ width: 500, height: 1000 });
  });

  it('결과 파일 이름에 -누끼 를 붙이고 확장자를 바꾼다', () => {
    expect(cutoutName('제품 사진.JPG', 'png')).toBe('제품 사진-누끼.png');
    expect(cutoutName('a.b.heic', 'webp')).toBe('a.b-누끼.webp');
    expect(cutoutName('', 'jpg')).toBe('file-누끼.jpg');
  });

  it('#rrggbb 색만 받는다', () => {
    expect(isHexColor('#a0B1c2')).toBe(true);
    expect(isHexColor('#fff')).toBe(false);
    expect(isHexColor('red')).toBe(false);
    expect(isHexColor('#12345g')).toBe(false);
  });

  it('안내하는 다운로드 크기가 실제 모델·엔진 크기와 1MB 안에서 맞는다', () => {
    const cpu = ortSize('ort-wasm-simd-threaded.wasm');
    const gpuExtra = ortSize('ort-wasm-simd-threaded.jsep.wasm') - cpu;
    const entry = manifest[`/models/${BG_MODEL}`];
    expect(entry).toBeDefined();
    const bytes =
      (entry?.chunks ?? []).reduce((sum, c) => sum + c.offsets[1] - c.offsets[0], 0) / 1e6;
    expect(Math.abs(DOWNLOAD_MB - (bytes + cpu))).toBeLessThan(1);
    // 쓰지 않는 모델은 받지도 배포하지도 않는다.
    expect(Object.keys(manifest)).toEqual([`/models/${BG_MODEL}`]);
    expect(Math.abs(GPU_EXTRA_MB - gpuExtra)).toBeLessThan(1);
    expect(downloadMb(true)).toBe(DOWNLOAD_MB + GPU_EXTRA_MB);
    expect(downloadMb(false)).toBe(DOWNLOAD_MB);
  });
});

describe('remove-bg 안내 문구', () => {
  it('도구 FAQ 의 다운로드 크기가 실제 값과 같다', () => {
    for (const slug of ['remove-background', 'id-photo']) {
      const text = (getTool(slug)?.faq ?? []).map((item) => item.a).join(' ');
      const sizes = [...text.matchAll(/(\d+)MB/g)].map((match) => Number(match[1]));
      expect(sizes.length, slug).toBeGreaterThan(0);
      for (const size of sizes) expect(size, slug).toBe(DOWNLOAD_MB);
    }
  });
});

describe('remove-bg 버전 맞춤', () => {
  it('화면·빌드 스크립트·서비스 워커·package.json 의 버전이 같다', () => {
    expect(SCRIPT_BG_VERSION).toBe(BG_VERSION);
    expect(pkg.dependencies['@imgly/background-removal']).toBe(BG_VERSION);
    expect(ORT_DIR).toBe(`ort-${pkg.dependencies['onnxruntime-web']}`);
    const sw = readFileSync('public/sw.js', 'utf8');
    expect(sw).toContain(`'/bg/${BG_VERSION}/'`);
    expect(sw).toContain(`'/bg/${ORT_DIR}/'`);
  });

  it('모델 조각 이름은 내용의 SHA-256 이다', () => {
    const buffer = Buffer.from('officekit');
    const name = sha256(buffer);
    expect(verifyChunk(name, buffer, buffer.length)).toBe(true);
    expect(verifyChunk(name, buffer, buffer.length + 1)).toBe(false);
    expect(verifyChunk(name, Buffer.from('changed!!'), 9)).toBe(false);
    expect(verifyChunk('../etc/passwd', buffer, buffer.length)).toBe(false);
    for (const entry of Object.values(manifest)) {
      for (const chunk of entry.chunks) expect(chunk.name).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});

describe('vite-imgly-self-host', () => {
  const source = readFileSync('node_modules/@imgly/background-removal/dist/index.mjs', 'utf8');

  it('설치된 imgly 에서 blob: 로 엔진을 불러오는 두 줄을 이 사이트 경로로 바꾼다', () => {
    const out = rewriteImgly(source);
    for (const [from, to] of REPLACEMENTS) {
      expect(out).not.toContain(from);
      expect(out).toContain(to);
    }
    expect(out).toContain(`../${ORT_DIR}/`);
  });

  it('CSP 에 막히는 new Function(eval) 을 쓰는 ndarray 를 빼낸다', () => {
    const out = rewriteImgly(source);
    expect(out).toContain('officekit-ndarray-csp-safe');
    expect(out).not.toMatch(/new Function\(/);
  });

  it('바꿔 넣은 ndarray 는 행 우선 3차원 get/set 이 원래와 같다', () => {
    const module = { exports: undefined as unknown };
    // __commonJS 래퍼를 흉내 내 모듈 본문만 실행한다.
    new Function('__commonJS', `${NDARRAY_SAFE}; require_ndarray();`)(
      (def: Record<string, (exports: unknown, module: unknown) => void>) => () =>
        Object.values(def)[0]?.({}, module),
    );
    type Nd = {
      data: Float32Array;
      shape: number[];
      get: (...i: number[]) => number;
      set: (...i: number[]) => number;
    };
    const ndarray = module.exports as (data: Float32Array, shape: number[]) => Nd;
    const data = new Float32Array(2 * 3 * 4).map((_, i) => i);
    const t = ndarray(data, [2, 3, 4]);
    expect(t.shape).toEqual([2, 3, 4]);
    expect(t.get(1, 2, 3)).toBe(1 * 12 + 2 * 4 + 3);
    expect(t.get(0, 1, 2)).toBe(6);
    t.set(1, 0, 1, -5);
    expect(data[13]).toBe(-5);
    const flat = ndarray(new Float32Array([7, 8, 9]), [3]);
    expect(flat.get(2)).toBe(9);
    flat.set(0, 1);
    expect(flat.data[0]).toBe(1);
  });

  it('라이브러리 코드가 바뀌어 대상이 없으면 빌드를 멈춘다', () => {
    expect(() => rewriteImgly('export {}')).toThrow(/imgly/);
  });
});
