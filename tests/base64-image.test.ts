import { describe, expect, it } from 'vitest';
import {
  dataUri,
  decodeBase64,
  encodeBase64,
  extensionFor,
  parseBase64Input,
  sniffImageMime,
  snippetsFor,
} from '../src/lib/base64-image';

const PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

describe('base64-image', () => {
  it('data URI 와 순수 Base64 를 읽는다', () => {
    expect(parseBase64Input(`data:image/png;base64,${PNG_B64}`)).toEqual({
      mime: 'image/png',
      base64: PNG_B64,
    });
    expect(parseBase64Input(`  "${PNG_B64.slice(0, 20)}\n${PNG_B64.slice(20)}"  `)?.base64).toBe(
      PNG_B64,
    );
    expect(parseBase64Input('url(data:image/gif;base64,R0lGODlh)')?.mime).toBe('image/gif');
    expect(parseBase64Input('안녕하세요')).toBeNull();
    expect(parseBase64Input('')).toBeNull();
  });

  it('여는 패딩이 없어도 채운다', () => {
    expect(parseBase64Input('YWJj')?.base64).toBe('YWJj');
    expect(parseBase64Input('YWI')?.base64).toBe('YWI=');
  });

  it('형식을 알아본다', () => {
    expect(sniffImageMime(decodeBase64(PNG_B64))).toBe('image/png');
    expect(sniffImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(
      sniffImageMime(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')),
    ).toBe('image/svg+xml');
    expect(sniffImageMime(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });

  it('왕복 변환', () => {
    const bytes = decodeBase64(PNG_B64);
    expect(encodeBase64(bytes)).toBe(PNG_B64);
    const big = new Uint8Array(100000).map((_, i) => i % 256);
    expect(decodeBase64(encodeBase64(big))).toEqual(big);
  });

  it('붙여 쓰는 코드', () => {
    const uri = dataUri('image/png', 'AAAA');
    const s = snippetsFor(uri, '로고 "a"');
    expect(s.html).toBe('<img src="data:image/png;base64,AAAA" alt="로고 &quot;a&quot;">');
    expect(s.css).toBe('background-image: url("data:image/png;base64,AAAA");');
    expect(s.markdown).toBe('![로고 "a"](data:image/png;base64,AAAA)');
    expect(extensionFor('image/jpeg')).toBe('jpg');
    expect(extensionFor('x')).toBe('bin');
  });
});
