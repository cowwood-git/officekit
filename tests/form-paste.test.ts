import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';
import { mergePastedRows, parseClipboardTable } from '../src/lib/form-paste';

const quote = FORMS.find((form) => form.slug === 'quote');
const attendance = FORMS.find((form) => form.slug === 'attendance');
if (!quote || !attendance) throw new Error('form missing');

const quoteGroup = quote.groups?.[0];
const attendanceGroup = attendance.groups?.[0];
if (!quoteGroup || !attendanceGroup) throw new Error('group missing');

describe('엑셀 붙여넣기', () => {
  it('TSV와 따옴표로 감싼 여러 줄 셀을 읽는다', () => {
    const table = parseClipboardTable('품목\t수량\n"줄\n바꿈"\t2');
    expect(table).toEqual([
      ['품목', '수량'],
      ['줄\n바꿈', '2'],
    ]);
  });

  it('머리글 줄을 건너뛰고 현재 표에 채운다', () => {
    const matrix = parseClipboardTable(
      '품목\t수량\t단가\t금액\nA4 용지\t2\t1,000\t2,000\n토너\t1\t50,000\t50,000',
    );
    const result = mergePastedRows(quoteGroup, [{}, {}, {}], matrix);

    expect(result.skippedHeader).toBe(true);
    expect(result.applied).toBe(6);
    expect(result.ignored).toBe(0);
    expect(result.rows[0]).toMatchObject({
      name: 'A4 용지',
      quantity: '2',
      unitPrice: '1000',
    });
    expect(result.rows[1]).toMatchObject({
      name: '토너',
      quantity: '1',
      unitPrice: '50000',
    });
  });

  it('선택지에 없는 값과 최대 줄 수를 처리한다', () => {
    const matrix = parseClipboardTable(
      '홍길동\t개발팀\t사원\t출석\n김철수\t개발팀\t사원\t없는상태',
    );
    const result = mergePastedRows(attendanceGroup, [{}, {}], matrix, 0, 0);

    expect(result.rows[0]).toMatchObject({
      name: '홍길동',
      department: '개발팀',
      status: '출석',
    });
    expect(result.ignored).toBe(1);
    expect(result.rows[1]?.status).toBe('');

    const long = Array.from({ length: 100 }, (_, index) => [`사람${index}`]);
    const truncated = mergePastedRows(quoteGroup, [], long, 0, 0);
    expect(truncated.rows.length).toBeLessThanOrEqual(quoteGroup.maxRows ?? 30);
    expect(truncated.truncated).toBeGreaterThan(0);
  });
});
