import { describe, expect, it } from 'vitest';
import { A4_POINTS, a4PixelWidth, pdfFileName } from '../src/lib/pdf-export';

describe('pdf-export', () => {
  it('원본 확장자를 .pdf로 바꾼다', () => {
    expect(pdfFileName('보고서.docx')).toBe('보고서.pdf');
    expect(pdfFileName('sample.pptx')).toBe('sample.pdf');
    expect(pdfFileName('확장자없음')).toBe('확장자없음.pdf');
  });

  it('A4 포인트 크기를 유지한다', () => {
    expect(A4_POINTS.width).toBeCloseTo(595.28, 2);
    expect(A4_POINTS.height).toBeCloseTo(841.89, 2);
  });

  it('150dpi A4 픽셀 너비를 계산한다', () => {
    expect(a4PixelWidth(150)).toBe(1240);
  });
});
