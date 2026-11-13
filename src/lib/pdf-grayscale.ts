import { safeFileName } from './files';

/** PDF 흑백 변환 — 쪽을 그림으로 그린 뒤 회색조(또는 흑백 두 색)로 바꾼다. */
export type GrayMode = 'gray' | 'bw';

export const GRAY_QUALITY = {
  print: { label: '인쇄용 (200dpi)', dpi: 200, quality: 0.85 },
  normal: { label: '보통 (150dpi)', dpi: 150, quality: 0.78 },
  small: { label: '작게 (110dpi)', dpi: 110, quality: 0.65 },
} as const;

export type GrayQuality = keyof typeof GRAY_QUALITY;

export const GRAY_MAX_PAGES = 300;

/** RGBA 를 제자리에서 바꾼다. bw 는 threshold(0~255)보다 밝으면 흰색. */
export function toGrayscale(
  data: Uint8ClampedArray,
  mode: GrayMode = 'gray',
  threshold = 160,
): void {
  for (let index = 0; index < data.length; index += 4) {
    const luma =
      0.299 * (data[index] as number) +
      0.587 * (data[index + 1] as number) +
      0.114 * (data[index + 2] as number);
    const value = mode === 'bw' ? (luma >= threshold ? 255 : 0) : luma;
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }
}

export function grayFileName(original: string, mode: GrayMode): string {
  const base = safeFileName(original.replace(/\.[^.]+$/, '')) || 'document';
  return `${base}-${mode === 'bw' ? 'bw' : 'gray'}.pdf`;
}
