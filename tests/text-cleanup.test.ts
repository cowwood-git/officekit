import { describe, expect, it } from 'vitest';
import {
  type CleanupOptions,
  cleanText,
  cleanupFileName,
  cleanupStats,
} from '../src/lib/text-cleanup';

const base: CleanupOptions = {
  trim: true,
  removeEmpty: true,
  dedupe: false,
  collapseSpaces: false,
  sort: 'none',
  numbering: 'none',
};

describe('cleanText', () => {
  it('줄 앞뒤 공백과 빈 줄을 제거한다', () => {
    expect(cleanText('  사과  \n\n 바나나 \n', base)).toBe('사과\n바나나');
  });

  it('중복 줄을 제거한다', () => {
    expect(cleanText('사과\n바나나\n사과\n', { ...base, dedupe: true })).toBe('사과\n바나나');
  });

  it('가나다순·역순·길이순으로 정렬한다', () => {
    expect(cleanText('다\n가\n나', { ...base, sort: 'asc' })).toBe('가\n나\n다');
    expect(cleanText('가\n나\n다', { ...base, sort: 'desc' })).toBe('다\n나\n가');
    expect(cleanText('가나다\n가\n나', { ...base, sort: 'length' })).toBe('가\n나\n가나다');
  });

  it('번호와 불릿을 붙인다', () => {
    expect(cleanText('사과\n바나나', { ...base, numbering: 'dot' })).toBe('1. 사과\n2. 바나나');
    expect(cleanText('사과\n바나나', { ...base, numbering: 'paren' })).toBe('1) 사과\n2) 바나나');
    expect(cleanText('사과\n바나나', { ...base, numbering: 'dash' })).toBe('- 사과\n- 바나나');
    expect(cleanText('사과\n바나나', { ...base, numbering: 'bullet' })).toBe('• 사과\n• 바나나');
  });

  it('공백을 하나로 접는다', () => {
    expect(
      cleanText('사과\t\t 1개\n  바나나   2개', {
        ...base,
        collapseSpaces: true,
      }),
    ).toBe('사과 1개\n바나나 2개');
  });

  it('CRLF를 LF로 통일한다', () => {
    expect(cleanText('a\r\nb\rc', base)).toBe('a\nb\nc');
  });
});

describe('cleanupStats', () => {
  it('입력·출력·제거·중복 줄 수를 센다', () => {
    const stats = cleanupStats('a\n\nb\na\n', 'a\nb');
    expect(stats.inputLines).toBe(5);
    expect(stats.outputLines).toBe(2);
    expect(stats.removedLines).toBe(3);
    expect(stats.duplicateLines).toBe(1);
  });
});

describe('cleanupFileName', () => {
  it('결과 파일명을 만든다', () => {
    expect(cleanupFileName()).toBe('text-cleaned.txt');
    expect(cleanupFileName('목록.txt')).toBe('목록-cleaned.txt');
  });
});
