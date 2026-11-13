export interface ScanResult {
  text: string;
  format: string;
  at: number;
}

const NULL_CHAR = String.fromCharCode(0);

export function normalizeScan(text: string): string {
  return text.split(NULL_CHAR).join('').trim();
}

export function isHttpUrl(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const FORMAT_LABELS: Record<string, string> = {
  qr_code: 'QR 코드',
  ean_13: 'EAN-13',
  ean_8: 'EAN-8',
  code_128: 'Code 128',
  code_39: 'Code 39',
  code_93: 'Code 93',
  upc_a: 'UPC-A',
  upc_e: 'UPC-E',
  itf: 'ITF',
  codabar: 'Codabar',
  data_matrix: 'Data Matrix',
  pdf417: 'PDF417',
  aztec: 'Aztec',
};

export function formatLabel(format: string): string {
  return FORMAT_LABELS[format] ?? format.toUpperCase();
}

/** 최근 인식 목록에 추가하고 최대 max개만 유지한다. */
export function pushRecent(list: ScanResult[], item: ScanResult, max = 5): ScanResult[] {
  const filtered = list.filter((entry) => entry.text !== item.text);
  return [item, ...filtered].slice(0, max);
}
