export interface TextStats {
  /** 공백 포함 글자수(유니코드 코드 포인트 기준) */
  charsWithSpaces: number;
  /** 공백 제외 글자수 */
  charsWithoutSpaces: number;
  /** 공백으로 구분한 단어 수 */
  words: number;
  /** 줄 수 */
  lines: number;
  /** 문장 수(. ! ? 。 ！ ？ 기준) */
  sentences: number;
  /** 한글 음절 수 */
  koreanChars: number;
  /** UTF-8 바이트 수 */
  bytes: number;
  /** 공백·줄바꿈 제외 바이트 수 */
  bytesWithoutSpaces: number;
}

const SENTENCE_END = /[.!?。！？]+/;

export function countText(input: string): TextStats {
  const chars = Array.from(input);
  const withoutSpaces = chars.filter((char) => !/\s/u.test(char));
  const words = input.trim() === '' ? [] : input.trim().split(/\s+/u);
  const sentences = input
    .split(SENTENCE_END)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return {
    charsWithSpaces: chars.length,
    charsWithoutSpaces: withoutSpaces.length,
    words: words.length,
    lines: input === '' ? 0 : input.split(/\r\n|\r|\n/).length,
    sentences: sentences.length,
    koreanChars: (input.match(/[가-힣]/gu) ?? []).length,
    bytes: new TextEncoder().encode(input).length,
    bytesWithoutSpaces: new TextEncoder().encode(withoutSpaces.join('')).length,
  };
}
