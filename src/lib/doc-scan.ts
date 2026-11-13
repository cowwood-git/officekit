/**
 * 문서 스캔: 사진 속 문서의 네 모서리를 받아 반듯한 직사각형으로 펴고(원근 보정),
 * 종이처럼 보이게 다듬는다. 모든 계산은 브라우저 안에서 픽셀 배열로 한다.
 */
export interface Point {
  x: number;
  y: number;
}

/** 왼쪽 위 → 오른쪽 위 → 오른쪽 아래 → 왼쪽 아래 */
export type Quad = [Point, Point, Point, Point];

export type ScanFilter = 'original' | 'document' | 'gray' | 'bw';
export type PaperMode = 'a4' | 'fit';

export interface Pixels {
  data: ArrayLike<number>;
  width: number;
  height: number;
}

/** 처리할 사진의 긴 변 상한. 오래된 휴대폰에서도 메모리가 넘치지 않는 크기. */
export const MAX_SOURCE_SIDE = 3000;
/** 펴낸 결과의 긴 변 상한(A4 약 210dpi) */
export const MAX_OUTPUT_SIDE = 2480;

export function fitWithin(width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  };
}

/** 처음 보여 줄 모서리: 가장자리에서 inset 비율만큼 안쪽. */
export function defaultQuad(width: number, height: number, inset = 0.06): Quad {
  const dx = width * inset;
  const dy = height * inset;
  return [
    { x: dx, y: dy },
    { x: width - dx, y: dy },
    { x: width - dx, y: height - dy },
    { x: dx, y: height - dy },
  ];
}

/** 아무 순서로 찍은 네 점을 왼쪽 위부터 시계 방향으로 정렬한다. */
export function orderQuad(points: readonly Point[]): Quad {
  if (points.length !== 4) throw new Error('점 4개가 필요합니다.');
  const cx = points.reduce((sum, p) => sum + p.x, 0) / 4;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / 4;
  const sorted = [...points].sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
  );
  // atan2 정렬은 화면 좌표에서 시계 방향. 왼쪽 위(x+y 최소)에서 시작하도록 돌린다.
  let start = 0;
  sorted.forEach((p, index) => {
    const q = sorted[start] as Point;
    if (p.x + p.y < q.x + q.y) start = index;
  });
  return [0, 1, 2, 3].map((k) => sorted[(start + k) % 4] as Point) as Quad;
}

function cross(o: Point, a: Point, b: Point) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/** 네 점이 볼록한 사각형인지(꼬이거나 오목하면 펴기 결과가 깨진다). */
export function isConvexQuad(quad: Quad): boolean {
  const signs = quad.map((p, index) =>
    Math.sign(cross(p, quad[(index + 1) % 4] as Point, quad[(index + 2) % 4] as Point)),
  );
  return signs.every((sign) => sign !== 0 && sign === signs[0]);
}

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * 펴낸 결과 크기. 마주 보는 두 변 중 긴 쪽을 쓴다.
 * paper 가 a4 이면 가로·세로 비율을 A4(1:√2)로 맞춘다(방향은 사진을 따른다).
 */
export function outputSize(
  quad: Quad,
  paper: PaperMode = 'fit',
  maxSide = MAX_OUTPUT_SIDE,
): { width: number; height: number } {
  const [tl, tr, br, bl] = quad;
  let width = Math.max(dist(tl, tr), dist(bl, br));
  let height = Math.max(dist(tl, bl), dist(tr, br));
  if (paper === 'a4') {
    const long = Math.max(width, height);
    const short = long / Math.SQRT2;
    if (width >= height) height = short;
    else width = short;
  }
  const fitted = fitWithin(width, height, maxSide);
  return { width: fitted.width, height: fitted.height };
}

/** 8×8 연립방정식(가우스 소거). */
function solve(matrix: number[][], vector: number[]): number[] {
  const n = vector.length;
  const a = matrix.map((row, index) => [...row, vector[index] as number]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (
        Math.abs((a[row] as number[])[col] as number) >
        Math.abs((a[pivot] as number[])[col] as number)
      )
        pivot = row;
    }
    [a[col], a[pivot]] = [a[pivot] as number[], a[col] as number[]];
    const top = a[col] as number[];
    const lead = top[col] as number;
    if (Math.abs(lead) < 1e-12) throw new Error('네 점이 한 줄에 있어 펼 수 없습니다.');
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const current = a[row] as number[];
      const factor = (current[col] as number) / lead;
      if (factor === 0) continue;
      for (let k = col; k <= n; k += 1)
        current[k] = (current[k] as number) - factor * (top[k] as number);
    }
  }
  return a.map((row, index) => (row[n] as number) / ((row[index] as number) || 1));
}

/** from 의 네 점을 to 의 네 점으로 옮기는 3×3 사영 변환(마지막 값 1). */
export function homography(from: Quad, to: Quad): number[] {
  const matrix: number[][] = [];
  const vector: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    const { x, y } = from[index] as Point;
    const { x: u, y: v } = to[index] as Point;
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    vector.push(u);
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    vector.push(v);
  }
  return [...solve(matrix, vector), 1];
}

export function project(h: readonly number[], x: number, y: number): Point {
  const w = (h[6] as number) * x + (h[7] as number) * y + (h[8] as number);
  return {
    x: ((h[0] as number) * x + (h[1] as number) * y + (h[2] as number)) / w,
    y: ((h[3] as number) * x + (h[4] as number) * y + (h[5] as number)) / w,
  };
}

/** 사진의 quad 영역을 width×height 직사각형으로 편다(양선형 보간). */
export function warpQuad(
  source: Pixels,
  quad: Quad,
  width: number,
  height: number,
): Uint8ClampedArray<ArrayBuffer> {
  const rect: Quad = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: width - 1, y: height - 1 },
    { x: 0, y: height - 1 },
  ];
  // 결과 픽셀마다 원본 위치를 찾아야 하므로 결과 → 원본 방향 변환을 쓴다.
  const h = homography(rect, quad);
  const out = new Uint8ClampedArray(width * height * 4);
  const { data, width: sw, height: sh } = source;
  const maxX = sw - 1;
  const maxY = sh - 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const w = (h[6] as number) * x + (h[7] as number) * y + (h[8] as number);
      let sx = ((h[0] as number) * x + (h[1] as number) * y + (h[2] as number)) / w;
      let sy = ((h[3] as number) * x + (h[4] as number) * y + (h[5] as number)) / w;
      sx = Math.min(Math.max(sx, 0), maxX);
      sy = Math.min(Math.max(sy, 0), maxY);
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = x0 < maxX ? x0 + 1 : x0;
      const y1 = y0 < maxY ? y0 + 1 : y0;
      const fx = sx - x0;
      const fy = sy - y0;
      const a = (y0 * sw + x0) * 4;
      const b = (y0 * sw + x1) * 4;
      const c = (y1 * sw + x0) * 4;
      const d = (y1 * sw + x1) * 4;
      const o = (y * width + x) * 4;
      for (let k = 0; k < 3; k += 1) {
        const top = (data[a + k] as number) * (1 - fx) + (data[b + k] as number) * fx;
        const bottom = (data[c + k] as number) * (1 - fx) + (data[d + k] as number) * fx;
        out[o + k] = top * (1 - fy) + bottom * fy;
      }
      out[o + 3] = 255;
    }
  }
  return out;
}

/**
 * 종이 바탕 밝기 지도. 이미지를 칸으로 나눠 칸마다 밝은 쪽 값을 잡고 부드럽게 이어
 * 그림자·조명 차이를 추정한다. 반환은 픽셀마다 바탕 밝기(1~255).
 */
function paperLevels(luma: Float32Array, width: number, height: number): Float32Array {
  const cell = Math.max(8, Math.round(Math.min(width, height) / 24));
  const gw = Math.ceil(width / cell);
  const gh = Math.ceil(height / cell);
  const grid = new Float32Array(gw * gh);
  const values: number[] = [];
  for (let gy = 0; gy < gh; gy += 1) {
    for (let gx = 0; gx < gw; gx += 1) {
      values.length = 0;
      const step = Math.max(1, Math.floor(cell / 8));
      for (let y = gy * cell; y < Math.min(height, (gy + 1) * cell); y += step) {
        for (let x = gx * cell; x < Math.min(width, (gx + 1) * cell); x += step) {
          values.push(luma[y * width + x] as number);
        }
      }
      values.sort((a, b) => a - b);
      // 상위 10% 값: 글자는 어둡고 종이는 밝으므로 밝은 쪽이 바탕이다.
      grid[gy * gw + gx] = (values[Math.floor(values.length * 0.9)] as number) ?? 255;
    }
  }
  // 이웃 칸과 평균(글자가 꽉 찬 칸의 바탕이 어둡게 잡히는 것을 누그러뜨린다).
  const smooth = new Float32Array(gw * gh);
  for (let gy = 0; gy < gh; gy += 1) {
    for (let gx = 0; gx < gw; gx += 1) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
          sum += grid[ny * gw + nx] as number;
          count += 1;
        }
      }
      smooth[gy * gw + gx] = Math.max(sum / count, grid[gy * gw + gx] as number);
    }
  }
  const levels = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const gyf = Math.min(gh - 1, Math.max(0, (y + 0.5) / cell - 0.5));
    const gy0 = Math.floor(gyf);
    const gy1 = Math.min(gh - 1, gy0 + 1);
    const ty = gyf - gy0;
    for (let x = 0; x < width; x += 1) {
      const gxf = Math.min(gw - 1, Math.max(0, (x + 0.5) / cell - 0.5));
      const gx0 = Math.floor(gxf);
      const gx1 = Math.min(gw - 1, gx0 + 1);
      const tx = gxf - gx0;
      const top =
        (smooth[gy0 * gw + gx0] as number) * (1 - tx) + (smooth[gy0 * gw + gx1] as number) * tx;
      const bottom =
        (smooth[gy1 * gw + gx0] as number) * (1 - tx) + (smooth[gy1 * gw + gx1] as number) * tx;
      levels[y * width + x] = Math.max(1, top * (1 - ty) + bottom * ty);
    }
  }
  return levels;
}

/** 바탕을 하얗게 편 값에 대비를 조금 준다(옅은 회색 글씨를 진하게). */
const stretch = (value: number) => {
  const v = (value - 40) * (255 / 205);
  return Math.min(Math.max(v, 0), 255);
};

/** RGBA 배열을 제자리에서 다듬는다. */
export function applyScanFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  filter: ScanFilter,
): void {
  if (filter === 'original') return;
  const total = width * height;
  const luma = new Float32Array(total);
  for (let i = 0; i < total; i += 1) {
    const at = i * 4;
    luma[i] =
      0.299 * (data[at] as number) +
      0.587 * (data[at + 1] as number) +
      0.114 * (data[at + 2] as number);
  }
  const levels = paperLevels(luma, width, height);
  for (let i = 0; i < total; i += 1) {
    const at = i * 4;
    const gain = 255 / (levels[i] as number);
    if (filter === 'document') {
      data[at] = stretch((data[at] as number) * gain);
      data[at + 1] = stretch((data[at + 1] as number) * gain);
      data[at + 2] = stretch((data[at + 2] as number) * gain);
    } else {
      const gray = stretch((luma[i] as number) * gain);
      const value = filter === 'bw' ? (gray < 150 ? 0 : 255) : gray;
      data[at] = value;
      data[at + 1] = value;
      data[at + 2] = value;
    }
    data[at + 3] = 255;
  }
}

export const A4_POINTS = { width: 595.28, height: 841.89 };

/**
 * PDF 쪽 크기와 그림 위치(포인트). a4: A4에 비율을 지켜 가운데 맞춤(방향은 그림을 따른다).
 * fit: 그림 크기 그대로(dpi 기준).
 */
export function pdfPlacement(
  width: number,
  height: number,
  paper: PaperMode,
  dpi = 200,
): { page: [number, number]; x: number; y: number; width: number; height: number } {
  if (paper === 'fit') {
    const w = (width / dpi) * 72;
    const h = (height / dpi) * 72;
    return { page: [w, h], x: 0, y: 0, width: w, height: h };
  }
  const landscape = width > height;
  const pageW = landscape ? A4_POINTS.height : A4_POINTS.width;
  const pageH = landscape ? A4_POINTS.width : A4_POINTS.height;
  const scale = Math.min(pageW / width, pageH / height);
  const w = width * scale;
  const h = height * scale;
  return { page: [pageW, pageH], x: (pageW - w) / 2, y: (pageH - h) / 2, width: w, height: h };
}

export function scanFileName(date = new Date(), ext = 'pdf', index?: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = index === undefined ? '' : `-${String(index).padStart(2, '0')}`;
  return `scan-${y}${m}${d}${suffix}.${ext}`;
}
