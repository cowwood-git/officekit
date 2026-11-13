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
