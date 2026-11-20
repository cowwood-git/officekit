/** 문서에 쓰는 날짜·금액·사업자번호 표기. 화면과 PDF가 같은 값을 쓴다. */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function todayIso(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDot(value: string): string {
  const match = ISO_DATE.exec(value);
  if (!match) return value;
  return `${match[1]}. ${Number(match[2])}. ${Number(match[3])}.`;
}

export function formatDateKorean(value: string): string {
  const match = ISO_DATE.exec(value);
  if (!match) return value;
  return `${match[1]}년 ${Number(match[2])}월 ${Number(match[3])}일`;
}

export function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/** 시작일과 종료일을 모두 포함한 일수. 잘못된 날짜이거나 종료일이 앞서면 0. */
export function countDaysInclusive(from: string, to: string): number {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end) return 0;
  const diff = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(diff, 0);
}

/** 두 날짜 사이의 기간을 년·개월로 표기한다. 2020-03-02 ~ 2026-11-15 → 6년 8개월 */
export function formatTenure(from: string, to: string): string {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end || end.getTime() < start.getTime()) return '';

  let months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;

  if (months <= 0) return '1개월 미만';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}년`);
  if (rest > 0) parts.push(`${rest}개월`);
  return parts.join(' ');
}

const DIGITS = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'] as const;
const SMALL_UNITS = ['', '십', '백', '천'] as const;
const BIG_UNITS = ['', '만', '억', '조'] as const;

function fourDigits(value: number): string {
  const digits = String(value).padStart(4, '0');
  let out = '';
  for (let index = 0; index < 4; index += 1) {
    const digit = Number(digits[index]);
    if (digit === 0) continue;
    out += `${DIGITS[digit]}${SMALL_UNITS[3 - index]}`;
  }
  return out;
}

/** 123456789 → 일억이천삼백사십오만육천칠백팔십구 */
export function formatKoreanNumber(value: number): string {
  const rounded = Math.max(0, Math.round(value));
  if (rounded === 0) return '영';

  const groups: number[] = [];
  let rest = rounded;
  while (rest > 0) {
    groups.push(rest % 10_000);
    rest = Math.floor(rest / 10_000);
  }

  let out = '';
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index] ?? 0;
    if (group === 0) continue;
    out += `${fourDigits(group)}${BIG_UNITS[index] ?? ''}`;
  }
  return out;
}

/** 일금 삼백이십만 원정 (3,200,000원) */
export function formatKoreanAmount(value: number): string {
  const won = Math.max(0, Math.round(value));
  const number = new Intl.NumberFormat('ko-KR').format(won);
  return `${formatKoreanNumber(won)} 원정 (${number}원)`;
}

export function formatBizNo(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/** 국세청 사업자등록번호 체크섬. */
export function isValidBizNo(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 10) return false;
  const numbers = digits.split('').map(Number);
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += (numbers[index] ?? 0) * (weights[index] ?? 0);
  }
  sum += Math.floor(((numbers[8] ?? 0) * 5) / 10);
  return (10 - (sum % 10)) % 10 === (numbers[9] ?? -1);
}

export function formatWon(value: number): string {
  return `₩${new Intl.NumberFormat('ko-KR').format(Math.max(0, Math.round(value)))}`;
}

/** 문서번호 표시 여부를 담는 값 이름. 체크를 끄면 '1'이 들어간다. */
export const DOC_NO_HIDDEN = 'docNoHidden';

/** 사용자가 문서번호를 PDF·HWPX에 넣지 않기로 했는지. */
export function isDocNoHidden(values: Readonly<Record<string, string | undefined>>): boolean {
  return values[DOC_NO_HIDDEN] === '1';
}
