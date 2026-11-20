import { describe, expect, it } from 'vitest';
import {
  addBusinessDays,
  addCalendarDays,
  countBusinessDays,
  diffCalendarDays,
  formatKoreanDate,
  HOLIDAYS_REVIEWED_THROUGH,
  holidaysInRange,
  isWeekend,
  parseHolidayInput,
  parseISODate,
  supplementKoreanHolidays,
  toISODate,
} from '../src/lib/date-calc';

const date = (value: string) => {
  const parsed = parseISODate(value);
  if (!parsed) throw new Error(`invalid fixture: ${value}`);
  return parsed;
};

const holidays = new Set(['2026-02-16', '2026-02-17', '2026-02-18']);

describe('parseISODate / toISODate', () => {
  it('유효한 날짜를 왕복 변환한다', () => {
    const value = date('2026-02-17');
    expect(toISODate(value)).toBe('2026-02-17');
  });

  it('존재하지 않는 날짜를 거부한다', () => {
    expect(parseISODate('2026-02-31')).toBeNull();
    expect(parseISODate('2026/02/17')).toBeNull();
  });
});

describe('diffCalendarDays', () => {
  it('일수 차이를 계산한다', () => {
    expect(diffCalendarDays(date('2026-02-13'), date('2026-02-19'))).toBe(6);
    expect(diffCalendarDays(date('2026-02-19'), date('2026-02-13'))).toBe(-6);
  });
});

describe('countBusinessDays', () => {
  it('주말과 공휴일을 제외한다', () => {
    expect(countBusinessDays(date('2026-02-13'), date('2026-02-19'), { holidays })).toBe(1);
  });

  it('시작일 포함 옵션', () => {
    expect(
      countBusinessDays(date('2026-02-13'), date('2026-02-19'), {
        holidays,
        includeStart: true,
      }),
    ).toBe(2);
  });

  it('역순이면 0', () => {
    expect(countBusinessDays(date('2026-02-19'), date('2026-02-13'), { holidays })).toBe(0);
  });
});

describe('addBusinessDays', () => {
  it('공휴일을 건너뛴다', () => {
    expect(toISODate(addBusinessDays(date('2026-02-13'), 1, holidays))).toBe('2026-02-19');
  });

  it('음수도 계산한다', () => {
    expect(toISODate(addBusinessDays(date('2026-02-19'), -1, holidays))).toBe('2026-02-13');
  });

  it('0이면 그대로', () => {
    expect(toISODate(addBusinessDays(date('2026-02-19'), 0, holidays))).toBe('2026-02-19');
  });
});

describe('holidaysInRange', () => {
  it('범위 내 공휴일만 반환한다', () => {
    const map = new Map([
      ['2026-02-16', '설날 연휴'],
      ['2026-02-17', '설날'],
      ['2026-03-01', '삼일절'],
    ]);
    expect(holidaysInRange(date('2026-02-13'), date('2026-02-19'), map)).toEqual([
      { date: '2026-02-16', name: '설날 연휴' },
      { date: '2026-02-17', name: '설날' },
    ]);
  });
});

describe('parseHolidayInput', () => {
  it('쉼표·줄바꿈을 처리하고 잘못된 값을 모은다', () => {
    const result = parseHolidayInput('2026-12-24, 2026-12-31\n2026-13-01');
    expect([...result.dates]).toEqual(['2026-12-24', '2026-12-31']);
    expect(result.invalid).toEqual(['2026-13-01']);
  });
});

describe('formatKoreanDate', () => {
  it('한국어 형식으로 표시한다', () => {
    expect(formatKoreanDate(date('2026-02-17'))).toBe('2026년 2월 17일 (화)');
  });
});

describe('isWeekend', () => {
  it('토·일을 판별한다', () => {
    expect(isWeekend(date('2026-02-14'))).toBe(true);
    expect(isWeekend(date('2026-02-16'))).toBe(false);
  });
});

describe('addCalendarDays', () => {
  it('월 경계를 넘어간다', () => {
    expect(toISODate(addCalendarDays(date('2026-01-31'), 1))).toBe('2026-02-01');
  });
});

describe('supplementKoreanHolidays', () => {
  it('노동절·지방선거일을 더한다(2026)', () => {
    const map = supplementKoreanHolidays(2026, new Map([['2026-07-17', '제헌절']]));
    expect(map.get('2026-05-01')).toBe('노동절');
    expect(map.get('2026-06-03')).toBe('전국동시지방선거일');
    expect([...map.keys()].filter((date) => date.startsWith('2026-07'))).toEqual(['2026-07-17']);
  });

  it('토요일 노동절·제헌절은 다음 월요일이 대체공휴일이다(2027 월력요항)', () => {
    const map = supplementKoreanHolidays(2027, new Map([['2027-07-17', '제헌절']]));
    expect(map.get('2027-05-03')).toBe('대체공휴일 (노동절)');
    expect(map.get('2027-07-19')).toBe('대체공휴일 (제헌절)');
  });

  it('추석 연휴와 개천절이 겹친 2028년 대체공휴일과 총선일을 더한다', () => {
    const map = supplementKoreanHolidays(2028, new Map());
    expect(map.get('2028-10-05')).toBe('대체공휴일 (추석)');
    expect(map.get('2028-04-12')).toBe('국회의원선거일');
  });

  it('2025년 이전에는 노동절을 공휴일로 넣지 않는다', () => {
    expect(supplementKoreanHolidays(2025, new Map()).has('2025-05-01')).toBe(false);
  });
});

describe('공휴일 연례 갱신', () => {
  // 우주항공청이 매년 6월 다음 해 월력요항(공휴일·대체공휴일)을 발표한다. 7월부터는 다음 해까지
  // 대조해 두어야 영업일 계산이 맞다. 실패하면 src/lib/date-calc.ts의 EXTRA_HOLIDAYS에
  // 선거일·임시공휴일·누락된 대체공휴일을 넣고 HOLIDAYS_REVIEWED_THROUGH를 올린다.
  const now = new Date();
  const year = now.getFullYear();

  it('올해 공휴일을 대조했다', () => {
    expect(HOLIDAYS_REVIEWED_THROUGH, `${year}년 월력요항과 대조하세요`).toBeGreaterThanOrEqual(
      year,
    );
  });

  it('7월부터는 다음 해 공휴일도 대조했다', () => {
    if (now.getMonth() < 6) return;
    expect(
      HOLIDAYS_REVIEWED_THROUGH,
      `${year + 1}년 월력요항(6월 발표)과 대조하세요`,
    ).toBeGreaterThanOrEqual(year + 1);
  });
});
