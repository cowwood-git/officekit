export interface DateParts {
  year: number;
  month: number;
  day: number;
}

const DAY_MS = 86_400_000;

export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addCalendarDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
}

/** 종료일 - 시작일 (음수 가능) */
export function diffCalendarDays(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / DAY_MS);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export interface BusinessOptions {
  /** 시작일을 영업일 수에 포함할지 */
  includeStart?: boolean;
  /** 'YYYY-MM-DD' 형식의 공휴일 */
  holidays?: Set<string>;
}

export function isBusinessDay(date: Date, holidays: Set<string> = new Set()): boolean {
  return !isWeekend(date) && !holidays.has(toISODate(date));
}

/**
 * 두 날짜 사이의 영업일 수. 기본은 시작일을 제외하고 종료일을 포함한다.
 */
export function countBusinessDays(start: Date, end: Date, options: BusinessOptions = {}): number {
  if (diffCalendarDays(start, end) < 0) return 0;
  const holidays = options.holidays ?? new Set<string>();
  const includeStart = options.includeStart ?? false;
  let cursor = includeStart ? start : addCalendarDays(start, 1);
  let count = 0;

  while (diffCalendarDays(cursor, end) >= 0) {
    if (isBusinessDay(cursor, holidays)) count += 1;
    cursor = addCalendarDays(cursor, 1);
  }
  return count;
}

/** n 영업일 뒤(또는 앞)의 날짜. n=0 이면 시작일 그대로. */
export function addBusinessDays(
  start: Date,
  days: number,
  holidays: Set<string> = new Set(),
): Date {
  if (!Number.isFinite(days) || days === 0) return new Date(start);
  const step = days > 0 ? 1 : -1;
  let remaining = Math.abs(Math.trunc(days));
  let cursor = new Date(start);
  let guard = 0;

  while (remaining > 0 && guard < 10_000) {
    cursor = addCalendarDays(cursor, step);
    if (isBusinessDay(cursor, holidays)) remaining -= 1;
    guard += 1;
  }
  return cursor;
}

export interface HolidayEntry {
  date: string;
  name: string;
}

export function holidaysInRange(
  start: Date,
  end: Date,
  holidays: Map<string, string>,
): HolidayEntry[] {
  const result: HolidayEntry[] = [];
  let cursor = start;
  let guard = 0;
  while (diffCalendarDays(cursor, end) >= 0 && guard < 4000) {
    const iso = toISODate(cursor);
    const name = holidays.get(iso);
    if (name) result.push({ date: iso, name });
    cursor = addCalendarDays(cursor, 1);
    guard += 1;
  }
  return result;
}

/**
 * 아래 보완 목록을 우주항공청 월력요항(매년 6월 다음 해 발표)과 대조해 확인한 마지막 연도.
 * 다음 해 월력요항이 나오면 선거일·임시공휴일·대체공휴일을 대조하고 이 값을 올린다.
 */
export const HOLIDAYS_REVIEWED_THROUGH = 2027;

/** 공휴일 데이터 패키지가 모르는 법정 공휴일. 날짜가 정해진 선거일·누락된 대체공휴일만 둔다. */
const EXTRA_HOLIDAYS: Record<string, string> = {
  '2026-06-03': '전국동시지방선거일',
  '2028-04-12': '국회의원선거일',
  // 2028년분은 법정 선거일과 규정상 확정된 대체공휴일만. 월력요항(2027년 6월) 발표 후 다시 대조한다.
  // 추석 연휴(10.2~10.4)가 개천절과 겹친다 → 다음 첫 비공휴일(관공서 공휴일 규정 제3조)
  '2028-10-05': '대체공휴일 (추석)',
};

/**
 * 2026년 개정 공휴일법 반영: 노동절(5.1, 2026.5.1 시행)·제헌절(7.17, 2026년 재지정).
 * 둘 다 토·일요일이나 다른 공휴일과 겹치면 다음 첫 평일 비공휴일이 대체공휴일이 된다
 * (2027년 월력요항: 5.3·7.19 대체공휴일).
 */
export function supplementKoreanHolidays(
  year: number,
  base: Map<string, string>,
): Map<string, string> {
  const map = new Map(base);
  for (const [date, name] of Object.entries(EXTRA_HOLIDAYS)) {
    if (date.startsWith(`${year}-`) && !map.has(date)) map.set(date, name);
  }
  if (year < 2026) return map;
  const fixed: Array<[string, string]> = [
    [`${year}-05-01`, '노동절'],
    [`${year}-07-17`, '제헌절'],
  ];
  for (const [date, name] of fixed) {
    const overlapped = map.has(date) && map.get(date) !== name;
    if (!map.has(date)) map.set(date, name);
    const day = parseISODate(date);
    if (!day || (!isWeekend(day) && !overlapped)) continue;
    let cursor = addCalendarDays(day, 1);
    while (isWeekend(cursor) || map.has(toISODate(cursor))) cursor = addCalendarDays(cursor, 1);
    map.set(toISODate(cursor), `대체공휴일 (${name})`);
  }
  return map;
}

export interface ParsedHolidays {
  dates: Set<string>;
  invalid: string[];
}

/** 줄바꿈·쉼표로 구분된 날짜 목록을 파싱한다. */
export function parseHolidayInput(text: string): ParsedHolidays {
  const tokens = text
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const dates = new Set<string>();
  const invalid: string[] = [];

  for (const token of tokens) {
    const date = parseISODate(token);
    if (date) dates.add(toISODate(date));
    else invalid.push(token);
  }
  return { dates, invalid };
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function formatKoreanDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

export function weekdayKo(date: Date): string {
  return WEEKDAYS[date.getDay()] ?? '';
}

export function todayAtNoon(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
}
