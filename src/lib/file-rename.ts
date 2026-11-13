/**
 * 파일 이름 일괄 변경 규칙. 확장자는 항상 그대로 둔다(파일 종류가 바뀌면 열리지 않는다).
 * 틀: {name} 원래 이름, {n} 순번, {date} 오늘 날짜(YYYYMMDD)
 */
export interface RenameRule {
  template: string;
  find: string;
  replace: string;
  start: number;
  digits: number;
  textCase: 'keep' | 'lower' | 'upper';
  date: string;
}

export const DEFAULT_RULE: RenameRule = {
  template: '{name}',
  find: '',
  replace: '',
  start: 1,
  digits: 2,
  textCase: 'keep',
  date: '',
};

export function splitName(name: string): [string, string] {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
}

const ILLEGAL = /[\\/:*?"<>|\p{Cc}]+/gu;

export function cleanBase(base: string): string {
  return base.replace(ILLEGAL, '_').replace(/\s+/g, ' ').trim().replace(/^\.+/, '').slice(0, 150);
}

export function padNumber(value: number, digits: number): string {
  return String(value).padStart(Math.max(1, Math.min(6, digits)), '0');
}

export function todayStamp(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function renameOne(name: string, index: number, rule: RenameRule): string {
  const [base, ext] = splitName(name);
  const found = rule.find === '' ? base : base.split(rule.find).join(rule.replace);
  let next = (rule.template.trim() || '{name}')
    .replaceAll('{name}', found)
    .replaceAll('{n}', padNumber(rule.start + index, rule.digits))
    .replaceAll('{date}', rule.date || todayStamp());
  if (rule.textCase === 'lower') next = next.toLowerCase();
  if (rule.textCase === 'upper') next = next.toUpperCase();
  return `${cleanBase(next) || 'file'}${ext}`;
}

/** 새 이름 목록. 이름이 겹치면 뒤에 (2), (3)… 을 붙인다(대소문자 무시). */
export function applyRename(names: readonly string[], rule: RenameRule): string[] {
  const seen = new Set<string>();
  return names.map((name, index) => {
    const candidate = renameOne(name, index, rule);
    let result = candidate;
    let counter = 2;
    while (seen.has(result.toLowerCase())) {
      const [base, ext] = splitName(candidate);
      result = `${base} (${counter})${ext}`;
      counter += 1;
    }
    seen.add(result.toLowerCase());
    return result;
  });
}

export function zipName(date = new Date()): string {
  return `renamed-${todayStamp(date)}.zip`;
}
