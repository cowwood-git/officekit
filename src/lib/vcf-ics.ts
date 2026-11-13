/**
 * VCF(vCard)·ICS(iCalendar) 텍스트 파서.
 * 서버 전송 없이 브라우저에서 연락처와 일정을 읽기 위한 최소 구현이다.
 * 반복 일정(RRULE)은 전개하지 않고 원문을 보여 준다.
 */

export interface Contact {
  name: string;
  phones: string[];
  emails: string[];
  org?: string;
  title?: string;
  address?: string;
  note?: string;
}

export interface DateInfo {
  text: string;
  sort: number;
  allDay: boolean;
}

export interface CalendarEvent {
  summary: string;
  start?: DateInfo;
  end?: DateInfo;
  location?: string;
  description?: string;
  rrule?: string;
  status?: string;
}

export interface ParsedFile {
  kind: 'vcf' | 'ics' | 'both' | 'unknown';
  contacts: Contact[];
  events: CalendarEvent[];
  warnings: string[];
}

interface Property {
  name: string;
  params: Map<string, string>;
  value: string;
}

const utf8 = new TextDecoder('utf-8');
const utf8Fatal = new TextDecoder('utf-8', { fatal: true });

/** UTF-8을 우선 시도하고, 실패하면 EUC-KR로 읽는다. */
export function decodeText(bytes: Uint8Array): string {
  try {
    return utf8Fatal.decode(bytes).replace(/^\uFEFF/, '');
  } catch {
    try {
      return new TextDecoder('euc-kr').decode(bytes).replace(/^\uFEFF/, '');
    } catch {
      return utf8.decode(bytes).replace(/^\uFEFF/, '');
    }
  }
}

function unfold(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/=\n/g, '')
    .replace(/\n[ \t]/g, '');
}

function unescapeValue(value: string): string {
  return value.replace(/\\([\\,;nN])/g, (_, char: string) => {
    if (char === 'n' || char === 'N') return '\n';
    return char;
  });
}

function parseProperty(line: string): Property | null {
  const colon = line.indexOf(':');
  if (colon <= 0) return null;
  const left = line.slice(0, colon);
  const raw = line.slice(colon + 1);
  const parts = left.split(';');
  const name = (parts.shift() ?? '').split('.').pop()?.toUpperCase() ?? '';
  if (!name) return null;
  const params = new Map<string, string>();
  for (const part of parts) {
    const [key, ...rest] = part.split('=');
    if (!key) continue;
    params.set(key.toUpperCase(), rest.join('=').replace(/^"|"$/g, ''));
  }
  let value = raw;
  if (params.get('ENCODING')?.toUpperCase() === 'QUOTED-PRINTABLE') {
    value = decodeQuotedPrintable(raw, params.get('CHARSET') ?? 'utf-8');
  }
  return { name, params, value };
}

function decodeQuotedPrintable(value: string, charset: string): string {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '=' && /^[0-9A-Fa-f]{2}$/.test(value.slice(index + 1, index + 3))) {
      bytes.push(Number.parseInt(value.slice(index + 1, index + 3), 16));
      index += 2;
    } else {
      const char = value[index] ?? '';
      for (const byte of new TextEncoder().encode(char)) bytes.push(byte);
    }
  }
  try {
    return new TextDecoder(charset).decode(new Uint8Array(bytes));
  } catch {
    return utf8.decode(new Uint8Array(bytes));
  }
}

function parseProperties(block: string): Property[] {
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^BEGIN:/i.test(line) && !/^END:/i.test(line))
    .map(parseProperty)
    .filter((property): property is Property => property !== null);
}

function first(properties: Property[], name: string): string | undefined {
  return properties.find((property) => property.name === name)?.value.trim();
}

function all(properties: Property[], name: string): string[] {
  return properties
    .filter((property) => property.name === name)
    .map((property) => property.value.trim())
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function displayName(properties: Property[]): string {
  const full = first(properties, 'FN');
  if (full) return unescapeValue(full);
  const structured = first(properties, 'N');
  if (!structured) return '(이름 없음)';
  const parts = structured.split(';').map(unescapeValue);
  const family = parts[0] ?? '';
  const given = parts[1] ?? '';
  if (!family && !given) return '(이름 없음)';
  const korean = /[\uAC00-\uD7A3]/.test(family + given);
  return korean ? `${family}${given}` : [given, family].filter(Boolean).join(' ');
}

export function parseVcf(text: string): Contact[] {
  const contacts: Contact[] = [];
  for (const block of unfold(text)
    .split(/BEGIN:VCARD/i)
    .slice(1)) {
    const content = block.split(/END:VCARD/i)[0] ?? '';
    const properties = parseProperties(content);
    if (properties.length === 0) continue;
    const company = first(properties, 'ORG');
    const address = first(properties, 'ADR');
    contacts.push({
      name: displayName(properties),
      phones: unique(all(properties, 'TEL').map(unescapeValue)),
      emails: unique(all(properties, 'EMAIL').map(unescapeValue)),
      org: company ? unescapeValue(company).split(';').filter(Boolean).join(' · ') : undefined,
      title: first(properties, 'TITLE')
        ? unescapeValue(first(properties, 'TITLE') ?? '')
        : undefined,
      address: address
        ? unescapeValue(address)
            .split(';')
            .map((part) => part.trim())
            .filter(Boolean)
            .join(' ')
        : undefined,
      note: first(properties, 'NOTE') ? unescapeValue(first(properties, 'NOTE') ?? '') : undefined,
    });
  }
  return contacts;
}

function formatDate(date: Date, allDay: boolean): string {
  const formatted = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    ...(allDay ? {} : { hour: '2-digit', minute: '2-digit' }),
  }).format(date);
  return formatted;
}

export function parseIcsDate(value: string | undefined): DateInfo | undefined {
  if (!value) return undefined;
  const raw = value.trim();
  const allDay = /^\d{8}$/.test(raw);
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second, zulu] = match;
  const numbers = [year, month, day, hour ?? '0', minute ?? '0', second ?? '0'].map(Number);
  const [y, m, d, h, min, s] = numbers as [number, number, number, number, number, number];
  const date = zulu ? new Date(Date.UTC(y, m - 1, d, h, min, s)) : new Date(y, m - 1, d, h, min, s);
  if (Number.isNaN(date.getTime())) return undefined;
  return { text: formatDate(date, allDay), sort: date.getTime(), allDay };
}

export function parseIcs(text: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const block of unfold(text)
    .split(/BEGIN:VEVENT/i)
    .slice(1)) {
    const content = block.split(/END:VEVENT/i)[0] ?? '';
    const properties = parseProperties(content);
    if (properties.length === 0) continue;
    const start = parseIcsDate(first(properties, 'DTSTART'));
    const end = parseIcsDate(first(properties, 'DTEND'));
    events.push({
      summary: first(properties, 'SUMMARY')
        ? unescapeValue(first(properties, 'SUMMARY') ?? '')
        : '(제목 없음)',
      start,
      end,
      location: first(properties, 'LOCATION')
        ? unescapeValue(first(properties, 'LOCATION') ?? '')
        : undefined,
      description: first(properties, 'DESCRIPTION')
        ? unescapeValue(first(properties, 'DESCRIPTION') ?? '')
        : undefined,
      rrule: first(properties, 'RRULE'),
      status: first(properties, 'STATUS'),
    });
  }
  return events.sort(
    (a, b) =>
      (a.start?.sort ?? Number.POSITIVE_INFINITY) - (b.start?.sort ?? Number.POSITIVE_INFINITY),
  );
}

export function parseVcfIcs(text: string): ParsedFile {
  const hasVcard = /BEGIN:VCARD/i.test(text);
  const hasEvent = /BEGIN:VEVENT/i.test(text);
  const contacts = hasVcard ? parseVcf(text) : [];
  const events = hasEvent ? parseIcs(text) : [];
  const warnings: string[] = [];
  if (!hasVcard && !hasEvent) warnings.push('VCF(VCard) 또는 ICS(iCalendar) 파일이 아닙니다.');
  else if (contacts.length === 0 && events.length === 0)
    warnings.push('연락처나 일정을 찾지 못했습니다.');
  const kind = hasVcard && hasEvent ? 'both' : hasVcard ? 'vcf' : hasEvent ? 'ics' : 'unknown';
  return { kind, contacts, events, warnings };
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function contactsToCsv(contacts: Contact[]): string {
  return toCsv([
    ['이름', '전화', '이메일', '회사', '직함', '주소', '메모'],
    ...contacts.map((contact) => [
      contact.name,
      contact.phones.join(' / '),
      contact.emails.join(' / '),
      contact.org ?? '',
      contact.title ?? '',
      contact.address ?? '',
      contact.note ?? '',
    ]),
  ]);
}

export function eventsToCsv(events: CalendarEvent[]): string {
  return toCsv([
    ['일정', '시작', '종료', '장소', '설명', '반복', '상태'],
    ...events.map((event) => [
      event.summary,
      event.start?.text ?? '',
      event.end?.text ?? '',
      event.location ?? '',
      event.description ?? '',
      event.rrule ?? '',
      event.status ?? '',
    ]),
  ]);
}

// ── 만들기(직렬화) ─────────────────────────────────────────────
// 읽기 파서와 같은 파일에 두어 vCard·ICS 규칙을 한곳에서 관리한다.

export interface VCardInput {
  name: string;
  org?: string;
  title?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
}

export interface IcsEventInput {
  summary: string;
  /** YYYY-MM-DD */
  start: string;
  /** YYYY-MM-DD. 비우면 start와 같다. */
  end?: string;
  /** HH:MM. 종일 일정이면 비운다. */
  startTime?: string;
  /** HH:MM. 종일 일정이면 비운다. */
  endTime?: string;
  allDay: boolean;
  location?: string;
  description?: string;
  url?: string;
  /** 5·10·15·30·60분 전 알림. null/0이면 알림 없음. */
  reminderMinutes?: number | null;
}

const encoder = new TextEncoder();

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/** 75옥텟 규칙에 맞춰 줄을 접는다. 이어지는 줄은 공백으로 시작한다. */
function foldLine(line: string): string {
  if (!line) return '';
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 73 && current) {
      parts.push(current);
      current = ` ${char}`;
      bytes = 1 + size;
    } else {
      current += char;
      bytes += size;
    }
  }
  parts.push(current);
  return parts.join('\r\n');
}

/** 연락처 한 명을 vCard 3.0 텍스트로 만든다. */
export function serializeVCard(contact: VCardInput): string {
  const name = contact.name.trim() || '연락처';
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:;${escapeText(name)};;;`,
    `FN:${escapeText(name)}`,
  ];
  if (contact.org?.trim()) lines.push(`ORG:${escapeText(contact.org.trim())}`);
  if (contact.title?.trim()) lines.push(`TITLE:${escapeText(contact.title.trim())}`);
  if (contact.phone?.trim()) lines.push(`TEL;TYPE=CELL:${escapeText(contact.phone.trim())}`);
  if (contact.email?.trim()) lines.push(`EMAIL;TYPE=INTERNET:${escapeText(contact.email.trim())}`);
  if (contact.address?.trim())
    lines.push(`ADR;TYPE=WORK:;;${escapeText(contact.address.trim())};;;;`);
  if (contact.note?.trim()) lines.push(`NOTE:${escapeText(contact.note.trim())}`);
  lines.push('END:VCARD');
  return lines.map(foldLine).join('\r\n');
}

export function serializeVCardFile(contacts: readonly VCardInput[]): string {
  if (contacts.length === 0) throw new Error('연락처를 하나 이상 입력하세요.');
  return `${contacts.map(serializeVCard).join('\r\n')}\r\n`;
}

export function vCardFileName(date = new Date()): string {
  return `연락처-${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}.vcf`;
}

function parseDate(value: string): [number, number, number] | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compactDate(value: string): string {
  const parts = parseDate(value);
  if (!parts) throw new Error('날짜 형식이 올바르지 않습니다.');
  return `${parts[0]}${pad2(parts[1])}${pad2(parts[2])}`;
}

function addDays(value: string, days: number): string {
  const parts = parseDate(value);
  if (!parts) throw new Error('날짜 형식이 올바르지 않습니다.');
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function compactTime(value: string | undefined, label: string): string {
  const match = value?.match(/^(\d{2}):(\d{2})$/);
  if (!match) throw new Error(`${label} 시간을 입력하세요.`);
  return `${match[1]}${match[2]}00`;
}

function formatStamp(date: Date): string {
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`;
}

function makeUid(): string {
  const random = globalThis.crypto?.randomUUID?.();
  return random ? `${random}@otgit` : `${Date.now()}-${Math.random().toString(36).slice(2)}@otgit`;
}

/** 일정 하나를 VEVENT 텍스트로 만든다. */
export function serializeIcsEvent(
  event: IcsEventInput,
  options: { uid?: string; stamp?: Date } = {},
): string {
  const summary = event.summary.trim() || '일정';
  const startDate = compactDate(event.start);
  const endDateRaw = event.end?.trim() || event.start;
  const endDate = compactDate(endDateRaw);
  if (endDate < startDate) throw new Error('종료일이 시작일보다 빠릅니다.');

  const lines = [
    'BEGIN:VEVENT',
    `UID:${options.uid ?? makeUid()}`,
    `DTSTAMP:${formatStamp(options.stamp ?? new Date())}`,
  ];

  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${startDate}`);
    lines.push(`DTEND;VALUE=DATE:${compactDate(addDays(endDateRaw, 1))}`);
  } else {
    const startTime = compactTime(event.startTime, '시작');
    const endTime = compactTime(event.endTime, '종료');
    const start = `${startDate}T${startTime}`;
    const end = `${endDate}T${endTime}`;
    if (end <= start) throw new Error('종료 시간이 시작 시간보다 빠릅니다.');
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
  }

  lines.push(`SUMMARY:${escapeText(summary)}`);
  if (event.location?.trim()) lines.push(`LOCATION:${escapeText(event.location.trim())}`);
  if (event.description?.trim()) lines.push(`DESCRIPTION:${escapeText(event.description.trim())}`);
  if (event.url?.trim()) lines.push(`URL:${event.url.trim()}`);

  const reminder = event.reminderMinutes ?? 0;
  if (reminder > 0) {
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push('DESCRIPTION:일정 알림');
    lines.push(`TRIGGER:-PT${Math.round(reminder)}M`);
    lines.push('END:VALARM');
  }

  lines.push('END:VEVENT');
  return lines.map(foldLine).join('\r\n');
}

export function serializeIcsFile(events: readonly IcsEventInput[]): string {
  if (events.length === 0) throw new Error('일정을 하나 이상 입력하세요.');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//옷깃//ICS Maker//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.map((event) => serializeIcsEvent(event)),
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}

export function icsFileName(date = new Date()): string {
  return `일정-${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}.ics`;
}
