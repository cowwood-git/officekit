export type CollageMode = 'justified' | 'grid' | 'horizontal' | 'vertical';

export interface CollageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollageOptions {
  width: number;
  height: number;
  gap: number;
  margin: number;
  mode: CollageMode;
}

export interface SourceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const COLLAGE_RATIOS = {
  square: { label: '1:1 정사각형', width: 1080, height: 1080 },
  portrait: { label: '4:5 인스타그램', width: 1080, height: 1350 },
  story: { label: '9:16 스토리', width: 1080, height: 1920 },
  wide: { label: '16:9 와이드', width: 1920, height: 1080 },
  photo: { label: '3:2 사진', width: 1500, height: 1000 },
} as const;

export type CollageRatio = keyof typeof COLLAGE_RATIOS;

/** 이미지 수와 캔버스 비율에 맞춰 행 수를 고른다. */
export function chooseRows(count: number, width: number, height: number): number {
  const safe = Math.max(1, Math.trunc(count));
  if (safe === 1) return 1;
  if (safe === 2) return height > width * 1.1 ? 2 : 1;
  const rows = Math.round(Math.sqrt(safe * (height / width)));
  return Math.min(safe, Math.max(1, rows));
}

function distribute(count: number, rows: number): number[] {
  const base = Math.floor(count / rows);
  const extra = count % rows;
  return Array.from({ length: rows }, (_, index) => base + (index < extra ? 1 : 0));
}

/** 저스트파이드: 행마다 높이를 맞추고 이미지 비율로 너비를 채운다. */
export function justifiedLayout(aspects: number[], options: CollageOptions): CollageRect[] {
  const count = aspects.length;
  if (count === 0) return [];
  const gap = Math.max(0, options.gap);
  const margin = Math.max(0, options.margin);
  const availableWidth = Math.max(1, options.width - margin * 2);
  const availableHeight = Math.max(1, options.height - margin * 2);
  const rows = Math.min(count, chooseRows(count, options.width, options.height));
  const counts = distribute(count, rows);
  const rowHeight = (availableHeight - gap * (rows - 1)) / rows;
  const rects: CollageRect[] = [];
  let index = 0;

  for (let row = 0; row < rows; row += 1) {
    const rowCount = counts[row] ?? 0;
    if (rowCount === 0) continue;
    const rowAspects = aspects.slice(index, index + rowCount);
    const aspectSum = rowAspects.reduce((sum, aspect) => sum + Math.max(0.05, aspect), 0);
    const rowWidth = availableWidth - gap * (rowCount - 1);
    let x = margin;
    const y = margin + row * (rowHeight + gap);
    for (const aspect of rowAspects) {
      const width = (rowWidth * Math.max(0.05, aspect)) / aspectSum;
      rects.push({ x, y, width, height: rowHeight });
      x += width + gap;
    }
    index += rowCount;
  }
  return rects;
}

/** 균등 격자. 마지막 행은 가운데 정렬한다. */
export function gridLayout(aspects: number[], options: CollageOptions): CollageRect[] {
  const count = aspects.length;
  if (count === 0) return [];
  const gap = Math.max(0, options.gap);
  const margin = Math.max(0, options.margin);
  const availableWidth = Math.max(1, options.width - margin * 2);
  const availableHeight = Math.max(1, options.height - margin * 2);
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellWidth = (availableWidth - gap * (cols - 1)) / cols;
  const cellHeight = (availableHeight - gap * (rows - 1)) / rows;
  const rects: CollageRect[] = [];

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const itemsInRow = Math.min(cols, count - row * cols);
    const groupWidth = itemsInRow * cellWidth + (itemsInRow - 1) * gap;
    const startX = margin + (availableWidth - groupWidth) / 2;
    rects.push({
      x: startX + col * (cellWidth + gap),
      y: margin + row * (cellHeight + gap),
      width: cellWidth,
      height: cellHeight,
    });
  }
  return rects;
}

/** 세로 스트립. 각 이미지 높이를 원본 비율에 비례해 채운다. */
export function verticalLayout(aspects: number[], options: CollageOptions): CollageRect[] {
  const count = aspects.length;
  if (count === 0) return [];
  const gap = Math.max(0, options.gap);
  const margin = Math.max(0, options.margin);
  const availableWidth = Math.max(1, options.width - margin * 2);
  const availableHeight = Math.max(1, options.height - margin * 2);
  const weights = aspects.map((aspect) => 1 / Math.max(0.05, aspect));
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const usable = availableHeight - gap * (count - 1);
  let y = margin;
  return weights.map((weight) => {
    const height = (usable * weight) / weightSum;
    const rect = { x: margin, y, width: availableWidth, height };
    y += height + gap;
    return rect;
  });
}

export function collageLayout(aspects: number[], options: CollageOptions): CollageRect[] {
  if (options.mode === 'grid') return gridLayout(aspects, options);
  if (options.mode === 'vertical') return verticalLayout(aspects, options);
  if (options.mode === 'horizontal') return horizontalLayout(aspects, options);
  return justifiedLayout(aspects, options);
}

export function horizontalLayout(aspects: number[], options: CollageOptions): CollageRect[] {
  const count = aspects.length;
  if (count === 0) return [];
  const gap = Math.max(0, options.gap);
  const margin = Math.max(0, options.margin);
  const availableWidth = Math.max(1, options.width - margin * 2);
  const availableHeight = Math.max(1, options.height - margin * 2);
  const aspectSum = aspects.reduce((sum, aspect) => sum + Math.max(0.05, aspect), 0);
  const usable = availableWidth - gap * (count - 1);
  let x = margin;
  return aspects.map((aspect) => {
    const width = (usable * Math.max(0.05, aspect)) / aspectSum;
    const rect = { x, y: margin, width, height: availableHeight };
    x += width + gap;
    return rect;
  });
}

/** cover 방식으로 이미지를 셀에 채울 때 잘라낼 원본 영역. */
export function coverCrop(
  sourceWidth: number,
  sourceHeight: number,
  cellWidth: number,
  cellHeight: number,
): SourceRect {
  if (sourceWidth <= 0 || sourceHeight <= 0 || cellWidth <= 0 || cellHeight <= 0) {
    return { x: 0, y: 0, width: Math.max(1, sourceWidth), height: Math.max(1, sourceHeight) };
  }
  const scale = Math.max(cellWidth / sourceWidth, cellHeight / sourceHeight);
  const width = cellWidth / scale;
  const height = cellHeight / scale;
  return {
    x: (sourceWidth - width) / 2,
    y: (sourceHeight - height) / 2,
    width,
    height,
  };
}

export function collageFileName(original?: string): string {
  const base = (original ?? 'collage').replace(/\.[^.]+$/, '').trim();
  return `${base || 'collage'}-collage.png`;
}
