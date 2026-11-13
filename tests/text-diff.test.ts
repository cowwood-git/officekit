import { describe, expect, it } from 'vitest';
import { diffFileName, diffLines, diffSummary, splitLines, toDiffText } from '../src/lib/text-diff';

describe('splitLines', () => {
  it('CRLF와 마지막 줄바꿈을 정리한다', () => {
    expect(splitLines('가\r\n나\r다\n')).toEqual(['가', '나', '다']);
    expect(splitLines('')).toEqual([]);
  });

  it('중간 빈 줄은 남긴다', () => {
    expect(splitLines('가\n\n나')).toEqual(['가', '', '나']);
  });
});

describe('diffLines', () => {
  it('같은 텍스트는 모두 same 이다', () => {
    const result = diffLines('가\n나\n다', '가\n나\n다');
    expect(result.identical).toBe(true);
    expect(result.stats).toEqual({
      added: 0,
      removed: 0,
      changed: 0,
      unchanged: 3,
      oldLines: 3,
      newLines: 3,
    });
    expect(result.rows.map((row) => row.type)).toEqual(['same', 'same', 'same']);
  });

  it('추가된 줄을 찾는다', () => {
    const result = diffLines('가\n다', '가\n나\n다');
    expect(result.stats.added).toBe(1);
    expect(result.rows.map((row) => row.type)).toEqual(['same', 'add', 'same']);
    expect(result.rows[1]?.newText).toBe('나');
    expect(result.rows[1]?.oldLine).toBeUndefined();
    expect(result.rows[1]?.newLine).toBe(2);
  });

  it('삭제된 줄을 찾는다', () => {
    const result = diffLines('가\n나\n다', '가\n다');
    expect(result.stats.removed).toBe(1);
    expect(result.rows.map((row) => row.type)).toEqual(['same', 'remove', 'same']);
    expect(result.rows[1]?.oldText).toBe('나');
    expect(result.rows[1]?.newLine).toBeUndefined();
  });

  it('바뀐 줄을 변경으로 짝짓는다', () => {
    const result = diffLines('가\n나\n다', '가\n바뀐 나\n다');
    expect(result.stats.changed).toBe(1);
    expect(result.rows[1]).toMatchObject({
      type: 'change',
      oldLine: 2,
      newLine: 2,
      oldText: '나',
      newText: '바뀐 나',
    });
  });

  it('여러 블록의 추가·삭제·변경을 함께 처리한다', () => {
    const result = diffLines(
      ['1', '2', '3', '4', '5', '6'].join('\n'),
      ['1', '둘', '3', '4', '5', '여섯', '7'].join('\n'),
    );
    expect(result.stats).toMatchObject({ changed: 2, added: 1, removed: 0, unchanged: 4 });
    expect(result.rows.map((row) => row.type)).toEqual([
      'same',
      'change',
      'same',
      'same',
      'same',
      'change',
      'add',
    ]);
  });

  it('공백 무시 옵션을 적용한다', () => {
    const oldText = '  가   나  \n다';
    const newText = '가 나\n다';
    expect(diffLines(oldText, newText).identical).toBe(false);
    const ignored = diffLines(oldText, newText, { ignoreWhitespace: true });
    expect(ignored.identical).toBe(true);
    expect(ignored.stats.changed).toBe(0);
  });

  it('대소문자 무시 옵션을 적용한다', () => {
    expect(diffLines('Apple\nBanana', 'apple\nBanana').identical).toBe(false);
    expect(diffLines('Apple\nBanana', 'apple\nBanana', { ignoreCase: true }).identical).toBe(true);
  });

  it('한글·영문 혼합 문서를 비교한다', () => {
    const result = diffLines(
      '계약 기간: 2026-01-01 ~ 2026-12-31\n계약 금액: 1,000,000원\n담당자: 김오피스',
      '계약 기간: 2026-01-01 ~ 2026-12-31\n계약 금액: 1,200,000원\n담당자: 김오피스',
    );
    expect(result.stats.changed).toBe(1);
    expect(result.rows[1]?.newText).toContain('1,200,000');
  });

  it('빈 입력도 안전하게 처리한다', () => {
    expect(diffLines('', '').identical).toBe(true);
    expect(diffLines('', '가').stats.added).toBe(1);
    expect(diffLines('가', '').stats.removed).toBe(1);
  });

  it('한 줄에 5,000줄이 있어도 빠르게 비교한다', () => {
    const oldLines = Array.from({ length: 5000 }, (_, index) => `line ${index + 1}`);
    const newLines = [...oldLines];
    newLines[100] = 'changed line 101';
    newLines.splice(2000, 0, 'inserted line');
    newLines.splice(4000, 1);

    const started = performance.now();
    const result = diffLines(oldLines.join('\n'), newLines.join('\n'));
    const elapsed = performance.now() - started;

    expect(result.stats.changed).toBe(1);
    expect(result.stats.added).toBe(1);
    expect(result.stats.removed).toBe(1);
    expect(elapsed).toBeLessThan(3000);
  });

  it('완전히 다른 큰 문서도 멈추지 않는다', () => {
    const oldText = Array.from({ length: 800 }, (_, index) => `old ${index}`).join('\n');
    const newText = Array.from({ length: 800 }, (_, index) => `new ${index}`).join('\n');
    const result = diffLines(oldText, newText);
    expect(result.stats.changed + result.stats.added + result.stats.removed).toBeGreaterThan(0);
    expect(result.rows.length).toBeGreaterThan(0);
  });
});

describe('toDiffText', () => {
  it('same·remove·add·change 를 구분해 적는다', () => {
    const result = diffLines('가\n나\n다', '가\n바뀐 나\n라');
    expect(toDiffText(result.rows)).toBe(['  가', '- 나', '+ 바뀐 나', '- 다', '+ 라'].join('\n'));
  });
});

describe('diffFileName', () => {
  it('파일명을 안전하게 만든다', () => {
    expect(diffFileName('계약서.pdf', '계약서-수정.pdf')).toBe('계약서-vs-계약서-수정.diff.txt');
    expect(diffFileName('a/b.txt', 'c:d.txt')).toBe('a_b-vs-c_d.diff.txt');
  });
});

describe('diffSummary', () => {
  it('변경·추가·삭제를 요약한다', () => {
    expect(
      diffSummary({
        changed: 2,
        added: 1,
        removed: 3,
        unchanged: 4,
        oldLines: 9,
        newLines: 7,
      }),
    ).toBe('변경 2줄 · 추가 1줄 · 삭제 3줄 — 같은 줄 4줄');
    expect(
      diffSummary({ changed: 0, added: 0, removed: 0, unchanged: 4, oldLines: 4, newLines: 4 }),
    ).toBe('두 텍스트가 같습니다.');
  });
});
