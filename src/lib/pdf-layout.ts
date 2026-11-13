import type { PageRotation } from './pdf-watermark';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89, label: 'A4' },
  a3: { width: 841.89, height: 1190.55, label: 'A3' },
  a5: { width: 419.53, height: 595.28, label: 'A5' },
  letter: { width: 612, height: 792, label: 'Letter' },
  legal: { width: 612, height: 1008, label: 'Legal' },
} as const;

export type PageSizeId = keyof typeof PAGE_SIZES;
export type PerSheet = 2 | 4 | 6 | 9;
export type Orientation = 'portrait' | 'landscape';

export const PER_SHEET_OPTIONS: Array<{ value: PerSheet; label: string }> = [
  { value: 2, label: '2쪽 (1×2)' },
  { value: 4, label: '4쪽 (2×2)' },
  { value: 6, label: '6쪽 (2×3)' },
  { value: 9, label: '9쪽 (3×3)' },
];

export function sheetSize(
  id: PageSizeId,
  orientation: Orientation,
): { width: number; height: number } {
  const size = PAGE_SIZES[id];
  return orientation === 'landscape'
    ? { width: size.height, height: size.width }
    : { width: size.width, height: size.height };
}

/** 한 장에 넣을 쪽수에 따른 행·열. 가로 방향이면 행·열을 바꾼다. */
export function gridFor(
  perSheet: PerSheet,
  orientation: Orientation = 'portrait',
): { cols: number; rows: number } {
  const portrait: Record<PerSheet, [number, number]> = {
    2: [1, 2],
    4: [2, 2],
    6: [2, 3],
    9: [3, 3],
  };
  const [cols, rows] = portrait[perSheet] ?? [1, 1];
  return orientation === 'landscape' ? { cols: rows, rows: cols } : { cols, rows };
}

/** 시트 안에 셀을 배치한다. PDF 좌표(왼쪽 아래) 기준, 위에서 아래로 읽기 순서. */
export function cellRects(
  sheetWidth: number,
  sheetHeight: number,
  cols: number,
  rows: number,
  margin: number,
  gap: number,
): Rect[] {
  const safeCols = Math.max(1, Math.trunc(cols));
  const safeRows = Math.max(1, Math.trunc(rows));
  const usableWidth = Math.max(1, sheetWidth - margin * 2 - gap * (safeCols - 1));
  const usableHeight = Math.max(1, sheetHeight - margin * 2 - gap * (safeRows - 1));
  const cellWidth = usableWidth / safeCols;
  const cellHeight = usableHeight / safeRows;
  const cells: Rect[] = [];

  for (let row = 0; row < safeRows; row += 1) {
    for (let column = 0; column < safeCols; column += 1) {
      cells.push({
        x: margin + column * (cellWidth + gap),
        y: sheetHeight - margin - (row + 1) * cellHeight - row * gap,
        width: cellWidth,
        height: cellHeight,
      });
    }
  }
  return cells;
}

export interface PagePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
}

/**
 * 원본 페이지를 셀 안에 비율 유지로 배치한다.
 * 페이지 회전은 시청 방향과 같게 되돌리기 위해 반대 각도로 그린다.
 */
export function placePage(
  sourceWidth: number,
  sourceHeight: number,
  rotation: PageRotation,
  cell: Rect,
): PagePlacement {
  const displayed =
    rotation === 90 || rotation === 270
      ? { width: sourceHeight, height: sourceWidth }
      : { width: sourceWidth, height: sourceHeight };
  const scale = Math.min(cell.width / displayed.width, cell.height / displayed.height);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const centerX = cell.x + cell.width / 2;
  const centerY = cell.y + cell.height / 2;
  const angle = rotation === 90 ? -90 : rotation === 270 ? 90 : rotation === 180 ? 180 : 0;

  if (angle === -90)
    return { x: centerX - height / 2, y: centerY + width / 2, width, height, rotate: angle };
  if (angle === 90)
    return { x: centerX + height / 2, y: centerY - width / 2, width, height, rotate: angle };
  if (angle === 180)
    return { x: centerX + width / 2, y: centerY + height / 2, width, height, rotate: angle };
  return { x: centerX - width / 2, y: centerY - height / 2, width, height, rotate: 0 };
}

/** 원본 쪽수를 시트 단위로 묶는다. */
export function paginatePages(pageCount: number, perSheet: PerSheet): number[][] {
  const groups: number[][] = [];
  for (let start = 0; start < pageCount; start += perSheet) {
    groups.push(
      Array.from({ length: Math.min(perSheet, pageCount - start) }, (_, index) => start + index),
    );
  }
  return groups;
}

export function sheetCount(pageCount: number, perSheet: PerSheet): number {
  return Math.max(0, Math.ceil(pageCount / perSheet));
}

/** 페이지 크기 변경 시 원본을 새 용지 안에 비율 유지로 배치한다. */
export function fitPageOnSheet(
  sourceWidth: number,
  sourceHeight: number,
  rotation: PageRotation,
  sheetWidth: number,
  sheetHeight: number,
  margin: number,
): PagePlacement {
  const cell: Rect = {
    x: margin,
    y: margin,
    width: Math.max(1, sheetWidth - margin * 2),
    height: Math.max(1, sheetHeight - margin * 2),
  };
  return placePage(sourceWidth, sourceHeight, rotation, cell);
}
