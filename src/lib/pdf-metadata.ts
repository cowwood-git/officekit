import { safeFileName } from './files';

export interface PdfMetadataInput {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

export interface PdfMetadata extends PdfMetadataInput {
  creator: string;
  producer: string;
  creationDate?: string;
  modificationDate?: string;
}

export interface CleanMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
}

export const METADATA_LIMITS = {
  title: 200,
  author: 100,
  subject: 300,
  keyword: 40,
  keywords: 30,
} as const;

function clean(value: string, max: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

/** 입력한 메타데이터를 정리한다. 쉼표·줄바꿈으로 구분한 키워드는 중복을 제거한다. */
export function cleanMetadata(input: PdfMetadataInput): CleanMetadata {
  const keywords: string[] = [];
  const seen = new Set<string>();
  for (const raw of input.keywords.split(/[,;\n]+/)) {
    const keyword = clean(raw, METADATA_LIMITS.keyword);
    const key = keyword.toLowerCase();
    if (!keyword || seen.has(key)) continue;
    seen.add(key);
    keywords.push(keyword);
    if (keywords.length >= METADATA_LIMITS.keywords) break;
  }
  return {
    title: clean(input.title, METADATA_LIMITS.title),
    author: clean(input.author, METADATA_LIMITS.author),
    subject: clean(input.subject, METADATA_LIMITS.subject),
    keywords,
  };
}

export function hasMetadata(metadata: PdfMetadataInput | CleanMetadata): boolean {
  const cleaned =
    typeof metadata.keywords === 'string' ? cleanMetadata(metadata as PdfMetadataInput) : metadata;
  return Boolean(cleaned.title || cleaned.author || cleaned.subject || cleaned.keywords.length);
}

/** 결과 파일명. */
export function metadataFileName(original: string): string {
  const base = safeFileName(original.replace(/\.[^.]+$/, '')) || 'document';
  return `${base}-metadata.pdf`;
}

/** 화면에 보여줄 요약 문구. */
export function metadataSummary(metadata: CleanMetadata): string {
  const filled = [
    metadata.title && '제목',
    metadata.author && '작성자',
    metadata.subject && '주제',
    metadata.keywords.length > 0 && `키워드 ${metadata.keywords.length}개`,
  ].filter(Boolean);
  return filled.length > 0 ? `${filled.join(' · ')} 저장` : '모든 메타데이터 비움';
}

/** PDF 날짜 문자열을 한국어 표시용으로 바꾼다. */
export function formatPdfDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
