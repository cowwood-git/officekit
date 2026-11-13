import { displayedSize, normalizeRotation, type PageRotation } from './pdf-watermark';

export interface CropMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MM_TO_PT = 72 / 25.4;

export function mmToPt(value: number): number {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  return safe * MM_TO_PT;
}

export function ptToMm(value: number): number {
  return value / MM_TO_PT;
}

/**
 * 표시 방향 기준 여백을 페이지 좌표의 CropBox로 바꾼다.
 * 회전 페이지에서도 위·아래·왼쪽·오른쪽이 화면 기준으로 유지된다.
 */
export function cropBoxFor(
  width: number,
  height: number,
  rotationAngle: number,
  margins: CropMargins,
): CropBox {
  const rotation = normalizeRotation(rotationAngle);
  const top = Math.max(0, margins.top);
  const right = Math.max(0, margins.right);
  const bottom = Math.max(0, margins.bottom);
  const left = Math.max(0, margins.left);

  let box: CropBox;
  switch (rotation) {
    case 90:
      box = { x: top, y: left, width: width - top - bottom, height: height - left - right };
      break;
    case 180:
      box = { x: right, y: bottom, width: width - right - left, height: height - bottom - top };
      break;
    case 270:
      box = { x: bottom, y: right, width: width - bottom - top, height: height - right - left };
      break;
    default:
      box = { x: left, y: bottom, width: width - left - right, height: height - top - bottom };
  }

  const minSize = 18;
  if (box.width < minSize) {
    box.x = Math.min(Math.max(0, box.x), Math.max(0, width - minSize));
    box.width = minSize;
  }
  if (box.height < minSize) {
    box.y = Math.min(Math.max(0, box.y), Math.max(0, height - minSize));
    box.height = minSize;
  }

  box.x = Math.min(Math.max(0, box.x), Math.max(0, width - box.width));
  box.y = Math.min(Math.max(0, box.y), Math.max(0, height - box.height));
  box.width = Math.min(box.width, width);
  box.height = Math.min(box.height, height);
  return box;
}

/** CropBox가 적용된 뒤 화면에 보이는 페이지 크기. */
export function croppedDisplaySize(
  rotation: PageRotation,
  box: CropBox,
): { width: number; height: number } {
  return displayedSize(box.width, box.height, rotation);
}

export function cropFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'document'}-cropped.pdf`;
}
