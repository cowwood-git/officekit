/** 라벨·봉투 인쇄 — A4 라벨 시트와 주소 데이터를 다루는 순수 계산. */

export interface LabelRow {
  name: string;
  postal: string;
  address: string;
  phone: string;
}

export interface LabelSheet {
  pageWidthMm: number;
  pageHeightMm: number;
  columns: number;
  rows: number;
  marginXMm: number;
  marginYMm: number;
  gapXMm: number;
  gapYMm: number;
}

export interface LabelRect {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export interface LabelPreset extends LabelSheet {
  id: string;
  label: string;
  note: string;
}

export const MAX_LABELS = 200;

export const LABEL_PRESETS: LabelPreset[] = [
  {
    id: 'sheet-3x8',
    label: 'A4 3×8 · 24칸',
    note: '주소 라벨·이름표에 많이 쓰는 규격',
    pageWidthMm: 210,
    pageHeightMm: 297,
    columns: 3,
    rows: 8,
    marginXMm: 7.75,
    marginYMm: 7.65,
    gapXMm: 2,
    gapYMm: 1.5,
  },
  {
    id: 'sheet-2x6',
    label: 'A4 2×6 · 12칸',
    note: '큰 주소 라벨·택배 라벨',
    pageWidthMm: 210,
    pageHeightMm: 297,
    columns: 2,
    rows: 6,
    marginXMm: 4.9,
    marginYMm: 16.6,
    gapXMm: 2,
    gapYMm: 2,
  },
  {
    id: 'envelope-dl',
    label: 'DL 봉투 · 1칸',
    note: '220×110mm 봉투에 바로 인쇄',
    pageWidthMm: 220,
    pageHeightMm: 110,
    columns: 1,
    rows: 1,
    marginXMm: 12,
    marginYMm: 12,
    gapXMm: 0,
    gapYMm: 0,
  },
  {
    id: 'custom',
    label: '사용자 지정 · A4',
    note: '행·열·여백·간격을 직접 맞춤',
    pageWidthMm: 210,
    pageHeightMm: 297,
    columns: 3,
    rows: 8,
    marginXMm: 10,
    marginYMm: 10,
    gapXMm: 2,
    gapYMm: 2,
  },
];

export function presetById(id: string): LabelPreset {
  const found = LABEL_PRESETS.find((preset) => preset.id === id);
  if (found) return found;
  const fallback = LABEL_PRESETS[0];
  if (!fallback) throw new Error('라벨 프리셋이 없습니다.');
  return fallback;
}

export function customSheet(input: {
  columns: number;
  rows: number;
  marginMm: number;
  gapMm: number;
}): LabelSheet {
  const columns = Math.min(8, Math.max(1, Math.trunc(input.columns) || 1));
  const rows = Math.min(12, Math.max(1, Math.trunc(input.rows) || 1));
  const margin = Math.min(30, Math.max(0, input.marginMm || 0));
  const gap = Math.min(10, Math.max(0, input.gapMm || 0));
  return {
    pageWidthMm: 210,
    pageHeightMm: 297,
    columns,
    rows,
    marginXMm: margin,
    marginYMm: margin,
    gapXMm: gap,
    gapYMm: gap,
  };
}

export function labelSize(sheet: LabelSheet): { widthMm: number; heightMm: number } {
  const usableWidth = sheet.pageWidthMm - sheet.marginXMm * 2 - sheet.gapXMm * (sheet.columns - 1);
  const usableHeight = sheet.pageHeightMm - sheet.marginYMm * 2 - sheet.gapYMm * (sheet.rows - 1);
  return {
    widthMm: Math.max(1, usableWidth / sheet.columns),
    heightMm: Math.max(1, usableHeight / sheet.rows),
  };
}

export function labelsPerPage(sheet: LabelSheet): number {
  return Math.max(1, sheet.columns * sheet.rows);
}

/** 왼쪽 위 기준(mm) 라벨 위치. PDF에서는 y를 뒤집어 쓴다. */
export function labelRects(sheet: LabelSheet): LabelRect[] {
  const size = labelSize(sheet);
  const rects: LabelRect[] = [];
  for (let row = 0; row < sheet.rows; row += 1) {
    for (let column = 0; column < sheet.columns; column += 1) {
      rects.push({
        xMm: sheet.marginXMm + column * (size.widthMm + sheet.gapXMm),
        yMm: sheet.marginYMm + row * (size.heightMm + sheet.gapYMm),
        widthMm: size.widthMm,
        heightMm: size.heightMm,
      });
    }
  }
  return rects;
}

/** 시작 위치(1부터)를 반영해 페이지별 슬롯을 만든다. 빈 슬롯은 null. */
export function pagesFor(
  rows: readonly LabelRow[],
  sheet: LabelSheet,
  startOffset = 1,
): Array<Array<LabelRow | null>> {
  const perPage = labelsPerPage(sheet);
  if (rows.length === 0) return [];
  const offset = Math.min(perPage - 1, Math.max(0, Math.trunc(startOffset) - 1));
  const pages: Array<Array<LabelRow | null>> = [];
  let index = 0;
  let first = true;

  while (index < rows.length) {
    const page: Array<LabelRow | null> = Array.from({ length: perPage }, () => null);
    const start = first ? offset : 0;
    for (let slot = start; slot < perPage && index < rows.length; slot += 1) {
      page[slot] = rows[index] ?? null;
      index += 1;
    }
    pages.push(page);
    first = false;
  }
  return pages;
}

const HEADER_KEYS = {
  name: ['이름', '성명', '받는사람', '수령인', 'name', 'recipient'],
  postal: ['우편번호', '우편', 'postal', 'zip'],
  address: ['주소', '배송지', 'address', 'addr'],
  phone: ['연락처', '전화', '휴대폰', 'phone', 'tel', 'mobile'],
} as const;

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

function findColumn(header: readonly string[], keys: readonly string[]): number | undefined {
  const index = header.findIndex((cell) =>
    keys.some((key) => normalizeHeader(cell).includes(normalizeHeader(key))),
  );
  return index >= 0 ? index : undefined;
}

export function hasHeaderRow(rows: readonly (readonly string[])[]): boolean {
  const first = rows[0];
  if (!first) return false;
  const allKeys = Object.values(HEADER_KEYS).flat();
  return first.some((cell) =>
    allKeys.some((key) => normalizeHeader(cell).includes(normalizeHeader(key))),
  );
}

export interface LabelTableResult {
  rows: LabelRow[];
  hasHeader: boolean;
}

/** CSV·XLSX 표를 라벨 행으로 바꾼다. 머리글이 있으면 열 이름으로 매핑한다. */
export function rowsFromTable(rows: readonly (readonly string[])[]): LabelTableResult {
  if (rows.length === 0) return { rows: [], hasHeader: false };
  const hasHeader = hasHeaderRow(rows);
  const header = hasHeader ? (rows[0] ?? []) : [];
  const data = hasHeader ? rows.slice(1) : rows;

  const noHeaderColumns = rows[0]?.length ?? 0;
  let nameIndex = hasHeader
    ? findColumn(header, HEADER_KEYS.name)
    : noHeaderColumns > 1
      ? 0
      : undefined;
  const postalIndex = hasHeader
    ? findColumn(header, HEADER_KEYS.postal)
    : noHeaderColumns >= 4
      ? 1
      : undefined;
  let addressIndex = hasHeader
    ? findColumn(header, HEADER_KEYS.address)
    : noHeaderColumns >= 4
      ? 2
      : noHeaderColumns > 1
        ? 1
        : 0;
  let phoneIndex = hasHeader
    ? findColumn(header, HEADER_KEYS.phone)
    : noHeaderColumns >= 4
      ? 3
      : noHeaderColumns > 2
        ? 2
        : undefined;

  const mappedNone =
    nameIndex === undefined &&
    postalIndex === undefined &&
    addressIndex === undefined &&
    phoneIndex === undefined;
  if (mappedNone) {
    nameIndex = 0;
    addressIndex = 1;
    phoneIndex = 2;
  }

  const labels: LabelRow[] = [];
  for (const row of data) {
    const label = {
      name: nameIndex === undefined ? '' : (row[nameIndex] ?? '').trim(),
      postal: postalIndex === undefined ? '' : (row[postalIndex] ?? '').trim(),
      address: addressIndex === undefined ? '' : (row[addressIndex] ?? '').trim(),
      phone: phoneIndex === undefined ? '' : (row[phoneIndex] ?? '').trim(),
    };
    if (!label.name && !label.postal && !label.address && !label.phone) continue;
    labels.push(label);
    if (labels.length >= MAX_LABELS) break;
  }

  return { rows: labels, hasHeader };
}

export function labelFileName(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `라벨-${date.getFullYear()}${month}${day}.pdf`;
}
