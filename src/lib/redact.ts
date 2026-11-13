import { MIN_CROP, type Rect, type Size } from './crop';

/** 이미지 중앙에 기본 가릴 영역을 만든다. */
export function centeredRegion(bounds: Size, fraction = 0.35): Rect {
  const width = Math.max(MIN_CROP, Math.round(bounds.width * fraction));
  const height = Math.max(MIN_CROP, Math.round(bounds.height * fraction));
  return {
    x: Math.round((bounds.width - width) / 2),
    y: Math.round((bounds.height - height) / 2),
    width,
    height,
  };
}

/** 모자이크 블록 크기(px). scale 은 미리보기/원본 비율. */
export function mosaicBlock(strength: number, scale = 1): number {
  return Math.max(2, Math.round(Math.max(2, strength) * scale));
}

/** 블러 반경(px). 강도 절반을 반경으로 쓴다. */
export function blurRadius(strength: number, scale = 1): number {
  return Math.max(1, (Math.max(2, strength) * scale) / 2);
}

/** 6000px를 넘는 원본은 축소 저장한다. */
export function exportScaleFor(bounds: Size, max = 6000): number {
  const longest = Math.max(bounds.width, bounds.height);
  if (longest <= max) return 1;
  return max / longest;
}
