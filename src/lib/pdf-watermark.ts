import { safeFileName } from './files';

/** 워터마크 오버레이를 만들 해상도. 페이지 원본은 벡터로 유지된다. */
export const WATERMARK_DPI = 150;
/** 오버레이 캔버스의 긴 변 최대 픽셀. 비정상적으로 큰 페이지의 메모리 폭주를 막는다. */
export const WATERMARK_MAX_PIXELS = 3200;

export type PageRotation = 0 | 90 | 180 | 270;

/** PDF /Rotate 값을 0·90·180·270으로 정규화한다. */
export function normalizeRotation(angle: number): PageRotation {
  if (!Number.isFinite(angle)) return 0;
  const snapped = Math.round(angle / 90) * 90;
  return (((snapped % 360) + 360) % 360) as PageRotation;
}

/** 회전을 적용했을 때 화면에 보이는 페이지 크기. */
export function displayedSize(
  width: number,
  height: number,
  rotation: PageRotation,
): { width: number; height: number } {
  return rotation === 90 || rotation === 270 ? { width: height, height: width } : { width, height };
}

/** 화면 방향 오버레이를 페이지 좌표로 되돌리는 회전 각도. */
export function preRotationFor(rotation: PageRotation): number {
  if (rotation === 90) return -90;
  if (rotation === 180) return 180;
  if (rotation === 270) return 90;
  return 0;
}

/** 페이지 포인트 크기 → 오버레이 픽셀 크기 (긴 변 상한 적용). */
export function overlaySize(
  pageWidth: number,
  pageHeight: number,
  dpi: number = WATERMARK_DPI,
): { width: number; height: number } {
  const scale = Math.min(300, Math.max(72, Number.isFinite(dpi) ? dpi : WATERMARK_DPI)) / 72;
  let width = Math.max(1, Math.round(Math.abs(pageWidth) * scale));
  let height = Math.max(1, Math.round(Math.abs(pageHeight) * scale));

  const longest = Math.max(width, height);
  if (longest > WATERMARK_MAX_PIXELS) {
    const ratio = WATERMARK_MAX_PIXELS / longest;
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }
  return { width, height };
}

/** 원본 파일명에서 결과 파일명을 만든다. */
export function watermarkFileName(original: string): string {
  const base = safeFileName(original.replace(/\.[^.]+$/, '')) || 'document';
  return `${base}-watermark.pdf`;
}

export interface WatermarkSummaryInput {
  pageCount: number;
  appliedCount: number;
  bytes: number;
}

/** 결과 요약 문구. */
export function watermarkSummary({
  pageCount,
  appliedCount,
  bytes,
}: WatermarkSummaryInput): string {
  const size =
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${pageCount}쪽 중 ${appliedCount}쪽에 넣었습니다 · ${size}`;
}
