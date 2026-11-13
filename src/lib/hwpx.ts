export const HWPX_PARA_NS = 'http://www.hancom.co.kr/hwpml/2011/paragraph';
export const HWPX_CORE_NS = 'http://www.hancom.co.kr/hwpml/2011/core';

export function isHwpxFile(fileName: string): boolean {
  return /\.hwpx$/i.test(fileName);
}

export function isHwpFile(fileName: string): boolean {
  return /\.hwp$/i.test(fileName);
}

export function isHangulFile(fileName: string): boolean {
  return isHwpFile(fileName) || isHwpxFile(fileName);
}

/** Contents/section0.xml, section1.xml … 을 숫자 순서로 돌려준다. */
export function sectionFiles(files: string[]): string[] {
  return files
    .filter((path) => /^Contents\/section\d+\.xml$/i.test(path))
    .sort((a, b) => sectionNumber(a) - sectionNumber(b));
}

export function sectionNumber(path: string): number {
  const match = /section(\d+)\.xml$/i.exec(path);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

/** BinData/image1.png 처럼 binaryItemIDRef 와 같은 이름의 파일을 찾는다. */
export function findBinaryPath(files: string[], id: string): string | undefined {
  const clean = id.trim();
  if (clean === '') return undefined;
  return files.find((path) => {
    const name = path.split('/').pop() ?? '';
    return name === clean || name.startsWith(`${clean}.`);
  });
}

export interface GridCell<T> {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  value: T;
}

/** HWPX 표의 cellAddr·cellSpan 을 CSS colspan/rowspan 이 쓸 수 있는 행렬로 배치한다. */
export function placeGridCells<T>(cells: GridCell<T>[]): (GridCell<T> | null)[][] {
  let rowCount = 0;
  let colCount = 0;
  for (const cell of cells) {
    const row = Math.max(0, Math.floor(cell.row));
    const col = Math.max(0, Math.floor(cell.col));
    const rowSpan = Math.max(1, Math.floor(cell.rowSpan));
    const colSpan = Math.max(1, Math.floor(cell.colSpan));
    rowCount = Math.max(rowCount, row + rowSpan);
    colCount = Math.max(colCount, col + colSpan);
  }

  const matrix: (GridCell<T> | null)[][] = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => null),
  );

  for (const cell of cells) {
    const row = Math.max(0, Math.floor(cell.row));
    const col = Math.max(0, Math.floor(cell.col));
    if (!matrix[row]?.[col]) {
      const placed: GridCell<T> = {
        ...cell,
        row,
        col,
        rowSpan: Math.max(1, Math.floor(cell.rowSpan)),
        colSpan: Math.max(1, Math.floor(cell.colSpan)),
      };
      const targetRow = matrix[row];
      if (targetRow) targetRow[col] = placed;
    }
  }

  return matrix;
}

/** HWPX HWPUNIT 페이지 크기를 CSS aspect-ratio 로 바꾼다. */
export function pageAspectRatio(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 210 / 297;
  }
  return width / height;
}

/** HWPX 안의 글자를 화면에 보여 줄 형태로 다듬는다. */
export function cleanHwpxText(text: string): string {
  return text.replace(/\u00a0/g, ' ').replace(/\r\n?/g, '\n');
}

export function hwpxSectionLabel(index: number): string {
  return `구역 ${index + 1}`;
}

export function hwpxPageLabel(page: number): string {
  return `${page}쪽`;
}

/** 파일 이름에서 미리보기 제목을 만든다. */
export function hwpxTitle(fileName: string): string {
  return fileName.replace(/\.hwpx$/i, '').trim() || '한글 문서';
}
