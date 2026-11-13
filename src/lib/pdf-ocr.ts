import { safeFileName } from './files';

export const MAX_OCR_PAGES = 20;

/** 여러 페이지의 OCR 결과를 하나의 텍스트로 합친다. */
export function combinePageTexts(pages: Array<{ page: number; text: string }>): string {
  const cleaned = pages
    .map((item) => ({ page: item.page, text: item.text.trim() }))
    .filter((item) => item.text.length > 0);

  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0]?.text ?? '';

  return cleaned.map((item) => `--- ${item.page}쪽 ---\n${item.text}`).join('\n\n');
}

export function averageConfidence(values: number[]): number {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

export function overallProgress(
  pageIndex: number,
  totalPages: number,
  pageProgress: number,
): number {
  const total = Math.max(1, totalPages);
  const completed = Math.max(0, Math.min(pageIndex, total - 1));
  const partial = Math.min(1, Math.max(0, pageProgress));
  return Math.min(1, (completed + partial) / total);
}

export function pdfOcrFileName(originalName: string): string {
  const base = safeFileName(originalName.replace(/\.pdf$/i, '')) || 'document';
  return `${base}-ocr.txt`;
}
