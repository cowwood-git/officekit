import { describe, expect, it } from 'vitest';
import { chunkPages, formatPageList, parsePageRanges } from '../src/lib/pdf-split';

describe('parsePageRanges', () => {
  it('쉼표와 범위를 해석한다', () => {
    expect(parsePageRanges('1-3, 5', 10)).toEqual({ pages: [1, 2, 3, 5], errors: [] });
  });

  it('입력 순서를 유지한다', () => {
    expect(parsePageRanges('5, 1-3', 10).pages).toEqual([5, 1, 2, 3]);
  });

  it('중복 페이지를 제거한다', () => {
    expect(parsePageRanges('2, 1-3, 2', 10).pages).toEqual([2, 1, 3]);
  });

  it('물결표와 en dash 범위를 지원한다', () => {
    expect(parsePageRanges('1~2 4–5', 10).pages).toEqual([1, 2, 4, 5]);
  });

  it('페이지 수를 벗어난 범위를 거부한다', () => {
    const result = parsePageRanges('0', 3);
    expect(result.pages).toHaveLength(0);
    expect(result.errors.join(' ')).toContain('1~3');
  });

  it('뒤집힌 범위를 거부한다', () => {
    const result = parsePageRanges('3-1', 5);
    expect(result.errors.join(' ')).toContain('시작이 끝보다');
  });

  it('숫자가 아닌 입력을 거부한다', () => {
    const result = parsePageRanges('a-b', 5);
    expect(result.errors.join(' ')).toContain('형식');
  });

  it('빈 입력을 거부한다', () => {
    expect(parsePageRanges('  ', 5).errors.length).toBeGreaterThan(0);
  });

  it('페이지 수가 0이면 계산하지 않는다', () => {
    expect(parsePageRanges('1', 0).pages).toHaveLength(0);
  });

  it('열린 범위를 지원한다', () => {
    expect(parsePageRanges('2-', 5)).toEqual({ pages: [2, 3, 4, 5], errors: [] });
    expect(parsePageRanges('-3', 5)).toEqual({ pages: [1, 2, 3], errors: [] });
    expect(parsePageRanges('-', 5).errors.length).toBeGreaterThan(0);
  });
});

describe('chunkPages', () => {
  it('size 개씩 묶는다', () => {
    expect(chunkPages(5, 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('size 가 페이지 수보다 크면 한 묶음이다', () => {
    expect(chunkPages(3, 5)).toEqual([[1, 2, 3]]);
  });

  it('잘못된 입력은 빈 배열', () => {
    expect(chunkPages(0, 2)).toEqual([]);
    expect(chunkPages(5, 0)).toEqual([]);
  });
});

describe('formatPageList', () => {
  it('연속 구간을 압축한다', () => {
    expect(formatPageList([1, 2, 3, 5])).toBe('1-3, 5');
    expect(formatPageList([1, 3, 4])).toBe('1, 3-4');
    expect(formatPageList([])).toBe('');
  });
});
