export interface RedactionRect {
  /** 0~1, 왼쪽 기준 */
  x: number;
  /** 0~1, 위 기준 */
  y: number;
  width: number;
  height: number;
}

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function normalizeRedactionRect(rect: RedactionRect): RedactionRect | null {
  const x = Math.min(1, Math.max(0, rect.x));
  const y = Math.min(1, Math.max(0, rect.y));
  const width = Math.min(1 - x, Math.max(0, rect.width));
  const height = Math.min(1 - y, Math.max(0, rect.height));
  if (width < 0.002 || height < 0.002) return null;
  return { x, y, width, height };
}

export function rectToPixels(rect: RedactionRect, width: number, height: number): PixelRect {
  return {
    x: Math.round(rect.x * width),
    y: Math.round(rect.y * height),
    width: Math.max(1, Math.round(rect.width * width)),
    height: Math.max(1, Math.round(rect.height * height)),
  };
}

/** 그리기 시작·끝 좌표를 정규화된 사각형으로 만든다. */
export function boxFromPoints(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  canvasWidth: number,
  canvasHeight: number,
): RedactionRect | null {
  if (canvasWidth <= 0 || canvasHeight <= 0) return null;
  const x = Math.min(startX, endX) / canvasWidth;
  const y = Math.min(startY, endY) / canvasHeight;
  const width = Math.abs(endX - startX) / canvasWidth;
  const height = Math.abs(endY - startY) / canvasHeight;
  return normalizeRedactionRect({ x, y, width, height });
}

export function totalBoxes(boxes: Map<number, RedactionRect[]>): number {
  let count = 0;
  for (const list of boxes.values()) count += list.length;
  return count;
}

export function redactedPageCount(boxes: Map<number, RedactionRect[]>): number {
  let count = 0;
  for (const list of boxes.values()) if (list.length > 0) count += 1;
  return count;
}

export function redactionFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'document'}-redacted.pdf`;
}
