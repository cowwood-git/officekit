import type { Size } from './crop';

/** 워터마크 글자 크기(px). 이미지 짧은 변의 percent%. */
export function watermarkFontSize(bounds: Size, percent: number): number {
  const safe = Math.min(30, Math.max(2, percent));
  return Math.max(10, Math.round(Math.min(bounds.width, bounds.height) * (safe / 100)));
}

/** 타일 간격(px). 글자 폭과 크기에 비례한다. */
export function tileStep(textWidth: number, fontSize: number): { x: number; y: number } {
  return {
    x: Math.max(fontSize, textWidth + fontSize * 1.2),
    y: Math.max(fontSize, fontSize * 3),
  };
}

/** 우하단 기준점(오른쪽·아래 여백). */
export function cornerAnchor(bounds: Size, margin: number): { x: number; y: number } {
  return {
    x: Math.max(0, bounds.width - margin),
    y: Math.max(0, bounds.height - margin),
  };
}

/** 이미지 대각선 길이. 회전 타일이 모서리까지 덮도록 범위를 잡는 데 쓴다. */
export function diagonal(bounds: Size): number {
  return Math.sqrt(bounds.width ** 2 + bounds.height ** 2);
}

/** 6000px를 넘으면 축소 저장. */
export function outputScaleFor(bounds: Size, max = 6000): number {
  const longest = Math.max(bounds.width, bounds.height);
  return longest <= max ? 1 : max / longest;
}
