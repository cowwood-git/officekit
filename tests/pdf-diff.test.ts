import { describe, expect, it } from 'vitest';
import {
  comparePdfPages,
  MAX_COMPARE_PAGES,
  pageKey,
  pdfDiffFileName,
  pdfDiffSummary,
  totalTextLength,
} from '../src/lib/pdf-diff';

describe('pageKey', () => {
  it('줄바꿈과 연속 공백을 무시한다', () => {
    expect(pageKey('계약 기간\n2026-01-01')).toBe(pageKey('계약   기간 2026-01-01'));
  });
});

describe('comparePdfPages', () => {
  it('같은 PDF는 모든 쪽이 그대로다', () => {
    const result = comparePdfPages(['가\n나', '다'], ['가\n나', '다']);
    expect(result.changed).toBe(false);
    expect(result.stats).toMatchObject({
      addedPages: 0,
      removedPages: 0,
      changedPages: 0,
      unchangedPages: 2,
      oldPages: 2,
      newPages: 2,
    });
    expect(result.pages.map((page) => page.type)).toEqual(['same', 'same']);
  });

  it('바뀐 쪽을 변경으로 잡고 줄 diff를 만든다', () => {
    const result = comparePdfPages(['가\n나\n다'], ['가\n바뀐 나\n다']);
    expect(result.stats.changedPages).toBe(1);
    expect(result.pages[0]?.type).toBe('changed');
    expect(result.pages[0]?.oldPage).toBe(1);
    expect(result.pages[0]?.newPage).toBe(1);
    expect(result.pages[0]?.diff?.stats.changed).toBe(1);
    expect(result.pages[0]?.diff?.rows[1]?.newText).toBe('바뀐 나');
  });

  it('중간에 추가된 쪽을 찾는다', () => {
    const result = comparePdfPages(['A', 'B'], ['A', '새 쪽', 'B']);
    expect(result.stats.addedPages).toBe(1);
    expect(result.stats.changedPages).toBe(0);
    expect(result.pages.map((page) => page.type)).toEqual(['same', 'added', 'same']);
    expect(result.pages[1]?.newPage).toBe(2);
  });

  it('삭제된 쪽을 찾는다', () => {
    const result = comparePdfPages(['A', 'B', 'C'], ['A', 'C']);
    expect(result.stats.removedPages).toBe(1);
    expect(result.pages.map((page) => page.type)).toEqual(['same', 'removed', 'same']);
    expect(result.pages[1]?.oldPage).toBe(2);
  });

  it('여러 쪽이 바뀌어도 순서대로 맞춘다', () => {
    const result = comparePdfPages(['A', 'B', 'C'], ['A1', 'B', 'C1']);
    expect(result.pages.map((page) => page.type)).toEqual(['changed', 'same', 'changed']);
    expect(result.stats.changedPages).toBe(2);
  });

  it('공백만 다른 쪽은 그대로 본다', () => {
    const result = comparePdfPages(['계약 기간\n2026-01-01'], ['계약   기간 2026-01-01']);
    expect(result.pages[0]?.type).toBe('same');
    expect(result.changed).toBe(false);
  });

  it('빈 쪽도 처리한다', () => {
    const result = comparePdfPages(['', 'A'], ['', 'A']);
    expect(result.pages.map((page) => page.type)).toEqual(['same', 'same']);
  });

  it('한쪽이 비어 있으면 추가·삭제로 표시한다', () => {
    const added = comparePdfPages([], ['A', 'B']);
    expect(added.stats.addedPages).toBe(2);
    expect(added.pages.every((page) => page.type === 'added')).toBe(true);

    const removed = comparePdfPages(['A', 'B'], []);
    expect(removed.stats.removedPages).toBe(2);
    expect(removed.pages.every((page) => page.type === 'removed')).toBe(true);
  });

  it('페이지 수 제한을 넘으면 오류', () => {
    const pages = Array.from({ length: MAX_COMPARE_PAGES + 1 }, (_, index) => `p${index}`);
    expect(() => comparePdfPages(pages, ['A'])).toThrow();
  });

  it('100쪽 비교가 빠르게 끝난다', () => {
    const oldPages = Array.from({ length: 100 }, (_, index) => `page ${index}\nline two`);
    const newPages = [...oldPages];
    newPages[50] = 'page 50\nline changed';
    const result = comparePdfPages(oldPages, newPages);
    expect(result.stats.changedPages).toBe(1);
    expect(result.stats.unchangedPages).toBe(99);
  });
});

describe('helpers', () => {
  it('전체 텍스트 길이를 센다', () => {
    expect(totalTextLength(['가 나', '다'])).toBe(3);
    expect(totalTextLength(['', '  '])).toBe(0);
  });

  it('요약 문장을 만든다', () => {
    const summary = pdfDiffSummary({
      addedPages: 1,
      removedPages: 2,
      changedPages: 3,
      unchangedPages: 4,
      oldPages: 9,
      newPages: 8,
      addedLines: 5,
      removedLines: 6,
      changedLines: 7,
    });
    expect(summary).toBe('바뀐 쪽 3 · 추가된 쪽 1 · 삭제된 쪽 2 — 그대로인 쪽 4');
    expect(
      pdfDiffSummary({
        addedPages: 0,
        removedPages: 0,
        changedPages: 0,
        unchangedPages: 4,
        oldPages: 4,
        newPages: 4,
        addedLines: 0,
        removedLines: 0,
        changedLines: 0,
      }),
    ).toBe('두 PDF의 페이지 텍스트가 같습니다.');
  });

  it('파일명을 만든다', () => {
    expect(pdfDiffFileName('계약서.pdf', '계약서-수정.pdf')).toBe('계약서-vs-계약서-수정-diff.txt');
    expect(pdfDiffFileName('a/b.pdf', 'c:d.pdf')).toBe('a_b-vs-c_d-diff.txt');
  });
});
