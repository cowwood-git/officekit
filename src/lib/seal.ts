/** 도장·서명 만들기 — 화면과 PNG 결과가 같은 규칙을 쓰도록 분리한다. */

export type SealMode = 'seal' | 'sign';
export type SealShape = 'circle' | 'square';

export const SEAL_MAX_LINES = 3;
export const SEAL_MAX_LINE_LENGTH = 16;

/** 입력한 글자를 최대 3줄로 정리한다. 빈 줄은 버리고, 줄마다 앞뒤 공백을 지운다. */
export function sealTextLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .slice(0, SEAL_MAX_LINES)
    .map((line) => Array.from(line).slice(0, SEAL_MAX_LINE_LENGTH).join(''));
}

/** 미리보기와 결과가 같은 기울기를 쓰도록 -20~20도로 제한한다. */
export function clampRotation(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(20, Math.max(-20, Math.round(value)));
}

/** 내려받을 파일 이름. 예: 도장-20261113.png */
export function sealFileName(mode: SealMode, date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${mode === 'seal' ? '도장' : '서명'}-${year}${month}${day}.png`;
}

export interface SealFontFitOptions {
  lines: readonly string[];
  maxWidth: number;
  maxHeight: number;
  maxSize: number;
  minSize?: number;
  measure: (text: string, fontSize: number) => number;
}

/**
 * 도장 안에 들어가는 가장 큰 글자 크기를 찾는다.
 * Canvas 의 measureText 를 콜백으로 받아 단위 테스트에서도 같은 계산을 검증한다.
 */
export function fitSealFontSize({
  lines,
  maxWidth,
  maxHeight,
  maxSize,
  minSize = 12,
  measure,
}: SealFontFitOptions): number {
  if (lines.length === 0) return Math.max(1, Math.floor(maxSize));

  const floor = Math.max(1, Math.floor(minSize));
  const ceiling = Math.max(floor, Math.floor(maxSize));
  let low = floor;
  let high = ceiling;
  let best = floor;

  while (low <= high) {
    const size = Math.floor((low + high) / 2);
    const widest = Math.max(...lines.map((line) => measure(line, size)));
    const height = size * 1.16 * lines.length;
    if (widest <= maxWidth && height <= maxHeight) {
      best = size;
      low = size + 1;
    } else {
      high = size - 1;
    }
  }

  return best;
}
