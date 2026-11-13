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

export type CompressMethod = 'keep' | 'raster';

/** 방식별 최대 쪽수. 글자 유지 방식은 사진만 다시 압축해서 훨씬 가볍다. */
export const MAX_PAGES: Record<CompressMethod, number> = { keep: 1000, raster: 50 };

/** 고른 방식과 문서 종류에 맞는 안내 문구 */
export function methodNote(method: CompressMethod, hasText: boolean): string {
  if (method === 'keep') {
    return hasText
      ? '글자는 그대로 두고 문서 안의 사진만 다시 압축합니다. 글자 검색·복사·링크가 유지됩니다.'
      : '스캔본으로 보입니다. 페이지 사진을 다시 압축합니다. 더 줄여야 하면 “페이지를 이미지로” 방식을 써 보세요.';
  }
  return hasText
    ? '이 PDF에는 텍스트가 있습니다. 이미지로 다시 만들면 글자 검색·복사가 안 되고, 용량도 거의 줄지 않을 수 있습니다. “글자 유지” 방식을 권합니다.'
    : '스캔본·이미지 PDF에 적합합니다. 해상도를 낮출수록 용량이 줄지만 작은 글씨가 흐려질 수 있습니다.';
}
