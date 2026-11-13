/** 바코드 생성 — 형식별 체크 디지트와 입력 검증을 화면과 공유한다. */

export type BarcodeFormat = 'CODE128' | 'GS1-128' | 'EAN13' | 'UPC' | 'EAN8' | 'CODE39' | 'ITF14';

export interface BarcodeFormatInfo {
  id: BarcodeFormat;
  label: string;
  note: string;
  placeholder: string;
  digits?: number;
}

export interface BarcodeRow {
  code: string;
  name: string;
  price: string;
}

export interface BarcodeCheck {
  ok: boolean;
  value: string;
  message?: string;
}

export const BARCODE_FORMATS: BarcodeFormatInfo[] = [
  {
    id: 'CODE128',
    label: 'Code 128',
    note: '내부 SKU·자산번호·사번처럼 자유로운 코드',
    placeholder: '예: OK-2026-001',
  },
  {
    id: 'GS1-128',
    label: 'GS1-128',
    note: 'AI 데이터 · |는 FNC1 구분자',
    placeholder: '(01)12345678901231|(10)LOT-001',
  },
  {
    id: 'EAN13',
    label: 'EAN-13',
    note: '상품 바코드 · 12자리 입력 시 체크 디지트 자동',
    placeholder: '예: 400638133393',
    digits: 13,
  },
  {
    id: 'UPC',
    label: 'UPC-A',
    note: '북미 상품 바코드 · 11자리 입력 시 체크 디지트 자동',
    placeholder: '예: 03600029145',
    digits: 12,
  },
  {
    id: 'EAN8',
    label: 'EAN-8',
    note: '작은 상품용 8자리 바코드',
    placeholder: '예: 9638507',
    digits: 8,
  },
  {
    id: 'CODE39',
    label: 'Code 39',
    note: '영문·숫자·일부 기호 · 사번·티켓',
    placeholder: '예: ASSET-001',
  },
  {
    id: 'ITF14',
    label: 'ITF-14',
    note: '골판지 상자·물류 포장용 14자리',
    placeholder: '예: 1001234500001',
    digits: 14,
  },
];

export const MAX_BARCODE_ROWS = 200;

export function formatInfo(format: BarcodeFormat): BarcodeFormatInfo {
  const found = BARCODE_FORMATS.find((item) => item.id === format);
  if (found) return found;
  const fallback = BARCODE_FORMATS[0];
  if (!fallback) throw new Error('바코드 형식이 없습니다.');
  return fallback;
}

/** EAN·UPC·ITF 계열의 체크 디지트. payload는 체크 디지트를 뺀 숫자열. */
export function checkDigit(payload: string): number {
  const digits = payload.replace(/\D/g, '');
  let sum = 0;
  for (let index = digits.length - 1, weight = 3; index >= 0; index -= 1, weight = 4 - weight) {
    sum += Number(digits[index] ?? 0) * weight;
  }
  return (10 - (sum % 10)) % 10;
}

const FNC1 = String.fromCharCode(207);

/** GS1-128: (AI)데이터를 붙여 쓰고, 변수 길이 필드 사이나 |를 FNC1로 바꾼다. */
function normalizeGs1(raw: string): BarcodeCheck {
  const fields = raw
    .split('|')
    .map((field) => field.trim())
    .filter(Boolean);
  if (fields.length === 0) {
    return { ok: false, value: raw, message: 'GS1-128 AI 데이터를 입력하세요.' };
  }

  const encodedFields: string[] = [];
  for (const field of fields) {
    const groups = [...field.matchAll(/\((\d{2,4})\)([^()]*)/g)];
    if (groups.length === 0) {
      if (!/^[\x20-\x7E]+$/.test(field)) {
        return { ok: false, value: raw, message: 'GS1-128은 영문·숫자·기호만 사용할 수 있습니다.' };
      }
      encodedFields.push(field);
      continue;
    }

    const parts: string[] = [];
    for (const group of groups) {
      const ai = group[1] ?? '';
      let data = (group[2] ?? '').trim();
      if (!/^\d{2,4}$/.test(ai)) {
        return { ok: false, value: raw, message: 'AI는 2~4자리 숫자로 입력하세요.' };
      }
      if (!/^[\x20-\x7E]*$/.test(data)) {
        return {
          ok: false,
          value: raw,
          message: 'AI 데이터는 영문·숫자·기호만 사용할 수 있습니다.',
        };
      }
      if (ai === '00' || ai === '01' || ai === '02') {
        const expected = ai === '00' ? 18 : 14;
        const digits = data.replace(/\D/g, '');
        if (digits.length === expected - 1) {
          data = `${digits}${checkDigit(digits)}`;
        } else if (digits.length === expected) {
          const expectedDigit = checkDigit(digits.slice(0, -1));
          if (Number(digits.slice(-1)) !== expectedDigit) {
            return {
              ok: false,
              value: raw,
              message: `AI ${ai} 체크 디지트가 맞지 않습니다. 끝자리는 ${expectedDigit}여야 합니다.`,
            };
          }
          data = digits;
        } else {
          return {
            ok: false,
            value: raw,
            message: `AI ${ai}는 숫자 ${expected - 1}자리(체크 디지트 포함 ${expected}자리)로 입력하세요.`,
          };
        }
      }
      parts.push(`${ai}${data}`);
    }
    encodedFields.push(parts.join(''));
  }

  return {
    ok: true,
    value: encodedFields.join(FNC1),
    message: 'GS1-128 · FNC1 구분자를 적용했습니다.',
  };
}

function normalizeNumeric(value: string, payloadLength: number, label: string): BarcodeCheck {
  const digits = value.replace(/\D/g, '');
  if (digits.length === payloadLength) {
    return {
      ok: true,
      value: `${digits}${checkDigit(digits)}`,
      message: `체크 디지트 ${checkDigit(digits)}를 자동으로 붙였습니다.`,
    };
  }
  if (digits.length === payloadLength + 1) {
    const payload = digits.slice(0, payloadLength);
    const expected = checkDigit(payload);
    const actual = Number(digits.slice(-1));
    if (actual === expected) return { ok: true, value: digits, message: '체크 디지트가 맞습니다.' };
    return {
      ok: false,
      value: digits,
      message: `${label} 체크 디지트가 맞지 않습니다. 끝자리는 ${expected}여야 합니다.`,
    };
  }
  return {
    ok: false,
    value: digits,
    message: `${label}는 숫자 ${payloadLength}자리(체크 디지트 포함 ${payloadLength + 1}자리)로 입력하세요.`,
  };
}

export function normalizeBarcode(value: string, format: BarcodeFormat): BarcodeCheck {
  const raw = value.trim();
  if (!raw) return { ok: false, value: '', message: '바코드 값을 입력하세요.' };

  if (format === 'CODE128') {
    if (!/^[\x20-\x7E]+$/.test(raw)) {
      return { ok: false, value: raw, message: 'Code 128은 영문·숫자·기호만 사용할 수 있습니다.' };
    }
    return { ok: true, value: raw };
  }

  if (format === 'GS1-128') return normalizeGs1(raw);

  if (format === 'CODE39') {
    const upper = raw.toUpperCase();
    if (!/^[0-9A-Z\-. $/+%]+$/.test(upper)) {
      return {
        ok: false,
        value: upper,
        message: 'Code 39은 영문 대문자·숫자·- . 공백 $ / + %만 사용할 수 있습니다.',
      };
    }
    return { ok: true, value: upper };
  }

  if (format === 'EAN13') return normalizeNumeric(raw, 12, 'EAN-13');
  if (format === 'UPC') return normalizeNumeric(raw, 11, 'UPC-A');
  if (format === 'EAN8') return normalizeNumeric(raw, 7, 'EAN-8');
  return normalizeNumeric(raw, 13, 'ITF-14');
}

export function barcodeFileName(value: string, extension: 'png' | 'svg'): string {
  const printable = Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code <= 126;
    })
    .join('');
  const safe = printable.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) || 'barcode';
  return `${safe}.${extension}`;
}

export function barcodeZipFileName(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `바코드-${date.getFullYear()}${month}${day}.zip`;
}

export function barcodeLabelFileName(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `바코드-라벨-${date.getFullYear()}${month}${day}.pdf`;
}

const CODE_KEYS = ['코드', '바코드', 'code', 'barcode', 'sku'];
const NAME_KEYS = ['상품명', '이름', '품명', 'name', 'product'];
const PRICE_KEYS = ['가격', '판매가', '금액', 'price'];

function norm(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

function findColumn(header: readonly string[], keys: readonly string[]): number | undefined {
  const index = header.findIndex((cell) => keys.some((key) => norm(cell) === norm(key)));
  return index >= 0 ? index : undefined;
}

export function hasHeaderRow(rows: readonly (readonly string[])[]): boolean {
  const first = rows[0];
  if (!first) return false;
  return first.some((cell) =>
    [...CODE_KEYS, ...NAME_KEYS, ...PRICE_KEYS].some((key) => norm(cell) === norm(key)),
  );
}

export function barcodeRowsFromTable(rows: readonly (readonly string[])[]): {
  rows: BarcodeRow[];
  hasHeader: boolean;
} {
  if (rows.length === 0) return { rows: [], hasHeader: false };
  const hasHeader = hasHeaderRow(rows);
  const header = hasHeader ? (rows[0] ?? []) : [];
  const data = hasHeader ? rows.slice(1) : rows;
  const codeIndex = hasHeader ? findColumn(header, CODE_KEYS) : 0;
  const nameIndex = hasHeader ? findColumn(header, NAME_KEYS) : 1;
  const priceIndex = hasHeader ? findColumn(header, PRICE_KEYS) : 2;

  const result: BarcodeRow[] = [];
  for (const row of data) {
    const code = codeIndex === undefined ? '' : (row[codeIndex] ?? '').trim();
    if (!code) continue;
    result.push({
      code,
      name: nameIndex === undefined ? '' : (row[nameIndex] ?? '').trim(),
      price: priceIndex === undefined ? '' : (row[priceIndex] ?? '').trim(),
    });
    if (result.length >= MAX_BARCODE_ROWS) break;
  }
  return { rows: result, hasHeader };
}
