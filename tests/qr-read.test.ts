import { describe, expect, it } from 'vitest';
import {
  formatLabel,
  isHttpUrl,
  normalizeScan,
  pushRecent,
  type ScanResult,
} from '../src/lib/qr-read';

describe('normalizeScan', () => {
  it('널 문자와 앞뒤 공백을 제거한다', () => {
    expect(normalizeScan('\u0000 https://a.com \u0000')).toBe('https://a.com');
  });
});

describe('isHttpUrl', () => {
  it('http/https만 허용한다', () => {
    expect(isHttpUrl('https://officekit.kr')).toBe(true);
    expect(isHttpUrl('http://example.com/a')).toBe(true);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('mailto:a@b.com')).toBe(false);
    expect(isHttpUrl('그냥 텍스트')).toBe(false);
  });
});

describe('formatLabel', () => {
  it('알려진 형식은 한국어 라벨', () => {
    expect(formatLabel('qr_code')).toBe('QR 코드');
    expect(formatLabel('ean_13')).toBe('EAN-13');
    expect(formatLabel('custom')).toBe('CUSTOM');
  });
});

describe('pushRecent', () => {
  it('중복을 제거하고 최신순으로 유지한다', () => {
    const list = pushRecent([], { text: 'A', format: 'qr_code', at: 1 });
    const next = pushRecent(list, { text: 'B', format: 'qr_code', at: 2 });
    expect(next.map((item) => item.text)).toEqual(['B', 'A']);

    const again = pushRecent(next, { text: 'A', format: 'qr_code', at: 3 });
    expect(again.map((item) => item.text)).toEqual(['A', 'B']);
  });

  it('최대 개수를 넘으면 오래된 항목을 버린다', () => {
    let list: ScanResult[] = [];
    for (let index = 0; index < 7; index += 1) {
      list = pushRecent(list, { text: String(index), format: 'qr_code', at: index });
    }
    expect(list).toHaveLength(5);
    expect(list[0]?.text).toBe('6');
  });
});
