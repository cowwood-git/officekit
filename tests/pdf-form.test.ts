import { describe, expect, it } from 'vitest';
import {
  fieldTypeLabel,
  formFileName,
  isBlankFormValue,
  needsUnicodeFont,
  normalizeFieldValue,
} from '../src/lib/pdf-form';

describe('needsUnicodeFont', () => {
  it('한글·특수문자를 감지한다', () => {
    expect(needsUnicodeFont(['김오피스'])).toBe(true);
    expect(needsUnicodeFont(['OfficeKit 2026'])).toBe(false);
    expect(needsUnicodeFont([['개발', '영업']])).toBe(true);
    expect(needsUnicodeFont(['€uro'])).toBe(true);
  });
});

describe('isBlankFormValue', () => {
  it('빈 문자열·배열·체크 해제를 판단한다', () => {
    expect(isBlankFormValue('')).toBe(true);
    expect(isBlankFormValue('  ')).toBe(true);
    expect(isBlankFormValue([])).toBe(true);
    expect(isBlankFormValue([''])).toBe(true);
    expect(isBlankFormValue(false)).toBe(true);
    expect(isBlankFormValue('김')).toBe(false);
    expect(isBlankFormValue(true)).toBe(false);
  });
});

describe('fieldTypeLabel', () => {
  it('한국어 라벨을 준다', () => {
    expect(fieldTypeLabel('text')).toBe('텍스트');
    expect(fieldTypeLabel('dropdown')).toBe('드롭다운');
  });
});

describe('normalizeFieldValue', () => {
  it('CRLF를 LF로 바꾼다', () => {
    expect(normalizeFieldValue('a\r\nb')).toBe('a\nb');
  });
});

describe('formFileName', () => {
  it('결과 파일명을 만든다', () => {
    expect(formFileName('신청서.pdf')).toBe('신청서-filled.pdf');
  });
});
