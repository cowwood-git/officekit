/**
 * 도구 사이 파일 흐름 — 순수 로직(DOM 없음, tests/file-flow.test.ts).
 *
 * - 붙여넣기·이어서 하기로 들어온 파일이 그 도구의 accept 와 맞는지 본다.
 * - 맞지 않는 파일을 놓으면 열 수 있는 도구를 하나 고른다.
 * - 결과 파일 형식에 맞춰 "이어서 하기" 도구를 고른다.
 *
 * 이어서 하기는 같은 화면 패널이 아니라 다음 도구 페이지로 이동한다(페이지뷰·광고 자리 유지).
 */

export interface FileLike {
  name: string;
  type: string;
}

/** 파일 이름의 확장자(소문자, 점 없음). 없으면 ''. */
export function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

// 브라우저가 type 을 비워 두는 경우(HEIC·HWP 등)에 확장자로 대신 판단한다.
const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  heic: 'image/heic',
  heif: 'image/heif',
  csv: 'text/csv',
  txt: 'text/plain',
  zip: 'application/zip',
};

/** input 의 accept 값과 파일이 맞는지. accept 가 비어 있으면 모두 받는다. */
export function matchesAccept(file: FileLike, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const ext = extOf(file.name);
  const type = (file.type || EXT_MIME[ext] || '').toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return ext !== '' && token === `.${ext}`;
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

const FORMAT_LABEL: Record<string, string> = {
  pdf: 'PDF',
  hwp: '한글 문서',
  hwpx: '한글 문서',
  doc: '워드 문서',
  docx: '워드 문서',
  ppt: '파워포인트 문서',
  pptx: '파워포인트 문서',
  xls: '엑셀 파일',
  xlsx: '엑셀 파일',
  csv: 'CSV 파일',
  jpg: '이미지',
  jpeg: '이미지',
  png: '이미지',
  webp: '이미지',
  gif: '이미지',
  heic: 'HEIC 사진',
  heif: 'HEIC 사진',
  zip: 'ZIP 압축 파일',
  vcf: '연락처 파일',
  ics: '일정 파일',
};

/** 사람이 읽는 형식 이름. 모르는 형식은 "XYZ 파일". */
export function formatLabel(name: string): string {
  const ext = extOf(name);
  if (!ext) return '알 수 없는 형식';
  return FORMAT_LABEL[ext] ?? `${ext.toUpperCase()} 파일`;
}

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']);

/**
 * 이 도구에서 열 수 없는 파일을 열 수 있는 도구.
 * 지금 도구가 PDF 를 받으면 "PDF로 바꾸기"를, 아니면 "보기" 도구를 고른다.
 */
export function suggestToolFor(file: FileLike, accept: string, currentSlug: string): string | null {
  const ext = extOf(file.name);
  const takesPdf = matchesAccept({ name: 'a.pdf', type: 'application/pdf' }, accept);
  const takesImage = matchesAccept({ name: 'a.jpg', type: 'image/jpeg' }, accept);
  const takesCsv = matchesAccept({ name: 'a.csv', type: 'text/csv' }, accept);
  let slug: string | null = null;
  if (ext === 'hwp' || ext === 'hwpx') slug = takesPdf ? 'hwpx-to-pdf' : 'hwpx-viewer';
  else if (ext === 'doc' || ext === 'docx') slug = takesPdf ? 'docx-to-pdf' : 'docx-viewer';
  else if (ext === 'ppt' || ext === 'pptx') slug = takesPdf ? 'pptx-to-pdf' : 'pptx-viewer';
  else if (ext === 'xls' || ext === 'xlsx') slug = takesCsv ? 'csv-xlsx' : 'sheet-viewer';
  else if (ext === 'heic' || ext === 'heif') slug = 'heic-to-jpg';
  else if (ext === 'pdf') slug = takesImage ? 'pdf-to-jpg' : 'pdf-viewer';
  else if (IMAGE_EXTS.has(ext)) slug = takesPdf ? 'jpg-to-pdf' : null;
  else if (ext === 'csv') slug = 'sheet-viewer';
  else if (ext === 'zip') slug = 'zip';
  else if (ext === 'vcf' || ext === 'ics') slug = 'vcf-ics-viewer';
  return slug && slug !== currentSlug ? slug : null;
}

/** 결과 형식별 "이어서 하기" 후보. 앞에서부터 3개를 쓴다. */
export const NEXT_BY_EXT: Record<string, string[]> = {
  pdf: ['pdf-compress', 'pdf-page-number', 'pdf-sign', 'pdf-protect', 'pdf-watermark', 'pdf-merge'],
  jpg: ['image-compress', 'image-crop', 'image-mosaic', 'jpg-to-pdf'],
  jpeg: ['image-compress', 'image-crop', 'image-mosaic', 'jpg-to-pdf'],
  png: ['image-compress', 'image-crop', 'image-mosaic', 'jpg-to-pdf'],
  webp: ['image-compress', 'image-crop', 'image-mosaic', 'jpg-to-pdf'],
  csv: ['csv-clean', 'csv-chart', 'csv-xlsx'],
  xlsx: ['csv-xlsx', 'csv-chart', 'sheet-viewer'],
  zip: ['zip'],
};

// 결과를 다른 도구가 열 수 없는 경우(암호 건 PDF 등)는 이어서 하기를 보여 주지 않는다.
const NO_NEXT = new Set(['pdf-protect']);

export const NEXT_LIMIT = 3;

export function nextToolsFor(currentSlug: string, resultName: string): string[] {
  if (NO_NEXT.has(currentSlug)) return [];
  const list = NEXT_BY_EXT[extOf(resultName)] ?? [];
  return list.filter((slug) => slug !== currentSlug).slice(0, NEXT_LIMIT);
}

/** 화면에 제목·주소가 필요한 모든 도구(ToolLayout 이 JSON 으로 심는다). */
export const FLOW_SLUGS: string[] = [
  ...new Set([
    ...Object.values(NEXT_BY_EXT).flat(),
    'hwpx-to-pdf',
    'hwpx-viewer',
    'docx-to-pdf',
    'docx-viewer',
    'pptx-to-pdf',
    'pptx-viewer',
    'csv-xlsx',
    'sheet-viewer',
    'heic-to-jpg',
    'pdf-to-jpg',
    'pdf-viewer',
    'jpg-to-pdf',
    'zip',
    'vcf-ics-viewer',
  ]),
];

/** 붙여넣은 클립보드 이미지는 이름이 image.png 라서 알아보기 쉬운 이름으로 바꾼다. */
export function pastedName(original: string, type: string, now: Date): string {
  if (original && original !== 'image.png' && original !== 'image.jpeg') return original;
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const ext = type === 'image/jpeg' ? 'jpg' : (type.split('/')[1] ?? 'png');
  return `캡처-${stamp}.${ext}`;
}

/** 이어서 하기로 넘긴 파일을 받아 줄 수 있는 시간(그 뒤에는 버린다). */
export const HANDOFF_TTL_MS = 10 * 60 * 1000;

export function isHandoffFresh(createdAt: number, now: number): boolean {
  return now - createdAt >= 0 && now - createdAt <= HANDOFF_TTL_MS;
}
