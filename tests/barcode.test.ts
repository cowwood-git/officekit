import { describe, expect, it } from 'vitest';
import {
  barcodeFileName,
  barcodeLabelFileName,
  barcodeRowsFromTable,
  barcodeZipFileName,
  checkDigit,
  normalizeBarcode,
} from '../src/lib/barcode';

describe('바코드', () => {
  it('EAN·UPC 체크 디지트를 계산한다', () => {
    expect(checkDigit('400638133393')).toBe(1);
    expect(checkDigit('03600029145')).toBe(2);
    expect(checkDigit('9638507')).toBe(4);
  });

  it('EAN-13 12자리에 체크 디지트를 붙인다', () => {
    const result = normalizeBarcode('400638133393', 'EAN13');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('4006381333931');
  });

  it('EAN-13 13자리의 체크 디지트를 검증한다', () => {
    expect(normalizeBarcode('4006381333931', 'EAN13').ok).toBe(true);
    expect(normalizeBarcode('4006381333932', 'EAN13').ok).toBe(false);
  });

  it('GS1-128 AI와 FNC1 구분자를 만든다', () => {
    const result = normalizeBarcode('(01)12345678901231|(10)LOT-001', 'GS1-128');
    expect(result.ok).toBe(true);
    expect(result.value).toBe(`0112345678901231${String.fromCharCode(207)}10LOT-001`);
    expect(normalizeBarcode('(01)12345678901232', 'GS1-128').ok).toBe(false);
  });

  it('Code 39는 대문자로 바꾼다', () => {
    const result = normalizeBarcode('asset-001', 'CODE39');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('ASSET-001');
    expect(normalizeBarcode('한글', 'CODE39').ok).toBe(false);
  });

  it('Code 128은 영문·숫자·기호만 허용한다', () => {
    expect(normalizeBarcode('OK-2026-001', 'CODE128').ok).toBe(true);
    expect(normalizeBarcode('한글', 'CODE128').ok).toBe(false);
  });

  it('CSV 머리글을 보고 코드·상품명·가격을 읽는다', () => {
    const result = barcodeRowsFromTable([
      ['바코드', '상품명', '가격'],
      ['8801234567890', '사과', '1,000'],
      ['', '빈 코드', '0'],
    ]);
    expect(result.hasHeader).toBe(true);
    expect(result.rows).toEqual([{ code: '8801234567890', name: '사과', price: '1,000' }]);
  });

  it('파일 이름을 만든다', () => {
    expect(barcodeFileName('OK/001', 'png')).toBe('OK_001.png');
    expect(barcodeFileName(`01${String.fromCharCode(207)}10LOT`, 'png')).toBe('0110LOT.png');
    expect(barcodeZipFileName(new Date(2026, 10, 13))).toBe('바코드-20261113.zip');
    expect(barcodeLabelFileName(new Date(2026, 10, 13))).toBe('바코드-라벨-20261113.pdf');
  });
});
