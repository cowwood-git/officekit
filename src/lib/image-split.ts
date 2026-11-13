export interface TileRect {
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 이미지를 rows×cols 격자로 나눈다. 픽셀 경계는 반올림해 빈틈을 없앤다. */
export function splitRects(width: number, height: number, rows: number, cols: number): TileRect[] {
  const safeRows = Math.max(1, Math.min(10, Math.trunc(rows)));
  const safeCols = Math.max(1, Math.min(10, Math.trunc(cols)));
  const safeWidth = Math.max(1, Math.trunc(width));
  const safeHeight = Math.max(1, Math.trunc(height));
  const tiles: TileRect[] = [];

  for (let row = 0; row < safeRows; row += 1) {
    const y0 = Math.round((row * safeHeight) / safeRows);
    const y1 = Math.round(((row + 1) * safeHeight) / safeRows);
    for (let col = 0; col < safeCols; col += 1) {
      const x0 = Math.round((col * safeWidth) / safeCols);
      const x1 = Math.round(((col + 1) * safeWidth) / safeCols);
      tiles.push({
        row,
        col,
        x: x0,
        y: y0,
        width: Math.max(1, x1 - x0),
        height: Math.max(1, y1 - y0),
      });
    }
  }
  return tiles;
}

export function splitFileName(index: number, rows: number, cols: number): string {
  const total = rows * cols;
  const pad = Math.max(2, String(total).length);
  return `part-${String(index + 1).padStart(pad, '0')}.png`;
}
