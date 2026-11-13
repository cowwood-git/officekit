import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  hashesMatch,
  hashHex,
  isHashAlgorithm,
  MAX_HASH_BYTES,
  normalizeHash,
} from '../src/lib/file-hash';

const data = new TextEncoder().encode('officekit');

describe('파일 해시', () => {
  it('SHA-256 해시를 소문자 16진수로 만든다', async () => {
    const expected = createHash('sha256').update('officekit').digest('hex');
    expect(await hashHex(data, 'SHA-256')).toBe(expected);
  });

  it('SHA-1·SHA-512도 계산한다', async () => {
    expect(await hashHex(data, 'SHA-1')).toBe(createHash('sha1').update('officekit').digest('hex'));
    expect(await hashHex(data, 'SHA-512')).toBe(
      createHash('sha512').update('officekit').digest('hex'),
    );
  });

  it('공백·콜론·대소문자를 무시하고 비교한다', () => {
    expect(normalizeHash('AA BB:CC')).toBe('aabbcc');
    expect(hashesMatch('AA BB:CC', 'aabbcc')).toBe(true);
    expect(hashesMatch('aabbcc', 'aabbcd')).toBe(false);
    expect(hashesMatch('', '')).toBe(false);
  });

  it('알고리즘 이름을 검사한다', () => {
    expect(isHashAlgorithm('SHA-256')).toBe(true);
    expect(isHashAlgorithm('MD5')).toBe(false);
  });

  it('파일 크기 제한은 100MB다', () => {
    expect(MAX_HASH_BYTES).toBe(100 * 1024 * 1024);
  });
});
