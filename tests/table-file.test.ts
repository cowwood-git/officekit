import { describe, expect, it } from 'vitest';
import { decodeDelimited, isDelimitedFile } from '../src/lib/table-file';

describe('decodeDelimited', () => {
  it('UTF-8 한글을 읽는다', () => {
    const bytes = new TextEncoder().encode('이름,부서\n김오피스,개발');
    expect(decodeDelimited(bytes)).toBe('이름,부서\n김오피스,개발');
  });

  it('EUC-KR 한글을 읽는다', () => {
    const bytes = new Uint8Array([0xb0, 0xa1, 0xb3, 0xaa]);
    expect(decodeDelimited(bytes)).toBe('가나');
  });
});

describe('isDelimitedFile', () => {
  it('CSV·TSV를 구분한다', () => {
    expect(isDelimitedFile('a.csv')).toBe(true);
    expect(isDelimitedFile('a.TSV')).toBe(true);
    expect(isDelimitedFile('a.xlsx')).toBe(false);
  });
});
