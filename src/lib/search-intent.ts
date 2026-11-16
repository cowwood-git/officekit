/**
 * 검색 의도 판별.
 *
 * "PDF"처럼 파일 형식·동작만 입력하면 도구를, "휴가신청서"처럼 문서 이름을
 * 입력하면 양식을 우선한다. 검색 다이얼로그와 홈 검색이 같은 규칙을 쓴다.
 */

export const FORMAT_WORDS: ReadonlySet<string> = new Set([
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'csv',
  'xlsx',
  'docx',
  'pptx',
  'hwp',
  'hwpx',
  'zip',
  'mp4',
  'mov',
  '압축',
  '변환',
  '합치기',
  '나누기',
  '자르기',
  'ocr',
]);

const FORM_INTENT =
  /(양식|서식|신청서|보고서|증명서|계약서|위임장|수료증|상장|체크리스트|견적서|명세서|회의록|인수인계|정산서|품의서|발주서|납품|재직|출장)/;

export function normalizeSearch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function isFormIntent(query: string): boolean {
  return FORM_INTENT.test(normalizeSearch(query));
}

/** 파일 형식·동작 질의이고 문서 의도가 없으면 도구만 보여 준다. */
export function isToolFormatQuery(query: string): boolean {
  const normalized = normalizeSearch(query);
  if (!normalized || isFormIntent(normalized)) return false;
  return normalized.split(' ').some((word) => FORMAT_WORDS.has(word));
}
