/** PDF 뷰어 배율 — 단계로 키우고 줄인다. 1 = 100%. */
export const ZOOM_STEPS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2, 3];
export const MIN_ZOOM = ZOOM_STEPS[0] as number;
export const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1] as number;

/** 지금 배율에서 한 단계 위·아래. 단계 사이(폭 맞춤 배율 등)에 있어도 자연스럽게 다음 단계로 간다. */
export function nextZoom(current: number, direction: 1 | -1): number {
  if (direction > 0) return ZOOM_STEPS.find((step) => step > current + 1e-6) ?? MAX_ZOOM;
  return [...ZOOM_STEPS].reverse().find((step) => step < current - 1e-6) ?? MIN_ZOOM;
}

/** 화면 폭에 맞추는 배율(여백 빼고). 범위를 벗어나지 않게 자른다. */
export function fitWidthZoom(containerWidth: number, pageWidth: number, padding = 32): number {
  if (!(containerWidth > 0 && pageWidth > 0)) return 1;
  const zoom = (containerWidth - padding) / pageWidth;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** 입력한 쪽 번호를 1~전체 범위로. 숫자가 아니면 null. */
export function clampPage(value: string | number, pageCount: number): number | null {
  const page = Math.trunc(Number(value));
  if (!Number.isFinite(page) || pageCount < 1) return null;
  return Math.min(pageCount, Math.max(1, page));
}
