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
  micro_qr_code: 'Micro QR',
  rmqr_code: 'rMQR',
  databar: 'GS1 DataBar',
  maxicode: 'MaxiCode',
};

/** zxing-wasm 형식 이름 → BarcodeDetector 형식 키(같은 이름표를 쓰려고 맞춘다) */
const ZXING_FORMATS: Array<[RegExp, string]> = [
  [/^QRCode/, 'qr_code'],
  [/^MicroQRCode$/, 'micro_qr_code'],
  [/^RMQRCode$/, 'rmqr_code'],
  [/^EAN13$/, 'ean_13'],
  [/^EAN8$/, 'ean_8'],
  [/^UPCA$/, 'upc_a'],
  [/^UPCE$/, 'upc_e'],
  [/^Code128$/, 'code_128'],
  [/^Code39/, 'code_39'],
  [/^Code93$/, 'code_93'],
  [/^ITF/, 'itf'],
  [/^Codabar$/, 'codabar'],
  [/^DataMatrix$/, 'data_matrix'],
  [/PDF417$/, 'pdf417'],
  [/^Aztec/, 'aztec'],
  [/^DataBar/, 'databar'],
  [/^MaxiCode$/, 'maxicode'],
];

export function fromZxingFormat(format: string): string {
  return ZXING_FORMATS.find(([pattern]) => pattern.test(format))?.[1] ?? format;
}

export function formatLabel(format: string): string {
  return FORMAT_LABELS[format] ?? format.toUpperCase();
}

/** 최근 인식 목록에 추가하고 최대 max개만 유지한다. */
export function pushRecent(list: ScanResult[], item: ScanResult, max = 5): ScanResult[] {
  const filtered = list.filter((entry) => entry.text !== item.text);
  return [item, ...filtered].slice(0, max);
}
