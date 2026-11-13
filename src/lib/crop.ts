export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Handle = 'nw' | 'ne' | 'sw' | 'se';

export const MIN_CROP = 16;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/** 크롭 영역이 이미지 밖으로 나가지 않도록 보정한다. */
export function clampRect(rect: Rect, bounds: Size, minSize = MIN_CROP): Rect {
  const width = clamp(rect.width, Math.min(minSize, bounds.width), bounds.width);
  const height = clamp(rect.height, Math.min(minSize, bounds.height), bounds.height);
  const x = clamp(rect.x, 0, bounds.width - width);
  const y = clamp(rect.y, 0, bounds.height - height);
  return { x, y, width, height };
}

/** 현재 영역의 중심을 유지하며 주어진 비율에 맞는 최대 사각형을 만든다. */
export function fitAspect(rect: Rect, ratio: number, bounds: Size): Rect {
  if (!Number.isFinite(ratio) || ratio <= 0) return clampRect(rect, bounds);

  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  let width = rect.width;
  let height = width / ratio;
  if (height > rect.height) {
    height = rect.height;
    width = height * ratio;
  }

  // 이미지 경계를 넘으면 비율을 유지한 채 줄인다.
  const maxWidth = Math.min(bounds.width, bounds.height * ratio);
  if (width > maxWidth) {
    width = maxWidth;
    height = width / ratio;
  }

  return clampRect({ x: centerX - width / 2, y: centerY - height / 2, width, height }, bounds);
}

export function moveRect(rect: Rect, dx: number, dy: number, bounds: Size): Rect {
  return clampRect({ ...rect, x: rect.x + dx, y: rect.y + dy }, bounds);
}

/**
 * 모서리 핸들을 잡고 크기를 바꾼다. 반대편 모서리는 고정된다.
 * ratio 가 주어지면 비율을 유지한다.
 */
export function resizeRect(
  rect: Rect,
  handle: Handle,
  pointer: { x: number; y: number },
  bounds: Size,
  ratio: number | null = null,
  minSize = MIN_CROP,
): Rect {
  const anchorX = handle.includes('w') ? rect.x + rect.width : rect.x;
  const anchorY = handle.includes('n') ? rect.y + rect.height : rect.y;

  const availableWidth = handle.includes('w') ? anchorX : bounds.width - anchorX;
  const availableHeight = handle.includes('n') ? anchorY : bounds.height - anchorY;

  let width = Math.abs(pointer.x - anchorX);
  let height = Math.abs(pointer.y - anchorY);

  const smallest = Math.min(minSize, Math.min(availableWidth, availableHeight));

  if (ratio) {
    const maxWidth = Math.min(availableWidth, availableHeight * ratio);
    width = clamp(width, Math.min(smallest, maxWidth), maxWidth);
    height = width / ratio;
  } else {
    width = clamp(width, smallest, availableWidth);
    height = clamp(height, smallest, availableHeight);
  }

  const x = handle.includes('w') ? anchorX - width : anchorX;
  const y = handle.includes('n') ? anchorY - height : anchorY;

  return clampRect({ x, y, width, height }, bounds, minSize);
}

/** 표시 배율(화면 px / 원본 px)을 구한다. */
export function displayScale(natural: Size, max: Size): number {
  if (natural.width <= 0 || natural.height <= 0) return 1;
  return Math.min(max.width / natural.width, max.height / natural.height, 1);
}

/** 비율을 유지하면서 목표 크기를 계산한다. */
export function scaledSize(size: Size, targetWidth?: number, targetHeight?: number): Size {
  const ratio = size.width / size.height;
  if (targetWidth && targetWidth > 0) {
    return { width: Math.round(targetWidth), height: Math.round(targetWidth / ratio) };
  }
  if (targetHeight && targetHeight > 0) {
    return { width: Math.round(targetHeight * ratio), height: Math.round(targetHeight) };
  }
  return { width: Math.round(size.width), height: Math.round(size.height) };
}
