import { safeFileName } from './files';
import { displayedSize, normalizeRotation, type PageRotation } from './pdf-watermark';

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export type PageNumberFormat = 'number' | 'fraction' | 'page-of' | 'dash';

export const PAGE_NUMBER_FORMATS: Record<PageNumberFormat, string> = {
  number: '1',
  fraction: '1 / 5',
  'page-of': 'Page 1 of 5',
  dash: '- 1 -',
};

/** 선택한 형식으로 페이지 번호 문구를 만든다. */
export function pageNumberLabel(
  page: number,
  total: number,
  format: PageNumberFormat,
  start = 1,
): string {
  const safePage = Math.max(1, Math.trunc(page));
  const number = Math.max(0, Math.trunc(start)) + safePage - 1;
  switch (format) {
    case 'fraction':
      return `${number} / ${total}`;
    case 'page-of':
      return `Page ${number} of ${total}`;
    case 'dash':
      return `- ${number} -`;
    default:
      return String(number);
  }
}

export function clampStartNumber(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(9999, Math.max(0, Math.trunc(value)));
}

export function clampNumberSize(value: number): number {
  if (!Number.isFinite(value)) return 11;
  return Math.min(36, Math.max(6, Math.round(value)));
}

export function clampNumberMargin(value: number): number {
  if (!Number.isFinite(value)) return 32;
  return Math.min(120, Math.max(0, Math.round(value)));
}

/** 표시 좌표(왼쪽 아래 기준)에서 텍스트 시작점을 구한다. */
export function anchorFor(
  displayWidth: number,
  displayHeight: number,
  position: PageNumberPosition,
  margin: number,
  textWidth: number,
  fontSize: number,
): { x: number; y: number } {
  const centerX = Math.max(margin, (displayWidth - textWidth) / 2);
  const rightX = Math.max(margin, displayWidth - margin - textWidth);
  const topY = Math.max(margin, displayHeight - margin - fontSize);

  switch (position) {
    case 'bottom-center':
      return { x: centerX, y: margin };
    case 'bottom-right':
      return { x: rightX, y: margin };
    case 'bottom-left':
      return { x: margin, y: margin };
    case 'top-center':
      return { x: centerX, y: topY };
    case 'top-right':
      return { x: rightX, y: topY };
    default:
      return { x: margin, y: topY };
  }
}

export interface MappedAnchor {
  x: number;
  y: number;
  rotate: number;
}

/**
 * 화면 방향의 기준점을 페이지 좌표로 되돌린다.
 * 회전된 페이지에서도 번호가 바로 서도록 각도도 함께 준다.
 */
export function mapAnchorToPage(
  pageWidth: number,
  pageHeight: number,
  rotation: PageRotation,
  x: number,
  y: number,
): MappedAnchor {
  switch (rotation) {
    case 90:
      return { x: pageWidth - y, y: x, rotate: 90 };
    case 180:
      return { x: pageWidth - x, y: pageHeight - y, rotate: 180 };
    case 270:
      return { x: y, y: pageHeight - x, rotate: -90 };
    default:
      return { x, y, rotate: 0 };
  }
}

/** 페이지 번호 배치에 필요한 페이지별 계산 묶음. */
export function pageNumberPlan(
  width: number,
  height: number,
  rotationAngle: number,
  position: PageNumberPosition,
  margin: number,
  fontSize: number,
  textWidth: number,
): MappedAnchor {
  const rotation = normalizeRotation(rotationAngle);
  const display = displayedSize(width, height, rotation);
  const anchor = anchorFor(display.width, display.height, position, margin, textWidth, fontSize);
  return mapAnchorToPage(width, height, rotation, anchor.x, anchor.y);
}

const HEX = /^#?([0-9a-f]{6})$/i;

/** #rrggbb 색상을 pdf-lib용 0~1 RGB로 바꾼다. */
export function parseHexColor(value: string): { r: number; g: number; b: number } {
  const match = HEX.exec(value.trim());
  if (!match?.[1]) return { r: 0, g: 0, b: 0 };
  const hex = match[1];
  return {
    r: Number.parseInt(hex.slice(0, 2), 16) / 255,
    g: Number.parseInt(hex.slice(2, 4), 16) / 255,
    b: Number.parseInt(hex.slice(4, 6), 16) / 255,
  };
}

export function pageNumberFileName(original: string): string {
  const base = safeFileName(original.replace(/\.[^.]+$/, '')) || 'document';
  return `${base}-numbered.pdf`;
}
