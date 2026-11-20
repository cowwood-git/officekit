/**
 * 양식 경고에 쓰는 법정 기준값. 해마다 바뀌는 값은 여기 한 곳에서만 고친다.
 * 경고는 PDF 생성을 막지 않는다. 예외가 있는 규정이라 단정하지 않고 "확인하세요"로 알린다.
 */

/** 최저임금 시간급(원). 최저임금위원회 의결·고용노동부 고시. */
export const MINIMUM_WAGE: Readonly<Record<number, number>> = {
  2026: 10_320,
  2027: 10_700,
};

/** 주 40시간 근무 시 월 환산 기준 시간(주휴 포함). */
export const MONTHLY_STANDARD_HOURS = 209;

/** 이자제한법 제2조제1항의 최고이자율에 관한 규정: 연 20%(2021-07-07 시행). */
export const MAX_INTEREST_RATE = 20;

/** 근로기준법 제53조제1항: 당사자 합의로 1주 12시간까지 연장. */
export const WEEKLY_OVERTIME_LIMIT = 12;

/** 신원보증법 제3조: 신원보증계약 기간은 2년을 넘지 못한다. */
export const GUARANTEE_MAX_MONTHS = 24;

/** 기간제법 제4조: 기간제 근로자 사용 기간 2년. */
export const FIXED_TERM_MAX_YEARS = 2;

/** 날짜(YYYY-MM-DD)의 연도에 맞는 최저임금. 표에 없는 연도는 가장 가까운 해의 값을 쓴다. */
export function minimumWageFor(date: string | undefined): { year: number; hourly: number } {
  const years = Object.keys(MINIMUM_WAGE)
    .map(Number)
    .sort((a, b) => a - b);
  const first = years[0] ?? 2026;
  const last = years[years.length - 1] ?? first;
  const parsed = Number((date ?? '').slice(0, 4));
  const year =
    Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.max(parsed, first), last) : last;
  return { year, hourly: MINIMUM_WAGE[year] ?? MINIMUM_WAGE[last] ?? 0 };
}

/**
 * "연 24%", "월 2%", "24.5 퍼센트" 같은 이자 문구를 연이율(%)로 바꾼다.
 * 숫자가 없거나 "없음"이면 null.
 */
export function annualRateFrom(text: string | undefined): number | null {
  const value = (text ?? '').replace(/\s+/g, '');
  const match = value.match(/(\d+(?:\.\d+)?)(?:%|퍼센트|프로)/);
  if (!match?.[1]) return null;
  const rate = Number(match[1]);
  if (!Number.isFinite(rate)) return null;
  if (/월/.test(value.slice(0, match.index ?? 0))) return rate * 12;
  return rate;
}

/** "12시간", "주 15시간" 에서 시간 수를 읽는다. */
export function hoursFrom(text: string | undefined): number | null {
  const match = (text ?? '').match(/(\d+(?:\.\d+)?)\s*(?:시간|h|H)?/);
  if (!match?.[1]) return null;
  const hours = Number(match[1]);
  return Number.isFinite(hours) ? hours : null;
}

/** "입사일로부터 3년", "18개월" 같은 기간 문구를 개월 수로 바꾼다. 읽지 못하면 null. */
export function monthsFrom(text: string | undefined): number | null {
  const value = text ?? '';
  let months = 0;
  let found = false;
  const years = value.match(/(\d+(?:\.\d+)?)\s*년/);
  if (years?.[1]) {
    months += Number(years[1]) * 12;
    found = true;
  }
  const monthMatch = value.match(/(\d+)\s*개월/);
  if (monthMatch?.[1]) {
    months += Number(monthMatch[1]);
    found = true;
  }
  return found ? months : null;
}

/** 두 날짜(YYYY-MM-DD) 사이가 n년을 넘는지. */
export function exceedsYears(
  start: string | undefined,
  end: string | undefined,
  n: number,
): boolean {
  if (!start || !end) return false;
  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${end}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return false;
  const limit = new Date(from);
  limit.setFullYear(limit.getFullYear() + n);
  return to >= limit;
}

/** 기준일(YYYY-MM-DD)의 만 나이. 날짜가 비었거나 형식이 다르면 null. */
export function ageAt(birth: string | undefined, on: string | undefined): number | null {
  if (!birth || !on || !/^\d{4}-\d{2}-\d{2}$/.test(birth) || !/^\d{4}-\d{2}-\d{2}$/.test(on)) {
    return null;
  }
  const age = Number(on.slice(0, 4)) - Number(birth.slice(0, 4));
  return on.slice(5) < birth.slice(5) ? age - 1 : age;
}
