import {
  addBusinessDays,
  addCalendarDays,
  countBusinessDays,
  diffCalendarDays,
  formatKoreanDate,
  type HolidayEntry,
  holidaysInRange,
  parseHolidayInput,
  parseISODate,
  todayAtNoon,
  toISODate,
  weekdayKo,
} from '@/lib/date-calc';

const holidayCache = new Map<number, Map<string, string>>();
let runId = 0;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

async function loadYear(year: number): Promise<Map<string, string>> {
  const cached = holidayCache.get(year);
  if (cached) return cached;

  const map = new Map<string, string>();
  try {
    const { getHolidays } = await import('korean-holidays');
    for (const holiday of getHolidays(year)) {
      map.set(toISODate(holiday.date), holiday.nameKo);
    }
  } catch {
    // 데이터 로드 실패 시 주말만 제외하는 폴백을 쓴다.
  }
  holidayCache.set(year, map);
  return map;
}

async function loadHolidays(start: Date, end: Date): Promise<Map<string, string>> {
  const first = Math.min(start.getFullYear(), end.getFullYear());
  const last = Math.max(start.getFullYear(), end.getFullYear());
  const merged = new Map<string, string>();
  for (let year = first; year <= last && year <= first + 5; year += 1) {
    for (const [date, name] of await loadYear(year)) merged.set(date, name);
  }
  return merged;
}

export function initDateCalc(): void {
  const startInput = byId<HTMLInputElement>('dc-start');
  const endInput = byId<HTMLInputElement>('dc-end');
  const includeStart = byId<HTMLInputElement>('dc-include-start');
  const useHolidays = byId<HTMLInputElement>('dc-use-holidays');
  const customInput = byId<HTMLTextAreaElement>('dc-custom');
  const diffTotal = byId<HTMLElement>('dc-diff-total');
  const diffBusiness = byId<HTMLElement>('dc-diff-business');
  const diffHolidays = byId<HTMLElement>('dc-diff-holidays');
  const dday = byId<HTMLElement>('dc-dday');
  const diffNote = byId<HTMLElement>('dc-diff-note');
  const holidayList = byId<HTMLUListElement>('dc-holiday-list');
  const baseInput = byId<HTMLInputElement>('dc-base');
  const direction = byId<HTMLSelectElement>('dc-direction');
  const amountInput = byId<HTMLInputElement>('dc-amount');
  const unit = byId<HTMLSelectElement>('dc-unit');
  const resultValue = byId<HTMLElement>('dc-result');
  const resultIso = byId<HTMLElement>('dc-result-iso');
  const copyButton = byId<HTMLButtonElement>('dc-copy');
  const resetButton = byId<HTMLButtonElement>('dc-reset');
  const error = byId<HTMLElement>('dc-error');
  const status = byId<HTMLElement>('dc-status');

  if (!startInput || !endInput || !baseInput || !amountInput || !resultValue || !error) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setDefaults = () => {
    const today = todayAtNoon();
    startInput.value = toISODate(today);
    endInput.value = toISODate(addCalendarDays(today, 30));
    baseInput.value = toISODate(today);
    if (amountInput) amountInput.value = '7';
  };

  const renderHolidayList = (items: HolidayEntry[]) => {
    if (!holidayList) return;
    holidayList.replaceChildren();
    if (items.length === 0) {
      const li = document.createElement('li');
      li.className = 'muted';
      li.textContent = '기간 내 공휴일이 없습니다.';
      holidayList.append(li);
      return;
    }
    for (const item of items.slice(0, 12)) {
      const li = document.createElement('li');
      const date = document.createElement('time');
      date.dateTime = item.date;
      date.textContent = item.date;
      const name = document.createElement('span');
      name.textContent = item.name;
      li.append(date, name);
      holidayList.append(li);
    }
    if (items.length > 12) {
      const li = document.createElement('li');
      li.className = 'muted';
      li.textContent = `외 ${items.length - 12}일`;
      holidayList.append(li);
    }
  };

  let lastSummary = '';

  const run = async () => {
    const id = ++runId;
    showError('');

    const start = parseISODate(startInput.value);
    const end = parseISODate(endInput.value);
    const base = parseISODate(baseInput.value);
    const amount = Number(amountInput.value);
    const custom = parseHolidayInput(customInput?.value ?? '');

    if (!start || !end || !base) {
      showError('날짜를 올바르게 입력하세요.');
      return;
    }

    const excludeHolidays = useHolidays?.checked ?? true;
    const holidays = new Map<string, string>();
    if (excludeHolidays) {
      const loaded = await loadHolidays(start, end);
      for (const [date, name] of loaded) holidays.set(date, name);
      for (const date of custom.dates) holidays.set(date, '직접 추가');
    }

    if (id !== runId) return;

    if (custom.invalid.length > 0) {
      showError(`추가 휴일 형식이 올바르지 않습니다: ${custom.invalid.join(', ')} (YYYY-MM-DD)`);
    }

    const holidaySet = new Set(holidays.keys());
    const summaryLines: string[] = [];

    if (start > end) {
      showError('종료일이 시작일보다 빠릅니다.');
      if (diffTotal) diffTotal.textContent = '-';
      if (diffBusiness) diffBusiness.textContent = '-';
      if (diffHolidays) diffHolidays.textContent = '-';
      if (dday) dday.textContent = '-';
      renderHolidayList([]);
    } else {
      const total = diffCalendarDays(start, end);
      const business = countBusinessDays(start, end, {
        includeStart: includeStart?.checked ?? false,
        holidays: holidaySet,
      });
      const entries = excludeHolidays ? holidaysInRange(start, end, holidays) : [];

      if (diffTotal) diffTotal.textContent = `${total}일`;
      if (diffBusiness) diffBusiness.textContent = `${business}일`;
      if (diffHolidays) diffHolidays.textContent = `${entries.length}일`;
      if (dday) dday.textContent = total === 0 ? 'D-DAY' : `D-${total}`;
      if (diffNote) {
        diffNote.textContent = `${formatKoreanDate(start)} → ${formatKoreanDate(end)} · ${
          includeStart?.checked ? '시작일 포함' : '시작일 제외'
        } · ${excludeHolidays ? '주말·공휴일 제외' : '주말만 제외'}`;
      }
      renderHolidayList(entries);
      summaryLines.push(
        `기간: ${toISODate(start)} ~ ${toISODate(end)} (${total}일, 영업일 ${business}일)`,
      );
    }

    const signedAmount =
      (direction?.value === '-' ? -1 : 1) * Math.abs(Number.isFinite(amount) ? amount : 0);
    const businessMode = unit?.value === 'business';
    let result: Date;

    if (businessMode) {
      const loaded = excludeHolidays
        ? await loadHolidays(base, addCalendarDays(base, signedAmount * 2))
        : new Map();
      if (id !== runId) return;
      const set = new Set(loaded.keys());
      for (const date of custom.dates) set.add(date);
      result = addBusinessDays(base, signedAmount, set);
    } else {
      result = addCalendarDays(base, signedAmount);
    }

    if (resultValue) {
      resultValue.textContent = formatKoreanDate(result);
    }
    if (resultIso) {
      resultIso.textContent = `${toISODate(result)} · ${weekdayKo(result)}요일`;
    }
    summaryLines.push(
      `계산: ${toISODate(base)}에서 ${signedAmount}${businessMode ? '영업일' : '일'} → ${toISODate(result)} (${weekdayKo(result)})`,
    );
    lastSummary = summaryLines.join('\n');

    if (status) {
      status.textContent = excludeHolidays
        ? '한국 법정공휴일 기준으로 계산했습니다. 회사 휴무는 직접 추가하세요.'
        : '주말만 제외했습니다. 공휴일 제외를 켜면 더 정확합니다.';
    }
  };

  for (const control of [
    startInput,
    endInput,
    includeStart,
    useHolidays,
    customInput,
    baseInput,
    direction,
    amountInput,
    unit,
  ]) {
    control?.addEventListener('input', () => void run());
    control?.addEventListener('change', () => void run());
  }

  resetButton?.addEventListener('click', () => {
    setDefaults();
    if (customInput) customInput.value = '';
    if (useHolidays) useHolidays.checked = true;
    if (includeStart) includeStart.checked = false;
    void run();
  });

  copyButton?.addEventListener('click', async () => {
    if (!lastSummary) return;
    try {
      await navigator.clipboard.writeText(lastSummary);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '결과 복사';
      }, 1500);
    } catch {
      showError('자동 복사가 차단되었습니다. 결과를 선택해 복사하세요.');
    }
  });

  setDefaults();
  void run();
}
