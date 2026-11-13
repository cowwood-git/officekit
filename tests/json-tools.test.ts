import { describe, expect, it } from 'vitest';
import { diffJson, diffText, formatJson, minifyJson, validateJson } from '../src/lib/json-tools';

const sample = '{"b":2,"a":{"y":1,"x":[1,2]}}';

describe('validateJson', () => {
  it('유효한 JSON을 통과시킨다', () => {
    expect(validateJson(sample).ok).toBe(true);
  });

  it('오류 위치를 계산한다', () => {
    const result = validateJson('{\n  "a": 1,\n}');
    expect(result.ok).toBe(false);
    expect(result.line).toBe(3);
    expect(result.column).toBeGreaterThan(0);
  });

  it('빈 입력을 거부한다', () => {
    expect(validateJson('   ').ok).toBe(false);
  });
});

describe('formatJson', () => {
  it('들여쓰기와 키 정렬을 적용한다', () => {
    const result = formatJson(sample, { indent: 2, sortKeys: true });
    expect(result.ok).toBe(true);
    expect(result.text).toBe(
      '{\n  "a": {\n    "x": [\n      1,\n      2\n    ],\n    "y": 1\n  },\n  "b": 2\n}',
    );
  });

  it('잘못된 JSON은 오류를 돌려준다', () => {
    expect(formatJson('{', { indent: 2, sortKeys: false }).ok).toBe(false);
  });
});

describe('minifyJson', () => {
  it('공백을 제거한다', () => {
    const result = minifyJson('{\n  "a": 1\n}');
    expect(result.text).toBe('{"a":1}');
  });
});

describe('diffJson', () => {
  it('추가·삭제·변경을 경로별로 찾는다', () => {
    const result = diffJson('{"a":1,"b":{"c":2}}', '{"a":2,"b":{"c":2,"d":3}}');
    expect(result.ok).toBe(true);
    expect(result.entries).toContainEqual({
      path: 'a',
      type: 'changed',
      before: '1',
      after: '2',
    });
    expect(result.entries).toContainEqual({ path: 'b.d', type: 'added', after: '3' });
  });

  it('배열 길이 차이를 처리한다', () => {
    const result = diffJson('[1,2]', '[1,2,3]');
    expect(result.entries[0]).toEqual({ path: '[2]', type: 'added', after: '3' });
  });

  it('잘못된 JSON은 오류를 돌려준다', () => {
    expect(diffJson('{', '{}').ok).toBe(false);
  });

  it('차이를 텍스트로 만든다', () => {
    expect(diffText([])).toBe('차이가 없습니다.');
    expect(diffText([{ path: 'a', type: 'changed', before: '1', after: '2' }])).toBe('~ a: 1 → 2');
  });
});
