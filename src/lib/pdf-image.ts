import { type ParseResult, parsePageRanges } from './pdf-split';

export const DPI_OPTIONS = [72, 144, 216] as const;
export type Dpi = (typeof DPI_OPTIONS)[number];

/** PDF 포인트(72dpi)를 기준으로 렌더 배율을 구한다. */
export function dpiToScale(dpi: number): number {
  if (!Number.isFinite(dpi)) return 2;
  return Math.min(300, Math.max(36, dpi)) / 72;
}

/**
 * 페이지 범위를 해석한다. 입력이 비어 있으면 전체 페이지를 대상으로 한다.
 */
export function planPages(raw: string, pageCount: number): ParseResult {
  if (raw.trim() === '') {
    return {
      pages: Array.from({ length: Math.max(0, pageCount) }, (_, index) => index + 1),
      errors: [],
    };
  }
  return parsePageRanges(raw, pageCount);
}

/** ZIP 안에서 페이지 순서를 알아볼 수 있게 0을 채운다. */
export function pageFileName(pageNumber: number, pageCount: number): string {
  const pad = Math.max(2, String(pageCount).length);
  return `page-${String(pageNumber).padStart(pad, '0')}.jpg`;
}

/** 렌더 결과의 대략적인 메가픽셀. 메모리 경고에 사용한다. */
export function megapixels(size: { width: number; height: number }, scale: number): number {
  return (size.width * scale * size.height * scale) / 1_000_000;
}
