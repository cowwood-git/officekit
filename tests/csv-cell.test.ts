import { describe, expect, it } from 'vitest';
import { csvCell, isFormulaLike, rowsToCsv } from '../src/lib/csv-cell';
import { toCsv } from '../src/lib/csv-clean';

describe('CSV 수식 실행 방지', () => {
  it.each([
    '=HYPERLINK("http://x","클릭")',
    '@SUM(A1:A2)',
    "+cmd|' /C calc'!A0",
    "-cmd|' /C calc'!A0",
    '\t=1+1',
  ])('%s 는 글자로 바꾼다', (value) => {
    expect(isFormulaLike(value)).toBe(true);
    expect(csvCell(value).replace(/^"/, '').startsWith("'")).toBe(true);
  });

  it.each(['+82 10-1234-5678', '-1,200', '-0.5', '+3', '-', '010-1234-5678', '김옷깃', ''])(
    '%s 는 그대로 둔다',
    (value) => {
      expect(isFormulaLike(value)).toBe(false);
    },
  );

  it('따옴표·쉼표·줄바꿈을 감싼다', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(
      rowsToCsv(
        [
          ['a', 'b'],
          ['1', '2'],
        ],
        { eol: '\r\n' },
      ),
    ).toBe('a,b\r\n1,2');
    expect(rowsToCsv([['a']], { quoteAll: true })).toBe('"a"');
  });

  it('CSV 정리 결과에도 적용된다', () => {
    expect(
      toCsv([
        ['이름', '메모'],
        ['김', '=1+1'],
      ]),
    ).toBe("이름,메모\n김,'=1+1");
  });
});
