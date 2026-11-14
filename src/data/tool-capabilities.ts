/**
 * 도구 역량(capability) 레지스트리.
 * 카테고리(형식)와 별개로 "무엇을 하는 도구인지"를 선언해 카탈로그 필터·검색·추천에 쓴다.
 * 새 도구를 추가하면 반드시 여기에도 등록한다(tests/tool-capabilities.test.ts).
 */

export const OPERATIONS = [
  {
    id: 'view',
    label: '보기',
    verb: '열어보기',
    description: '설치 없이 파일을 열어 내용을 확인합니다.',
    synonyms: ['보기', '열기', '열어보기', '미리보기', 'view'],
  },
  {
    id: 'convert',
    label: '변환',
    verb: '바꾸기',
    description: 'PDF·이미지·표·문서 형식을 다른 형식으로 바꿉니다.',
    synonyms: ['변환', '바꾸기', '변환기', 'convert'],
  },
  {
    id: 'organize',
    label: '정리',
    verb: '합치기·나누기',
    description: '파일을 합치고 나누고 순서와 구성을 정리합니다.',
    synonyms: ['정리', '합치기', '병합', '나누기', '분할', '순서', 'merge', 'split'],
  },
  {
    id: 'edit',
    label: '편집',
    verb: '다듬기',
    description: '자르기·크기·압축·워터마크처럼 모양과 내용을 다듬습니다.',
    synonyms: [
      '편집',
      '다듬기',
      '자르기',
      '크기',
      '압축',
      '줄이기',
      '워터마크',
      '회전',
      'compress',
      'edit',
    ],
  },
  {
    id: 'protect',
    label: '보호',
    verb: '잠그기·가리기',
    description: '암호·가리기·서명·양식으로 문서를 안전하게 다룹니다.',
    synonyms: ['보호', '잠그기', '암호', '비밀번호', '가리기', '서명', '양식', 'protect', 'sign'],
  },
  {
    id: 'extract',
    label: '추출',
    verb: '뽑기',
    description: 'OCR·텍스트·이미지·데이터를 파일에서 뽑아냅니다.',
    synonyms: ['추출', '뽑기', 'OCR', '텍스트', '데이터', 'extract'],
  },
  {
    id: 'create',
    label: '만들기·계산',
    verb: '새로 만들기',
    description: 'QR·계산·증명사진·차트처럼 새 결과를 만듭니다.',
    synonyms: ['만들기', '생성', '계산', 'create'],
  },
] as const;

export type OperationId = (typeof OPERATIONS)[number]['id'];

export const FORMATS = [
  { id: 'document', label: 'PDF', note: 'PDF를 합치고 나누고 바꾸는 작업' },
  { id: 'office', label: 'OFFICE', note: '한글·워드·파워포인트·엑셀 문서' },
  { id: 'sheet', label: 'CSV', note: 'CSV·엑셀 표와 데이터' },
  { id: 'image', label: 'IMAGE', note: '사진·스캔 이미지' },
  { id: 'text', label: 'TEXT', note: '글자·텍스트·JSON' },
  { id: 'utility', label: 'UTIL', note: '계산·QR·파일 정리' },
] as const;

export type FormatId = (typeof FORMATS)[number]['id'];

export const FEATURES = [
  { id: 'ocr', label: 'OCR' },
  { id: 'sign', label: '서명' },
  { id: 'form', label: '양식' },
  { id: 'batch', label: '일괄' },
  { id: 'compare', label: '비교' },
  { id: 'offline', label: '오프라인' },
] as const;

export type FeatureId = (typeof FEATURES)[number]['id'];

export interface ToolCapability {
  format: FormatId;
  operations: OperationId[];
  accepts: string[];
  produces: string[];
  features?: FeatureId[];
}

const cap = (
  format: FormatId,
  operations: OperationId[],
  accepts: string[] = [],
  produces: string[] = [],
  features: FeatureId[] = [],
): ToolCapability => ({ format, operations, accepts, produces, features });

export const TOOL_CAPABILITIES: Record<string, ToolCapability> = {
  // PDF
  'pdf-merge': cap('document', ['organize'], ['pdf'], ['pdf']),
  'pdf-split': cap('document', ['organize'], ['pdf'], ['pdf']),
  'jpg-to-pdf': cap('document', ['convert'], ['jpg', 'png', 'webp', 'image'], ['pdf']),
  'pdf-to-jpg': cap('document', ['convert'], ['pdf'], ['jpg', 'zip']),
  'pdf-viewer': cap('document', ['view'], ['pdf'], []),
  'pdf-ocr': cap('document', ['extract', 'convert'], ['pdf'], ['txt'], ['ocr']),
  'pdf-compress': cap('document', ['edit'], ['pdf'], ['pdf'], ['batch']),
  'pdf-organize': cap('document', ['organize'], ['pdf'], ['pdf']),
  'pdf-page-insert': cap('document', ['organize'], ['pdf'], ['pdf']),
  'pdf-watermark': cap('document', ['edit'], ['pdf'], ['pdf']),
  'pdf-page-number': cap('document', ['edit'], ['pdf'], ['pdf']),
  'pdf-metadata': cap('document', ['view', 'edit'], ['pdf'], ['pdf']),
  'pdf-nup': cap('document', ['organize', 'edit'], ['pdf'], ['pdf']),
  'pdf-resize': cap('document', ['edit'], ['pdf'], ['pdf']),
  'pdf-crop': cap('document', ['edit'], ['pdf'], ['pdf']),
  'pdf-text': cap('document', ['extract'], ['pdf'], ['txt']),
  'pdf-diff': cap('document', ['extract', 'view'], ['pdf'], ['txt'], ['compare']),
  'pdf-header-footer': cap('document', ['edit'], ['pdf'], ['pdf']),
  'pdf-image-extract': cap('document', ['extract'], ['pdf'], ['jpg', 'png', 'zip']),
  'pdf-sign': cap('document', ['protect', 'edit'], ['pdf'], ['pdf'], ['sign']),
  'pdf-form-fill': cap('document', ['protect', 'edit'], ['pdf'], ['pdf'], ['form']),
  'pdf-redact': cap('document', ['protect'], ['pdf'], ['pdf']),
  'pdf-protect': cap('document', ['protect'], ['pdf'], ['pdf']),
  'pdf-unlock': cap('document', ['protect'], ['pdf'], ['pdf']),
  'doc-scanner': cap('document', ['convert', 'edit'], ['jpg', 'png', 'image'], ['pdf']),
  'pdf-grayscale': cap('document', ['edit'], ['pdf'], ['pdf']),

  // OFFICE
  'sheet-viewer': cap('office', ['view'], ['csv', 'xlsx', 'xls'], []),
  'docx-viewer': cap('office', ['view'], ['doc', 'docx'], []),
  'pptx-viewer': cap('office', ['view'], ['ppt', 'pptx'], []),
  'hwpx-viewer': cap('office', ['view'], ['hwp', 'hwpx'], []),
  'hwpx-to-pdf': cap('office', ['convert'], ['hwp', 'hwpx'], ['pdf']),
  'docx-to-pdf': cap('office', ['convert'], ['doc', 'docx'], ['pdf']),
  'pptx-to-pdf': cap('office', ['convert'], ['ppt', 'pptx'], ['pdf']),

  // IMAGE
  'heic-to-jpg': cap('image', ['convert'], ['heic'], ['jpg']),
  'image-crop': cap('image', ['edit'], ['image'], ['image'], ['batch']),
  'image-mosaic': cap('image', ['protect', 'edit'], ['image'], ['image']),
  'image-ocr': cap('image', ['extract'], ['image'], ['txt'], ['ocr']),
  'image-watermark': cap('image', ['edit'], ['image'], ['image'], ['batch']),
  'image-merge': cap('image', ['organize', 'edit'], ['image'], ['image']),
  'image-split': cap('image', ['organize', 'edit'], ['image'], ['image']),
  'image-info': cap('image', ['view'], ['image'], []),
  'image-filter': cap('image', ['edit'], ['image'], ['image']),
  'image-frame': cap('image', ['edit'], ['image'], ['image']),
  'image-collage': cap('image', ['create', 'edit'], ['image'], ['image']),
  'image-rotate': cap('image', ['edit'], ['image'], ['image']),
  'image-resize': cap('image', ['edit'], ['image'], ['image'], ['batch']),
  'image-convert': cap('image', ['convert'], ['image'], ['image'], ['batch']),
  'image-compress': cap('image', ['edit'], ['image'], ['image'], ['batch']),
  'id-photo': cap('image', ['create', 'edit'], ['image'], ['image']),
  'remove-background': cap('image', ['edit'], ['image'], ['image']),
  'gif-maker': cap('image', ['create', 'convert'], ['image', 'mp4'], ['gif']),
  'image-compare': cap('image', ['view'], ['image'], [], ['compare']),
  'image-colors': cap('image', ['extract'], ['image'], ['text']),
  'image-dpi': cap('image', ['edit'], ['image'], ['image']),
  'image-base64': cap('image', ['convert'], ['image'], ['text']),

  // SHEET
  'csv-json': cap('sheet', ['convert'], ['csv', 'tsv'], ['json']),
  'csv-clean': cap('sheet', ['organize', 'edit'], ['csv', 'tsv'], ['csv']),
  'csv-table': cap('sheet', ['convert'], ['csv', 'tsv'], ['html', 'md']),
  'csv-sql': cap('sheet', ['extract', 'convert'], ['csv', 'tsv'], ['sql']),
  'csv-pdf': cap('office', ['convert'], ['csv', 'xls', 'xlsx', 'ods'], ['pdf']),
  'csv-pivot': cap('sheet', ['extract', 'organize'], ['csv', 'xlsx'], ['csv']),
  'csv-join': cap('sheet', ['organize'], ['csv', 'xlsx'], ['csv']),
  'csv-xlsx': cap('sheet', ['convert'], ['csv', 'xlsx', 'xls'], ['csv', 'xlsx']),
  'csv-chart': cap('sheet', ['create', 'extract'], ['csv', 'xlsx'], ['png', 'svg']),

  // TEXT
  'json-tools': cap('text', ['edit', 'extract'], ['json'], ['json', 'txt']),
  'text-counter': cap('text', ['extract'], ['text'], []),
  'text-cleanup': cap('text', ['edit'], ['text'], ['text']),
  'text-diff': cap('text', ['view', 'extract'], ['text'], [], ['compare']),
  'text-convert': cap('text', ['convert'], ['text'], ['text']),

  // UTILITY
  'date-calc': cap('utility', ['create'], [], []),
  calculator: cap('utility', ['create'], [], []),
  'percent-calc': cap('utility', ['create'], [], []),
  'unit-convert': cap('utility', ['convert'], [], []),
  'qr-reader': cap('utility', ['view', 'extract'], ['image'], ['text']),
  'qr-generate': cap('utility', ['create'], ['text'], ['png', 'svg']),
  'file-rename': cap('utility', ['organize', 'edit'], ['file'], ['file']),
  'vcf-ics-viewer': cap('utility', ['view', 'extract'], ['vcf', 'ics'], ['csv']),
  'quote-generator': cap('utility', ['create'], [], ['pdf']),
  'seal-maker': cap('utility', ['create'], [], ['png'], ['sign']),
  'label-print': cap('utility', ['create'], ['csv', 'xlsx', 'tsv'], ['pdf'], ['batch']),
  'vcard-maker': cap('utility', ['create'], [], ['vcf']),
  'ics-maker': cap('utility', ['create'], [], ['ics']),
  zip: cap('utility', ['organize', 'extract', 'create'], ['zip'], ['zip', 'file'], ['batch']),
  'qr-batch': cap('utility', ['create'], ['text', 'csv', 'xlsx'], ['png', 'zip'], ['batch']),
  'csv-stats': cap('sheet', ['extract', 'view'], ['csv', 'tsv', 'xlsx', 'xls'], ['csv']),
  'merge-tables': cap(
    'sheet',
    ['organize'],
    ['csv', 'tsv', 'xlsx', 'xls'],
    ['csv', 'xlsx'],
    ['batch'],
  ),
  'barcode-generator': cap(
    'utility',
    ['create'],
    ['text', 'csv', 'xlsx'],
    ['png', 'svg', 'pdf', 'zip'],
    ['batch'],
  ),
  'password-generator': cap('utility', ['create'], [], ['txt']),
  'file-hash': cap('utility', ['extract'], ['file'], ['txt']),
};

export function capabilityFor(slug: string): ToolCapability {
  return TOOL_CAPABILITIES[slug] ?? cap('utility', ['create']);
}

export function operationLabel(id: OperationId): string {
  return OPERATIONS.find((operation) => operation.id === id)?.label ?? id;
}

export function operationSearchText(id: OperationId): string {
  const operation = OPERATIONS.find((item) => item.id === id);
  return operation ? operation.synonyms.join(' ') : id;
}

export function formatLabel(id: FormatId): string {
  return FORMATS.find((format) => format.id === id)?.label ?? id;
}
