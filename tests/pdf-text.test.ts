import { describe, expect, it } from 'vitest';
import { combinePages, pageText, textFileName, textStats } from '../src/lib/pdf-text';

describe('pageText', () => {
  it('줄바꿈을 유지하고 공백을 정리한다', () => {
    expect(
      pageText([
        { str: '안녕하세요', hasEOL: true },
        { str: '오피스킷  테스트' },
        { str: '입니다', hasEOL: true },
      ]),
    ).toBe('안녕하세요\n오피스킷 테스트입니다');
  });

  it('빈 아이템과 과도한 줄바꿈을 정리한다', () => {
    expect(
      pageText([{ str: 'A', hasEOL: true }, { str: '', hasEOL: true }, { str: '' }, { str: 'B' }]),
    ).toBe('A\nB');
  });
});

describe('combinePages', () => {
  it('페이지 구분선을 넣는다', () => {
    expect(
      combinePages([
        { pageNumber: 1, text: 'A' },
        { pageNumber: 2, text: 'B' },
      ]),
    ).toBe('--- 1페이지 ---\nA\n\n--- 2페이지 ---\nB');
  });

  it('구분선을 끌 수 있다', () => {
    expect(
      combinePages(
        [
          { pageNumber: 1, text: 'A' },
          { pageNumber: 2, text: 'B' },
        ],
        false,
      ),
    ).toBe('A\n\nB');
  });
});

describe('textStats', () => {
  it('글자·줄·페이지를 센다', () => {
    const text = combinePages([
      { pageNumber: 1, text: '가 나' },
      { pageNumber: 2, text: '다' },
    ]);
    expect(textStats(text)).toEqual({ characters: 3, lines: 2, pages: 2 });
  });
});

describe('textFileName', () => {
  it('TXT 파일명을 만든다', () => {
    expect(textFileName('보고서.pdf')).toBe('보고서.txt');
  });
});
