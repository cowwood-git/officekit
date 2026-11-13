import { fitWithin } from './files';
import type { OutputMime } from './image-convert';

/**
 * 이미지 크기 조절 — 기준(비율·가로·세로·가로×세로)에 따라 결과 픽셀 크기를 정한다.
 * 결과가 MAX_SIDE 를 넘으면 비율을 지키며 줄인다(브라우저 캔버스 한계·메모리 보호).
 */
export type ResizeMode = 'percent' | 'width' | 'height' | 'box';

export interface ResizeOptions {
  mode: ResizeMode;
  percent: number;
  width: number;
  height: number;
  /** box 일 때만: 비율을 지키며 상자 안에 맞춘다(아니면 정확히 그 크기로 늘린다) */
  keepRatio: boolean;
}

export interface Size {
  width: number;
  height: number;
}

export const MAX_SIDE = 8000;

const positive = (value: number) => Number.isFinite(value) && value > 0;

/** 입력값 검사. 문제가 없으면 빈 문자열. */
export function resizeError(options: ResizeOptions): string {
  const { mode, percent, width, height } = options;
  if (mode === 'percent' && !(positive(percent) && percent <= 1000))
    return '비율은 1~1000% 사이로 적어 주세요.';
  if ((mode === 'width' || mode === 'box') && !(positive(width) && width <= MAX_SIDE))
    return `가로 길이는 1~${MAX_SIDE}px 사이로 적어 주세요.`;
  if ((mode === 'height' || mode === 'box') && !(positive(height) && height <= MAX_SIDE))
    return `세로 길이는 1~${MAX_SIDE}px 사이로 적어 주세요.`;
  return '';
}

export function resizeTarget(source: Size, options: ResizeOptions): Size {
  const { width: w, height: h } = source;
  let out: Size;
  switch (options.mode) {
    case 'percent':
      out = { width: (w * options.percent) / 100, height: (h * options.percent) / 100 };
      break;
    case 'width':
      out = { width: options.width, height: (h * options.width) / w };
      break;
    case 'height':
      out = { width: (w * options.height) / h, height: options.height };
      break;
    case 'box': {
      if (!options.keepRatio) {
        out = { width: options.width, height: options.height };
        break;
      }
      const scale = Math.min(options.width / w, options.height / h);
      out = { width: w * scale, height: h * scale };
      break;
    }
  }
  const rounded = {
    width: Math.max(1, Math.round(out.width)),
    height: Math.max(1, Math.round(out.height)),
  };
  return fitWithin(rounded, MAX_SIDE);
}

/** "원본 형식 유지"일 때 저장 형식: 브라우저가 저장할 수 있는 형식이면 그대로, 아니면 PNG */
export function keepFormat(type: string): OutputMime {
  if (type === 'image/jpeg' || type === 'image/png' || type === 'image/webp') return type;
  return 'image/png';
}
