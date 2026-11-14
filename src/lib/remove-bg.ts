// 배경 지우기(누끼) 설정 — 모델·다운로드 크기·결과 파일 이름.
import { safeFileName } from './files';

/**
 * ISNet fp16 하나만 쓴다. 더 작은 quint8 판은 단색 배경에 얼룩이 크게 남고(실측) 속도도 비슷해서 뺐다.
 * 원본(fp32, 176MB)은 fp16 과 결과 차이가 거의 없어 받는 크기만 두 배다.
 */
export const BG_MODEL = 'isnet_fp16';

/** /bg/ 아래 모델 버전 — scripts/bg-assets.mjs 의 BG_VERSION 과 같아야 한다 */
export const BG_VERSION = '1.7.0';

/** 처음 한 번 받는 크기(MB, 모델 + 실행 엔진). 정확한 값은 scripts/bg-models-*.json 기준(테스트로 확인) */
export const DOWNLOAD_MB = 101;

/** 그래픽 가속(WebGPU)판 실행 엔진은 일반판보다 11MB 더 크다 */
export const GPU_EXTRA_MB = 11;

export function downloadMb(gpu: boolean): number {
  return DOWNLOAD_MB + (gpu ? GPU_EXTRA_MB : 0);
}

/** 너무 큰 사진은 메모리를 아끼려고 긴 변을 이 크기로 줄인 뒤 처리한다 */
export const MAX_SIDE = 4096;

export function fitSide(width: number, height: number, max = MAX_SIDE) {
  const long = Math.max(width, height);
  if (long <= max) return { width, height };
  const ratio = max / long;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

export type BgOutput = 'png' | 'webp' | 'jpg';

export function cutoutName(original: string, output: BgOutput): string {
  const base = safeFileName(original.replace(/\.[^.]+$/, ''));
  return `${base}-누끼.${output}`;
}

/** #rrggbb 만 받는다 */
export function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}
