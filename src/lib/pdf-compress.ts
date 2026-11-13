import { safeFileName } from './files';

export const COMPRESS_PRESETS = {
  high: { label: '고화질', dpi: 200, quality: 0.85, note: '인쇄·보관용' },
  balanced: { label: '균형', dpi: 150, quality: 0.75, note: '제출·공유용' },
  small: { label: '용량 우선', dpi: 120, quality: 0.6, note: '메일 첨부용' },
} as const;

export type PresetKey = keyof typeof COMPRESS_PRESETS;
export type PresetSelection = PresetKey | 'custom';

export function presetSettings(key: PresetKey): { dpi: number; quality: number } {
  const preset = COMPRESS_PRESETS[key];
  return { dpi: preset.dpi, quality: preset.quality };
}

export function clampDpi(dpi: number): number {
  if (!Number.isFinite(dpi)) return 150;
  return Math.min(300, Math.max(72, Math.round(dpi)));
}

export function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 0.75;
  return Math.min(0.95, Math.max(0.3, quality));
}

/** PDF 포인트(72dpi) 기준 렌더 배율 */
export function scaleForDpi(dpi: number): number {
  return clampDpi(dpi) / 72;
}

/** 절감률(%). 압축 결과가 더 크면 음수가 된다. */
export function compressionRatio(originalBytes: number, compressedBytes: number): number {
  if (originalBytes <= 0) return 0;
  return Math.round(((originalBytes - compressedBytes) / originalBytes) * 100);
}

export function pdfCompressName(originalName: string): string {
  const base = safeFileName(originalName.replace(/\.pdf$/i, '')) || 'document';
  return `${base}-compressed.pdf`;
}

/** 텍스트 레이어가 있는 PDF인지 알려주는 안내 문구 */
export function textLayerWarning(hasText: boolean): string {
  return hasText
    ? '이 PDF에는 텍스트가 있습니다. 이미지로 다시 만들면 글자 검색·복사가 안 되고, 용량도 거의 줄지 않을 수 있습니다. 스캔본이 아니라면 원본을 그대로 쓰는 편이 좋습니다.'
    : '스캔본·이미지 PDF에 적합합니다. 해상도를 낮출수록 용량이 줄지만 작은 글씨가 흐려질 수 있습니다.';
}
