import { describe, expect, it } from 'vitest';
import {
  MAX_QR_ITEMS,
  qrItemsFromTable,
  qrItemsFromText,
  qrZipFileName,
  sanitizeQrFileName,
  uniqueQrFileNames,
} from '../src/lib/qr-batch';

describe('QR 배치', () => {
  it('줄 단위 내용을 읽고 빈 줄을 버린다', () => {
    const items = qrItemsFromText('https://a.com\n\n 두 번째 \n');
    expect(items).toEqual([
      { content: 'https://a.com', name: '' },
      { content: '두 번째', name: '' },
    ]);
  });

  it('CSV 머리글과 파일 이름 열을 읽는다', () => {
    const items = qrItemsFromTable([
      ['내용', '파일명'],
      ['https://a.com', '홈페이지'],
      ['https://b.com', ''],
      ['', '빈 내용'],
    ]);
    expect(items).toEqual([
      { content: 'https://a.com', name: '홈페이지' },
      { content: 'https://b.com', name: '' },
    ]);
  });

  it('머리글이 없으면 첫 행부터 읽는다', () => {
    const items = qrItemsFromTable([['https://a.com', 'a'], ['https://b.com']]);
    expect(items).toHaveLength(2);
  });

  it('파일 이름을 안전하게 정리한다', () => {
    expect(sanitizeQrFileName('  홈페이지.png ', 0)).toBe('홈페이지.png');
    expect(sanitizeQrFileName('a/b:c', 0)).toBe('a_b_c.png');
    expect(sanitizeQrFileName('', 3)).toBe('qr-004.png');
  });

  it('중복 파일 이름에 번호를 붙인다', () => {
    const names = uniqueQrFileNames([
      { content: 'a', name: 'qr' },
      { content: 'b', name: 'qr' },
      { content: 'c', name: 'qr' },
    ]);
    expect(names).toEqual(['qr.png', 'qr (1).png', 'qr (2).png']);
  });

  it('최대 개수와 ZIP 이름을 지킨다', () => {
    const items = qrItemsFromText(
      Array.from({ length: MAX_QR_ITEMS + 10 }, (_, index) => `item-${index}`).join('\n'),
    );
    expect(items).toHaveLength(MAX_QR_ITEMS);
    expect(qrZipFileName(new Date(2026, 10, 13))).toBe('QR-코드-20261113.zip');
  });
});
