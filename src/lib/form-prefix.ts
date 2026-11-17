/** 문서번호 접두사 설정. 양식별로 브라우저에만 저장한다. */
const STORAGE_KEY = 'officekit.forms.prefix.v1';

type PrefixMap = Record<string, string>;

function readMap(): PrefixMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: PrefixMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

/** 한글·영문·숫자 1~6자로 정리한다. 빈 값은 그대로 둔다. */
export function normalizePrefix(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9가-힣]/g, '')
    .slice(0, 6);
}

export function readFormPrefix(slug: string): string | null {
  const value = readMap()[slug];
  return value ? normalizePrefix(value) : null;
}

export function saveFormPrefix(slug: string, prefix: string): void {
  try {
    const map = readMap();
    const normalized = normalizePrefix(prefix);
    if (normalized) map[slug] = normalized;
    else delete map[slug];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // 저장을 막는 브라우저에서도 문서 작성은 계속된다.
  }
}

/** `PREFIX-YYYYMMDD-001` 형식의 문서번호를 만든다. */
export function makeDocumentNumber(prefix: string, date: string): string {
  const compact = date.replaceAll('-', '') || '00000000';
  return `${prefix}-${compact}-001`;
}

/** 자동 생성 번호의 접두사만 바꾼다. 형식이 다르면 그대로 둔다. */
export function replaceDocumentPrefix(value: string, prefix: string): string {
  const match = /^([A-Z0-9가-힣]+)-(\d{8}-\d+)$/.exec(value.trim().toUpperCase());
  if (!match) return value;
  return `${prefix}-${match[2]}`;
}
