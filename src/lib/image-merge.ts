import type { Size } from './crop';

export type MergeMode = 'horizontal' | 'vertical' | 'grid';

export interface ImagePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MergeLayout {
  width: number;
  height: number;
  placements: ImagePlacement[];
}

export function gridDimensions(count: number): { cols: number; rows: number } {
  const safe = Math.max(1, Math.trunc(count));
  const cols = Math.ceil(Math.sqrt(safe));
  return { cols, rows: Math.ceil(safe / cols) };
}

/** 여러 이미지를 가로·세로·격자로 배치한다. 좌표는 왼쪽 위 기준. */
export function mergeLayout(sizes: Size[], mode: MergeMode, gap = 0): MergeLayout {
  const items = sizes.filter((size) => size.width > 0 && size.height > 0);
  if (items.length === 0) return { width: 0, height: 0, placements: [] };

  const safeGap = Math.max(0, gap);

  if (mode === 'horizontal') {
    const targetHeight = Math.max(...items.map((size) => size.height));
    let cursor = 0;
    const placements = items.map((size) => {
      const scale = targetHeight / size.height;
      const width = size.width * scale;
      const placement = { x: cursor, y: 0, width, height: targetHeight };
      cursor += width + safeGap;
      return placement;
    });
    return {
      width: Math.max(0, cursor - safeGap),
      height: targetHeight,
      placements,
    };
  }

  if (mode === 'vertical') {
    const targetWidth = Math.max(...items.map((size) => size.width));
    let cursor = 0;
    const placements = items.map((size) => {
      const scale = targetWidth / size.width;
      const height = size.height * scale;
      const placement = { x: 0, y: cursor, width: targetWidth, height };
      cursor += height + safeGap;
      return placement;
    });
    return {
      width: targetWidth,
      height: Math.max(0, cursor - safeGap),
      placements,
    };
  }

  const { cols, rows } = gridDimensions(items.length);
  const cellWidth = Math.max(...items.map((size) => size.width));
  const cellHeight = Math.max(...items.map((size) => size.height));
  const placements = items.map((size, index) => {
    const column = index % cols;
    const row = Math.floor(index / cols);
    const scale = Math.min(cellWidth / size.width, cellHeight / size.height);
    const width = size.width * scale;
    const height = size.height * scale;
    return {
      x: column * (cellWidth + safeGap) + (cellWidth - width) / 2,
      y: row * (cellHeight + safeGap) + (cellHeight - height) / 2,
      width,
      height,
    };
  });

  return {
    width: cols * cellWidth + (cols - 1) * safeGap,
    height: rows * cellHeight + (rows - 1) * safeGap,
    placements,
  };
}
