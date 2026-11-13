import { describe, expect, it } from 'vitest';
import {
  clampDpi,
  clampQuality,
  compressionRatio,
  pdfCompressName,
  presetSettings,
  scaleForDpi,
  textLayerWarning,
} from '../src/lib/pdf-compress';

describe('presetSettings', () => {
  it('프리셋별 DPI와 화질', () => {
    expect(presetSettings('balanced')).toEqual({ dpi: 150, quality: 0.75 });
    expect(presetSettings('small').quality).toBeLessThan(presetSettings('high').quality);
    expect(presetSettings('high').dpi).toBeGreaterThan(presetSettings('small').dpi);
  });
});

describe('clampDpi / clampQuality', () => {
  it('범위를 벗어난 값을 보정한다', () => {
    expect(clampDpi(50)).toBe(72);
    expect(clampDpi(600)).toBe(300);
    expect(clampQuality(0.1)).toBe(0.3);
    expect(clampQuality(2)).toBe(0.95);
  });

  it('숫자가 아니면 기본값', () => {
    expect(clampDpi(Number.NaN)).toBe(150);
    expect(clampQuality(Number.NaN)).toBe(0.75);
  });
});

describe('scaleForDpi', () => {
  it('72dpi 는 배율 1', () => {
    expect(scaleForDpi(72)).toBe(1);
    expect(scaleForDpi(144)).toBe(2);
  });
});

describe('compressionRatio', () => {
  it('절감률을 계산한다', () => {
    expect(compressionRatio(1000, 400)).toBe(60);
    expect(compressionRatio(1000, 1200)).toBe(-20);
    expect(compressionRatio(0, 0)).toBe(0);
  });
});

describe('pdfCompressName', () => {
  it('파일명을 만든다', () => {
    expect(pdfCompressName('계약서.pdf')).toBe('계약서-compressed.pdf');
    expect(pdfCompressName('a/b.PDF')).toBe('a_b-compressed.pdf');
  });
});

describe('textLayerWarning', () => {
  it('텍스트 유무에 따라 다른 안내', () => {
    expect(textLayerWarning(true)).toContain('텍스트가 있습니다');
    expect(textLayerWarning(false)).toContain('스캔본');
  });
});
