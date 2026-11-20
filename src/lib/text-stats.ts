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
  /** 한글 2바이트 기준(EUC-KR·완성형): 영문·숫자·공백 1, 그 밖의 글자 2, 줄바꿈 2(CRLF) */
  eucKrBytes: number;
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
    eucKrBytes: eucKrBytes(input),
  };
}

/**
 * 채용 사이트·공공 시스템이 흔히 쓰는 “한글 2바이트” 계산.
 * 웹 양식은 줄바꿈을 CRLF(2바이트)로 보내므로 줄바꿈도 2로 센다.
 */
export function eucKrBytes(input: string): number {
  let total = 0;
  for (const char of input.replace(/\r\n|\r/g, '\n')) {
    if (char === '\n') total += 2;
    else total += (char.codePointAt(0) ?? 0) < 0x80 ? 1 : 2;
  }
  return total;
}
