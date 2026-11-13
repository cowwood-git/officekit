import { describe, expect, it } from 'vitest';
import {
  camelCase,
  constantCase,
  decodeBase64,
  decodeHtml,
  encodeBase64,
  encodeHtml,
  kebabCase,
  snakeCase,
  titleCase,
  transformText,
} from '../src/lib/text-convert';

describe('case conversions', () => {
  it('Title Case는 단어 첫 글자를 올린다', () => {
    expect(titleCase('hello world')).toBe('Hello World');
    expect(titleCase("don't stop")).toBe("Don't Stop");
    expect(titleCase('(hello) world')).toBe('(Hello) World');
  });

  it('camel·snake·kebab·constant를 만든다', () => {
    expect(camelCase('hello world test')).toBe('helloWorldTest');
    expect(snakeCase('hello world test')).toBe('hello_world_test');
    expect(kebabCase('hello world test')).toBe('hello-world-test');
    expect(constantCase('hello world test')).toBe('HELLO_WORLD_TEST');
    expect(camelCase('  한글  테스트 ')).toBe('한글테스트');
  });
});

describe('Base64', () => {
  it('한글과 이모지를 왕복한다', () => {
    const text = '오피스킷 QR 2026 🚀';
    expect(decodeBase64(encodeBase64(text))).toBe(text);
  });

  it('공백·줄바꿈이 섞인 Base64도 디코딩한다', () => {
    expect(decodeBase64('7Jik7ZS8 7Iqk\n7YK3')).toBe('오피스킷');
  });

  it('잘못된 Base64는 예외를 던진다', () => {
    expect(() => decodeBase64('%%%')).toThrow();
  });
});

describe('HTML entities', () => {
  it('특수문자를 인코딩하고 되돌린다', () => {
    const encoded = encodeHtml(`<a href="x">Tom & Jerry's</a>`);
    expect(encoded).toBe('&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;');
    expect(decodeHtml(encoded)).toBe(`<a href="x">Tom & Jerry's</a>`);
  });

  it('숫자 엔티티와 알 수 없는 엔티티를 처리한다', () => {
    expect(decodeHtml('&#65;&#x42;&nbsp;')).toBe('AB\u00a0');
    expect(decodeHtml('&unknown;')).toBe('&unknown;');
  });
});

describe('transformText', () => {
  it('URL 인코딩·디코딩', () => {
    expect(transformText('url-encode', '오피스킷 검색')).toBe(
      '%EC%98%A4%ED%94%BC%EC%8A%A4%ED%82%B7%20%EA%B2%80%EC%83%89',
    );
    expect(transformText('url-decode', '%EC%98%A4%ED%94%BC%EC%8A%A4%ED%82%B7')).toBe('오피스킷');
  });

  it('대소문자 변환', () => {
    expect(transformText('upper', 'abc')).toBe('ABC');
    expect(transformText('lower', 'ABC')).toBe('abc');
  });
});
