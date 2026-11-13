/** QR 코드 대량 생성 — CSV 행과 파일 이름을 안전하게 정리한다. */

export interface QrItem {
  content: string;
  name: string;
}

export const MAX_QR_ITEMS = 200;
export const MAX_QR_CONTENT_LENGTH = 1000;

export const QR_SIZES = [256, 512, 1024] as const;
export const QR_ERROR_LEVELS = ['L', 'M', 'Q', 'H'] as const;

export type QrSize = (typeof QR_SIZES)[number];
export type QrErrorLevel = (typeof QR_ERROR_LEVELS)[number];

export function qrItemsFromText(text: string): QrItem[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_QR_ITEMS)
    .map((content) => ({ content, name: '' }));
}

const HEADER_WORDS = [
  '내용',
  'content',
  'url',
  '링크',
  '파일명',
  '파일이름',
  'filename',
  '이름',
  'name',
];

function isHeaderRow(row: readonly string[]): boolean {
  return row.some((cell) => {
    const value = cell.toLowerCase().replace(/\s+/g, '');
    return HEADER_WORDS.some((word) => value === word.toLowerCase());
  });
}

/** CSV·XLSX 표에서 첫 열은 내용, 둘째 열은 파일 이름으로 읽는다. */
export function qrItemsFromTable(rows: readonly (readonly string[])[]): QrItem[] {
  if (rows.length === 0) return [];
  const header = isHeaderRow(rows[0] ?? []);
  const data = header ? rows.slice(1) : rows;
  const items: QrItem[] = [];
  for (const row of data) {
    const content = (row[0] ?? '').trim();
    if (!content) continue;
    items.push({ content, name: (row[1] ?? '').trim() });
    if (items.length >= MAX_QR_ITEMS) break;
  }
  return items;
}

export function sanitizeQrFileName(name: string, index: number): string {
  const fallback = `qr-${String(index + 1).padStart(3, '0')}`;
  const sanitized = Array.from(
    name
      .trim()
      .replace(/\.png$/i, '')
      .replace(/^(\.+)/, '')
      .trim(),
  )
    .map((char) => (char.charCodeAt(0) < 32 || /[\\/:*?"<>|]/.test(char) ? '_' : char))
    .join('');
  const base = sanitized.slice(0, 80) || fallback;
  return `${base}.png`;
}

export function uniqueQrFileNames(items: readonly QrItem[]): string[] {
  const used = new Set<string>();
  return items.map((item, index) => {
    const base = sanitizeQrFileName(item.name, index);
    if (!used.has(base)) {
      used.add(base);
      return base;
    }
    const stem = base.slice(0, -4);
    let suffix = 1;
    let candidate = `${stem} (${suffix}).png`;
    while (used.has(candidate)) {
      suffix += 1;
      candidate = `${stem} (${suffix}).png`;
    }
    used.add(candidate);
    return candidate;
  });
}

export function qrZipFileName(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `QR-코드-${date.getFullYear()}${month}${day}.zip`;
}

export function isValidQrSize(value: number): value is QrSize {
  return (QR_SIZES as readonly number[]).includes(value);
}

export function isValidQrErrorLevel(value: string): value is QrErrorLevel {
  return (QR_ERROR_LEVELS as readonly string[]).includes(value);
}
