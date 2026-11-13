import { safeFileName } from './files';

export type OcrLanguage = 'kor+eng' | 'kor' | 'eng';

export const OCR_LANGUAGES: Array<{ value: OcrLanguage; label: string; note: string }> = [
  { value: 'kor+eng', label: '한국어 + 영어', note: '문서·영수증에 가장 무난' },
  { value: 'kor', label: '한국어', note: '한글 위주 자료' },
  { value: 'eng', label: '영어', note: '영문 자료·논문' },
];

/** OCR 결과 텍스트를 다듬는다. */
export function normalizeOcrText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function ocrFileName(originalName: string): string {
  const base = safeFileName(originalName.replace(/\.[^.]+$/, '')) || 'ocr';
  return `${base}.txt`;
}

/** 결과 다운로드용 텍스트. Windows 메모장 호환을 위해 BOM을 붙인다. */
export function textForDownload(text: string): string {
  return `\uFEFF${text}`;
}

export function ocrCharCount(text: string): number {
  return Array.from(text.replace(/\s/g, '')).length;
}

/**
 * OCR 전처리용 캔버스 크기를 정한다.
 * 너무 작으면 키우고, 너무 크면 줄여서 인식 속도와 정확도의 균형을 맞춘다.
 */
export function preprocessSize(
  size: { width: number; height: number },
  minLongSide = 1600,
  maxLongSide = 3000,
): { width: number; height: number; scale: number } {
  const longest = Math.max(size.width, size.height);
  if (longest <= 0) return { width: 1, height: 1, scale: 1 };

  let scale = 1;
  if (longest < minLongSide) scale = minLongSide / longest;
  else if (longest > maxLongSide) scale = maxLongSide / longest;

  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
    scale,
  };
}
