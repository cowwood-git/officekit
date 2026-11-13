import { safeFileName } from './files';

export function isDocx(fileName: string): boolean {
  return /\.docx$/i.test(fileName);
}

export function isDoc(fileName: string): boolean {
  return /\.doc$/i.test(fileName);
}

export function isWordFile(fileName: string): boolean {
  return isDocx(fileName) || isDoc(fileName);
}

/** 공백 기준 단어 수. 한국어는 띄어쓰기 단위로 센다. */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  return trimmed.split(/\s+/u).length;
}

export function charCount(text: string): number {
  return Array.from(text.replace(/\s/g, '')).length;
}

export function docxTextFileName(originalName: string): string {
  const base = safeFileName(originalName.replace(/\.docx?$/i, '')) || 'document';
  return `${base}.txt`;
}
