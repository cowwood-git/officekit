import { describe, expect, it } from 'vitest';
import { countText } from '../src/lib/text-stats';

describe('countText', () => {
  it('빈 문자열은 모두 0이다', () => {
    const stats = countText('');
    expect(stats.charsWithSpaces).toBe(0);
    expect(stats.charsWithoutSpaces).toBe(0);
    expect(stats.words).toBe(0);
    expect(stats.lines).toBe(0);
    expect(stats.sentences).toBe(0);
    expect(stats.bytes).toBe(0);
  });

  it('공백 포함·제외 글자수를 센다', () => {
    const stats = countText('가나 다');
    expect(stats.charsWithSpaces).toBe(4);
    expect(stats.charsWithoutSpaces).toBe(3);
    expect(stats.words).toBe(2);
  });

  it('줄 수와 문장 수를 센다', () => {
    const stats = countText('첫 문장입니다. 두 번째 문장! \n세 번째 줄?');
    expect(stats.lines).toBe(2);
    expect(stats.sentences).toBe(3);
  });

  it('한글은 UTF-8 3바이트로 센다', () => {
    const stats = countText('한글');
    expect(stats.bytes).toBe(6);
  });

  it('이모지는 코드 포인트 기준으로 센다', () => {
    const stats = countText('👍');
    expect(stats.charsWithSpaces).toBe(1);
    expect(stats.bytes).toBe(4);
  });

  it('한글 음절만 따로 센다', () => {
    const stats = countText('abc 한글 123');
    expect(stats.koreanChars).toBe(2);
  });
});
