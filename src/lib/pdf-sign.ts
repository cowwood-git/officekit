export interface NormalizedRect {
  /** 0~1, 왼쪽 기준 */
  x: number;
  /** 0~1, 위 기준 */
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_SIGNATURE_RECT: NormalizedRect = {
  x: 0.62,
  y: 0.78,
  width: 0.3,
  height: 0.12,
};

export function clampSignatureRect(rect: NormalizedRect): NormalizedRect {
  const width = Math.min(0.9, Math.max(0.05, rect.width));
  const height = Math.min(0.9, Math.max(0.03, rect.height));
  return {
    x: Math.min(1 - width, Math.max(0, rect.x)),
    y: Math.min(1 - height, Math.max(0, rect.y)),
    width,
    height,
  };
}

/** 서명 캔버스에서 투명 여백을 잘라낸 경계를 찾는다. */
export function transparentBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): { x: number; y: number; width: number; height: number } | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3] ?? 0;
      if (alpha > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export function signatureFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'document'}-signed.pdf`;
}

export function isPointInsideRect(x: number, y: number, rect: NormalizedRect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}
