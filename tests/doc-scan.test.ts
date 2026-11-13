import { describe, expect, it } from 'vitest';
import {
  applyScanFilter,
  defaultQuad,
  fitWithin,
  homography,
  isConvexQuad,
  orderQuad,
  outputSize,
  pdfPlacement,
  project,
  type Quad,
  scanFileName,
  warpQuad,
} from '../src/lib/doc-scan';

const square: Quad = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];
const tilted: Quad = [
  { x: 20, y: 10 },
  { x: 180, y: 30 },
  { x: 170, y: 250 },
  { x: 5, y: 220 },
];

describe('homography', () => {
  it('네 모서리를 정확히 옮긴다', () => {
    const h = homography(square, tilted);
    square.forEach((point, index) => {
      const mapped = project(h, point.x, point.y);
      expect(mapped.x).toBeCloseTo((tilted[index] as { x: number }).x, 6);
      expect(mapped.y).toBeCloseTo((tilted[index] as { y: number }).y, 6);
    });
  });

  it('한 줄에 있는 점은 거부한다', () => {
    const line: Quad = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ];
    expect(() => homography(square, line)).toThrow();
  });
});

describe('orderQuad', () => {
  it('뒤섞인 점을 왼쪽 위부터 시계 방향으로 놓는다', () => {
    const shuffled = [tilted[2], tilted[0], tilted[3], tilted[1]] as Quad;
    expect(orderQuad(shuffled)).toEqual(tilted);
  });
});

describe('isConvexQuad', () => {
  it('정상 사각형은 볼록, 꼬인 사각형은 아니다', () => {
    expect(isConvexQuad(tilted)).toBe(true);
    const twisted: Quad = [square[0], square[2], square[1], square[3]];
    expect(isConvexQuad(twisted)).toBe(false);
  });
});

describe('outputSize', () => {
  it('마주 보는 변 중 긴 쪽을 쓴다', () => {
    const quad: Quad = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 180, y: 300 },
      { x: 10, y: 290 },
    ];
    expect(outputSize(quad)).toEqual({ width: 200, height: 301 }); // 오른쪽 변 300.67
  });

  it('A4 비율로 맞춘다', () => {
    const size = outputSize(square, 'a4');
    expect(size.width).toBe(100);
    expect(size.height).toBe(71);
  });

  it('긴 변 상한을 지킨다', () => {
    const big: Quad = [
      { x: 0, y: 0 },
      { x: 4000, y: 0 },
      { x: 4000, y: 2000 },
      { x: 0, y: 2000 },
    ];
    expect(outputSize(big, 'fit', 1000)).toEqual({ width: 1000, height: 500 });
  });
});

describe('warpQuad', () => {
  it('원본 전체를 고르면 그대로 옮긴다', () => {
    const width = 4;
    const height = 3;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i += 1) {
      data[i * 4] = i * 10;
      data[i * 4 + 3] = 255;
    }
    const quad: Quad = [
      { x: 0, y: 0 },
      { x: width - 1, y: 0 },
      { x: width - 1, y: height - 1 },
      { x: 0, y: height - 1 },
    ];
    const out = warpQuad({ data, width, height }, quad, width, height);
    for (let i = 0; i < width * height; i += 1) expect(out[i * 4]).toBe(i * 10);
  });
});

describe('applyScanFilter', () => {
  const make = (value: number, size = 64) => {
    const data = new Uint8ClampedArray(size * size * 4);
    for (let i = 0; i < size * size; i += 1) {
      // 왼쪽은 그늘진 바탕, 오른쪽은 밝은 바탕
      const shade = i % size < size / 2 ? value : 230;
      data.set([shade, shade, shade, 255], i * 4);
    }
    return data;
  };

  it('그늘진 바탕도 하얗게 편다', () => {
    const data = make(150);
    applyScanFilter(data, 64, 64, 'document');
    expect(data[0]).toBeGreaterThan(240);
    expect(data[(64 * 32 + 60) * 4]).toBeGreaterThan(240);
  });

  it('흑백은 0 또는 255만 남는다', () => {
    const data = make(120);
    for (let i = 0; i < 64; i += 4) data.set([20, 20, 20, 255], (32 * 64 + i) * 4);
    applyScanFilter(data, 64, 64, 'bw');
    const values = new Set<number>();
    for (let i = 0; i < data.length; i += 4) values.add(data[i] as number);
    expect([...values].every((v) => v === 0 || v === 255)).toBe(true);
    expect(values.has(0)).toBe(true);
  });

  it('원본은 건드리지 않는다', () => {
    const data = make(100);
    const copy = data.slice();
    applyScanFilter(data, 64, 64, 'original');
    expect(data).toEqual(copy);
  });
});

describe('기타', () => {
  it('fitWithin 과 defaultQuad', () => {
    expect(fitWithin(6000, 3000, 3000)).toMatchObject({ width: 3000, height: 1500 });
    expect(defaultQuad(100, 200, 0.1)[2]).toEqual({ x: 90, y: 180 });
  });

  it('pdfPlacement: A4 가운데 맞춤, 가로 사진은 가로 쪽', () => {
    const portrait = pdfPlacement(1000, 2000, 'a4');
    expect(portrait.page[0]).toBeLessThan(portrait.page[1]);
    expect(portrait.y).toBeCloseTo(0, 5);
    const landscape = pdfPlacement(2000, 1000, 'a4');
    expect(landscape.page[0]).toBeGreaterThan(landscape.page[1]);
    expect(pdfPlacement(200, 400, 'fit', 200).page).toEqual([72, 144]);
  });

  it('scanFileName', () => {
    const date = new Date(2026, 10, 11);
    expect(scanFileName(date)).toBe('scan-20261111.pdf');
    expect(scanFileName(date, 'jpg', 3)).toBe('scan-20261111-03.jpg');
  });
});
