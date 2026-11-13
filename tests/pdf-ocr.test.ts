import { describe, expect, it } from 'vitest';
import {
  averageConfidence,
  combinePageTexts,
  overallProgress,
  pdfOcrFileName,
} from '../src/lib/pdf-ocr';

describe('combinePageTexts', () => {
  it('여러 페이지에 구분선을 넣는다', () => {
    const text = combinePageTexts([
      { page: 1, text: '첫 페이지' },
      { page: 3, text: '셋째 페이지' },
    ]);
    expect(text).toBe('--- 1쪽 ---\n첫 페이지\n\n--- 3쪽 ---\n셋째 페이지');
  });

  it('한 페이지면 구분선을 넣지 않는다', () => {
    expect(combinePageTexts([{ page: 2, text: '내용' }])).toBe('내용');
  });

  it('빈 페이지는 제외한다', () => {
    expect(combinePageTexts([{ page: 1, text: '  ' }])).toBe('');
  });
});

describe('averageConfidence', () => {
  it('평균을 반올림한다', () => {
    expect(averageConfidence([80, 90, 100])).toBe(90);
    expect(averageConfidence([85, 86])).toBe(86);
  });

  it('값이 없으면 0', () => {
    expect(averageConfidence([])).toBe(0);
    expect(averageConfidence([Number.NaN])).toBe(0);
  });
});

describe('overallProgress', () => {
  it('페이지 진행률을 전체로 환산한다', () => {
    expect(overallProgress(0, 4, 0)).toBe(0);
    expect(overallProgress(0, 4, 0.5)).toBe(0.125);
    expect(overallProgress(1, 4, 0)).toBe(0.25);
    expect(overallProgress(3, 4, 1)).toBe(1);
  });

  it('범위를 벗어나지 않는다', () => {
    expect(overallProgress(9, 4, 2)).toBe(1);
    expect(overallProgress(-1, 4, -1)).toBe(0);
  });
});

describe('pdfOcrFileName', () => {
  it('pdf를 ocr.txt로 바꾼다', () => {
    expect(pdfOcrFileName('계약서.pdf')).toBe('계약서-ocr.txt');
    expect(pdfOcrFileName('a/b.PDF')).toBe('a_b-ocr.txt');
  });
});
