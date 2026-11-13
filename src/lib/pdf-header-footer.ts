export type HeaderFooterPosition = 'left' | 'center' | 'right';

export interface HeaderFooterFields {
  headerLeft: string;
  headerCenter: string;
  headerRight: string;
  footerLeft: string;
  footerCenter: string;
  footerRight: string;
}

export function applyTemplate(text: string, page: number, total: number): string {
  return text
    .replace(/\{page\}/gi, String(page))
    .replace(/\{total\}/gi, String(total))
    .replace(/\{page:2\}/gi, String(page).padStart(2, '0'))
    .replace(/\{page:3\}/gi, String(page).padStart(3, '0'));
}

export function hasPageToken(text: string): boolean {
  return /\{page(?::\d)?\}/i.test(text);
}

export function hasAnyPageToken(fields: HeaderFooterFields): boolean {
  return Object.values(fields).some((value) => hasPageToken(value));
}

export function clampHeaderFont(value: number): number {
  if (!Number.isFinite(value)) return 9;
  return Math.min(24, Math.max(6, Math.round(value)));
}

export function clampHeaderMargin(value: number): number {
  if (!Number.isFinite(value)) return 24;
  return Math.min(72, Math.max(8, Math.round(value)));
}

/** 텍스트 정렬에 따른 시작 x 좌표. */
export function anchorX(
  position: HeaderFooterPosition,
  pageWidth: number,
  textWidth: number,
  margin: number,
): number {
  if (position === 'center') return Math.max(margin, (pageWidth - textWidth) / 2);
  if (position === 'right') return Math.max(margin, pageWidth - margin - textWidth);
  return margin;
}

/** 캔버스 상단 기준 헤더 baseline. */
export function headerBaseline(margin: number, fontSize: number): number {
  return margin + fontSize;
}

/** 캔버스 하단 기준 푸터 baseline. */
export function footerBaseline(pageHeight: number, margin: number): number {
  return pageHeight - margin;
}

export function headerFooterFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'document'}-header-footer.pdf`;
}
