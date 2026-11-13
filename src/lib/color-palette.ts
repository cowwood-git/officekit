/** 이미지 대표 색 추출(미디언 컷)과 색 표기 변환. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Swatch extends Rgb {
  /** 이미지에서 차지하는 비율(0~1) */
  share: number;
}

const hex2 = (value: number) => Math.round(value).toString(16).padStart(2, '0');

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`.toUpperCase();
}

export function hexToRgb(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value =
    (match[1] as string).length === 3
      ? (match[1] as string).replace(/./g, (c) => c + c)
      : (match[1] as string);
  const number = Number.parseInt(value, 16);
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
}

export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: Math.round(h * 60) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function formatRgb({ r, g, b }: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatHsl(color: Rgb): string {
  const { h, s, l } = rgbToHsl(color);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/** 이 색 위에 올릴 글자색(검정·흰색 중 대비가 큰 쪽). */
export function inkFor({ r, g, b }: Rgb): '#000000' | '#FFFFFF' {
  const lum = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const y = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  return y > 0.179 ? '#000000' : '#FFFFFF';
}

type Box = number[][];

function channelRange(box: Box, channel: number): number {
  let min = 255;
  let max = 0;
  for (const pixel of box) {
    const value = pixel[channel] as number;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return max - min;
}

function widestChannel(box: Box): number {
  const ranges = [0, 1, 2].map((channel) => channelRange(box, channel));
  return ranges.indexOf(Math.max(...ranges));
}

/**
 * RGBA 픽셀에서 대표 색 count 개를 뽑는다. 투명한 픽셀은 건너뛴다.
 * 큰 이미지는 maxSamples 개 안팎만 골고루 뽑아 쓴다.
 */
export function extractPalette(data: ArrayLike<number>, count = 6, maxSamples = 40000): Swatch[] {
  const total = Math.floor(data.length / 4);
  const step = Math.max(1, Math.floor(total / maxSamples));
  const pixels: Box = [];
  for (let index = 0; index < total; index += step) {
    const at = index * 4;
    if ((data[at + 3] ?? 255) < 128) continue;
    pixels.push([data[at] as number, data[at + 1] as number, data[at + 2] as number]);
  }
  if (pixels.length === 0) return [];

  let boxes: Box[] = [pixels];
  while (boxes.length < count) {
    // 가장 넓게 퍼진(픽셀 수 × 범위) 상자를 둘로 가른다.
    let target = -1;
    let best = 0;
    boxes.forEach((box, index) => {
      if (box.length < 2) return;
      const score = channelRange(box, widestChannel(box)) * box.length;
      if (score > best) {
        best = score;
        target = index;
      }
    });
    if (target < 0) break;
    const box = boxes[target] as Box;
    const channel = widestChannel(box);
    box.sort((a, b) => (a[channel] as number) - (b[channel] as number));
    // 평균값에서 가른다(중앙값으로 가르면 많이 쓰인 색이 섞인다). 한쪽이 비면 중앙값.
    const mean = box.reduce((sum, pixel) => sum + (pixel[channel] as number), 0) / box.length;
    let middle = box.findIndex((pixel) => (pixel[channel] as number) > mean);
    if (middle <= 0) middle = Math.floor(box.length / 2);
    boxes = [
      ...boxes.slice(0, target),
      box.slice(0, middle),
      box.slice(middle),
      ...boxes.slice(target + 1),
    ];
  }

  const swatches = boxes.map((box) => {
    const sum = [0, 0, 0];
    for (const pixel of box) {
      sum[0] = (sum[0] as number) + (pixel[0] as number);
      sum[1] = (sum[1] as number) + (pixel[1] as number);
      sum[2] = (sum[2] as number) + (pixel[2] as number);
    }
    return {
      r: Math.round((sum[0] as number) / box.length),
      g: Math.round((sum[1] as number) / box.length),
      b: Math.round((sum[2] as number) / box.length),
      share: box.length / pixels.length,
    };
  });
  return swatches.sort((a, b) => b.share - a.share);
}

export function paletteCss(swatches: readonly Rgb[]): string {
  const lines = swatches.map((color, index) => `  --color-${index + 1}: ${rgbToHex(color)};`);
  return `:root {\n${lines.join('\n')}\n}`;
}
