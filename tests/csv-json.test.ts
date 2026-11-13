import { describe, expect, it } from 'vitest';
import {
  coerceScalar,
  convertFileName,
  detectDelimiter,
  flattenJson,
  normalizeJsonRows,
  uniqueHeaders,
} from '../src/lib/csv-json';

describe('detectDelimiter', () => {
  it('쉼표·세미콜론·탭을 구분한다', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t');
  });

  it('구분자가 없으면 쉼표', () => {
    expect(detectDelimiter('한 줄')).toBe(',');
  });
});

describe('coerceScalar', () => {
  it('숫자와 불리언을 변환한다', () => {
    expect(coerceScalar('123')).toBe(123);
    expect(coerceScalar('-3.5')).toBe(-3.5);
    expect(coerceScalar('true')).toBe(true);
    expect(coerceScalar('false')).toBe(false);
  });

  it('코드·쉼표 숫자는 문자열로 둔다', () => {
    expect(coerceScalar('00123')).toBe('00123');
    expect(coerceScalar('1,250')).toBe('1,250');
    expect(coerceScalar('2026-11-10')).toBe('2026-11-10');
  });

  it('빈 값은 빈 문자열', () => {
    expect(coerceScalar('  ')).toBe('');
  });
});

describe('uniqueHeaders', () => {
  it('중복과 빈 헤더를 정리한다', () => {
    expect(uniqueHeaders(['이름', '이름', '', '값'])).toEqual(['이름', '이름_2', '열3', '값']);
  });
});

describe('flattenJson', () => {
  it('중첩 객체를 점 표기법으로 만든다', () => {
    expect(flattenJson({ a: { b: 1, c: { d: 2 } }, e: 3 })).toEqual({
      'a.b': 1,
      'a.c.d': 2,
      e: 3,
    });
  });

  it('배열은 JSON 문자열로 둔다', () => {
    expect(flattenJson({ tags: ['a', 'b'] })).toEqual({ tags: '["a","b"]' });
  });
});

describe('normalizeJsonRows', () => {
  it('모든 객체의 키를 합집합으로 모은다', () => {
    const result = normalizeJsonRows([{ a: 1 }, { b: 2 }]);
    expect(result.headers).toEqual(['a', 'b']);
    expect(result.rows).toHaveLength(2);
  });

  it('평탄화 옵션을 적용한다', () => {
    const result = normalizeJsonRows([{ user: { name: 'A' } }], true);
    expect(result.headers).toEqual(['user.name']);
  });

  it('배열이 아니면 오류', () => {
    expect(() => normalizeJsonRows({ a: 1 })).toThrow('배열');
  });
});

describe('convertFileName', () => {
  it('확장자를 바꾼다', () => {
    expect(convertFileName('data.csv', 'json')).toBe('data.json');
    expect(convertFileName(null, 'csv')).toBe('converted.csv');
  });
});
