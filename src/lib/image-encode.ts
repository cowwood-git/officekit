// 브라우저 기본 인코더보다 작게 저장하는 코덱 설정(jSquash: MozJPEG·libwebp·OxiPNG).

export type EncodeMime = 'image/jpeg' | 'image/png' | 'image/webp';

/** OxiPNG 는 큰 이미지에서 느리므로 픽셀 수에 따라 최적화 단계를 낮춘다 */
export function oxipngLevel(width: number, height: number): number {
  const pixels = width * height;
  if (pixels > 16_000_000) return 1;
  if (pixels > 6_000_000) return 2;
  return 3;
}

/** 0~1 화질을 코덱의 0~100 값으로 */
export function codecQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 75;
  return Math.round(Math.min(1, Math.max(0, quality)) * 100);
}

/** 두 결과 중 더 작은 것을 고른다(코덱 결과가 오히려 크면 기본 인코더 결과를 쓴다) */
export function smaller<T extends { size: number }>(a: T, b: T | null | undefined): T {
  return b && b.size < a.size ? b : a;
}
