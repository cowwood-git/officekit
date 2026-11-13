/**
 * 앱 타일 호버 데모.
 * 도구마다 그 도구가 하는 일을 보여 주는 고유한 애니메이션을 쓴다(tests/app-demos.test.ts 가 중복을 막는다).
 */
export const DEMO_TYPES = [
  'merge',
  'split',
  'split-images',
  'compress',
  'compress-image',
  'redact',
  'stamp-image',
  'form',
  'sign',
  'extract-text',
  'extract-image',
  'extract-image-text',
  'convert',
  'convert-image',
  'to-pdf',
  'to-image',
  'crop',
  'crop-doc',
  'rotate',
  'filter',
  'info',
  'info-image',
  'calendar',
  'percent',
  'calc',
  'ruler',
  'json',
  'qr',
  'organize',
  'nup',
  'resize',
  'page-number',
  'header-footer',
  'watermark',
  'docx',
  'ocr',
  'frame',
  'join-images',
  'collage',
  'mosaic',
  'sheet',
  'clean',
  'table-code',
  'sql',
  'table-pdf',
  'pivot',
  'join',
  'csv-json',
  'count',
  'cleanup',
  'case',
  'qr-make',
  'resize-image',
  'pdf-view',
  'lock',
  'unlock',
  'grayscale',
  'id-photo',
  'gif',
  'compare',
  'colors',
  'rename',
  'dpi',
  'base64',
  'scan',
  'text-diff',
  'csv-xlsx',
  'csv-chart',
  'pdf-insert',
  'pdf-diff',
  'pptx-view',
  'hwpx-view',
  'docx-to-pdf',
  'pptx-to-pdf',
  'hwpx-to-pdf',
  'vcf-ics',
  'quote',
  'seal',
  'password',
  'hash',
  'label',
  'vcard-make',
  'ics-make',
  'zip',
  'qr-batch',
  'stats',
  'merge-tables',
  'barcode-make',
] as const;

export type DemoType = (typeof DEMO_TYPES)[number];

const DEMO_BY_SLUG: Record<string, DemoType> = {
  // PDF·문서
  'pdf-merge': 'merge',
  'pdf-split': 'split',
  'jpg-to-pdf': 'to-pdf',
  'pdf-to-jpg': 'to-image',
  'sheet-viewer': 'sheet',
  'docx-viewer': 'docx',
  'pptx-viewer': 'pptx-view',
  'hwpx-viewer': 'hwpx-view',
  'docx-to-pdf': 'docx-to-pdf',
  'pptx-to-pdf': 'pptx-to-pdf',
  'hwpx-to-pdf': 'hwpx-to-pdf',
  'vcf-ics-viewer': 'vcf-ics',
  'quote-generator': 'quote',
  'seal-maker': 'seal',
  'password-generator': 'password',
  'file-hash': 'hash',
  'label-print': 'label',
  'vcard-maker': 'vcard-make',
  'ics-maker': 'ics-make',
  zip: 'zip',
  'qr-batch': 'qr-batch',
  'csv-stats': 'stats',
  'merge-tables': 'merge-tables',
  'barcode-generator': 'barcode-make',
  'pdf-ocr': 'ocr',
  'pdf-compress': 'compress',
  'pdf-organize': 'organize',
  'pdf-page-insert': 'pdf-insert',
  'pdf-watermark': 'watermark',
  'pdf-page-number': 'page-number',
  'pdf-metadata': 'info',
  'pdf-nup': 'nup',
  'pdf-resize': 'resize',
  'pdf-crop': 'crop-doc',
  'pdf-text': 'extract-text',
  'pdf-diff': 'pdf-diff',
  'pdf-header-footer': 'header-footer',
  'pdf-image-extract': 'extract-image',
  'pdf-sign': 'sign',
  'pdf-form-fill': 'form',
  'pdf-redact': 'redact',

  // 이미지
  'heic-to-jpg': 'convert',
  'image-crop': 'crop',
  'image-mosaic': 'mosaic',
  'image-ocr': 'extract-image-text',
  'image-watermark': 'stamp-image',
  'image-merge': 'join-images',
  'image-split': 'split-images',
  'image-info': 'info-image',
  'image-filter': 'filter',
  'image-frame': 'frame',
  'image-collage': 'collage',
  'image-rotate': 'rotate',
  'image-resize': 'resize-image',
  'pdf-viewer': 'pdf-view',
  'image-convert': 'convert-image',
  'image-compress': 'compress-image',

  // 표·CSV
  'csv-json': 'csv-json',
  'csv-clean': 'clean',
  'csv-table': 'table-code',
  'csv-sql': 'sql',
  'csv-pdf': 'table-pdf',
  'csv-pivot': 'pivot',
  'csv-join': 'join',
  'csv-xlsx': 'csv-xlsx',
  'csv-chart': 'csv-chart',

  // 텍스트·계산
  'text-counter': 'count',
  'text-cleanup': 'cleanup',
  'text-diff': 'text-diff',
  'text-convert': 'case',
  'date-calc': 'calendar',
  calculator: 'calc',
  'percent-calc': 'percent',
  'unit-convert': 'ruler',
  'json-tools': 'json',
  'qr-reader': 'qr',
  'qr-generate': 'qr-make',
  'pdf-protect': 'lock',
  'pdf-unlock': 'unlock',
  'pdf-grayscale': 'grayscale',
  'id-photo': 'id-photo',
  'doc-scanner': 'scan',
  'gif-maker': 'gif',
  'image-compare': 'compare',
  'image-colors': 'colors',
  'file-rename': 'rename',
  'image-dpi': 'dpi',
  'image-base64': 'base64',
};

export function demoTypeFor(slug: string): DemoType {
  return DEMO_BY_SLUG[slug] ?? 'count';
}

export function formatFor(slug: string): string {
  if (slug.endsWith('-to-pdf')) return 'PDF';
  if (slug === 'vcf-ics-viewer') return 'VCF';
  if (slug === 'quote-generator') return 'PDF';
  if (slug === 'seal-maker') return 'PNG';
  if (slug === 'password-generator') return 'TXT';
  if (slug === 'file-hash') return 'SHA';
  if (slug === 'label-print') return 'PDF';
  if (slug === 'vcard-maker') return 'VCF';
  if (slug === 'ics-maker') return 'ICS';
  if (slug === 'zip') return 'ZIP';
  if (slug === 'qr-batch') return 'QR';
  if (slug === 'merge-tables') return 'CSV';
  if (slug === 'barcode-generator') return 'BAR';
  if (slug === 'pdf-to-jpg') return 'JPG';
  if (slug === 'pptx-viewer') return 'PPTX';
  if (slug === 'hwpx-viewer') return 'HWPX';
  if (slug === 'jpg-to-pdf' || slug.startsWith('pdf-')) return 'PDF';
  if (slug === 'sheet-viewer') return 'XLSX';
  if (slug === 'docx-viewer') return 'DOCX';
  if (slug.startsWith('csv-')) return 'CSV';
  if (slug === 'heic-to-jpg') return 'HEIC';
  if (slug === 'image-convert') return 'IMG';
  if (slug.startsWith('image-')) return 'JPG';
  if (slug.startsWith('text-')) return 'TXT';
  if (slug === 'json-tools') return 'JSON';
  if (slug.startsWith('qr-')) return 'QR';
  return '';
}
