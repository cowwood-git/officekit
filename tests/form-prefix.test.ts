import { describe, expect, it } from 'vitest';
import { makeDocumentNumber, normalizePrefix, replaceDocumentPrefix } from '../src/lib/form-prefix';

describe('문서번호 접두사', () => {
  it('한글·영문·숫자만 남기고 6자로 자른다', () => {
    expect(normalizePrefix('ab-12')).toBe('AB12');
    expect(normalizePrefix('인사')).toBe('인사');
    expect(normalizePrefix('계약 2026')).toBe('계약2026');
    expect(normalizePrefix('abcdefgh')).toBe('ABCDEF');
    expect(normalizePrefix('  ')).toBe('');
  });

  it('문서번호를 만든다', () => {
    expect(makeDocumentNumber('HR', '2026-11-17')).toBe('HR-20261117-001');
    expect(makeDocumentNumber('인사', '2026-11-17')).toBe('인사-20261117-001');
  });

  it('자동 생성 번호의 접두사만 바꾼다', () => {
    expect(replaceDocumentPrefix('DV-20261117-001', '인사')).toBe('인사-20261117-001');
    expect(replaceDocumentPrefix('직접-입력', 'HR')).toBe('직접-입력');
  });
});
