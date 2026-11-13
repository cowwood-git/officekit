import { describe, expect, it } from 'vitest';
import {
  buildAlphabet,
  estimatePassphraseBits,
  estimatePasswordBits,
  generatePassphrase,
  generatePassword,
  PASSPHRASE_WORDS,
  type PasswordOptions,
  strengthOf,
} from '../src/lib/password';

const base: PasswordOptions = {
  length: 16,
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
};

const zero = () => 0;
const last = (max: number) => max - 1;

describe('비밀번호 생성', () => {
  it('선택한 문자 종류만 사용한다', () => {
    const alphabet = buildAlphabet({ ...base, symbols: false, upper: false });
    expect(alphabet).toMatch(/^[a-z0-9]+$/);
  });

  it('비슷한 글자를 제외할 수 있다', () => {
    const withAmbiguous = buildAlphabet({ ...base, excludeAmbiguous: false });
    expect(withAmbiguous).toContain('I');
    expect(withAmbiguous).toContain('1');
    const without = buildAlphabet({ ...base, excludeAmbiguous: true });
    for (const char of 'Il1O0o') expect(without).not.toContain(char);
  });

  it('길이를 지키고 각 문자 종류를 하나 이상 넣는다', () => {
    const result = generatePassword({ ...base, length: 16 }, zero);
    expect(result).toHaveLength(16);
    expect(result).toMatch(/[a-z]/);
    expect(result).toMatch(/[A-Z]/);
    expect(result).toMatch(/[0-9]/);
    expect(result).toMatch(/[!@#$%^&*]/);
  });

  it('마지막 난수로도 길이를 지킨다', () => {
    expect(generatePassword({ ...base, length: 32 }, last)).toHaveLength(32);
  });

  it('문자 종류를 모두 끄면 오류를 낸다', () => {
    expect(() =>
      generatePassword(
        { ...base, lower: false, upper: false, digits: false, symbols: false },
        zero,
      ),
    ).toThrow('문자 종류를 하나 이상 선택하세요.');
  });

  it('패스프레이즈는 단어 수와 구분자를 지킨다', () => {
    const result = generatePassphrase(6, '-', zero);
    const words = result.split('-');
    expect(words).toHaveLength(6);
    for (const word of words) expect(PASSPHRASE_WORDS).toContain(word);
  });

  it('단어 목록은 128개 이상이고 중복이 없다', () => {
    expect(PASSPHRASE_WORDS.length).toBeGreaterThanOrEqual(128);
    expect(new Set(PASSPHRASE_WORDS).size).toBe(PASSPHRASE_WORDS.length);
  });

  it('길이와 단어 수가 늘수록 엔트로피가 커진다', () => {
    expect(estimatePasswordBits({ ...base, length: 32 })).toBeGreaterThan(
      estimatePasswordBits({ ...base, length: 16 }),
    );
    expect(estimatePassphraseBits(10)).toBeGreaterThan(estimatePassphraseBits(5));
  });

  it('엔트로피에 따라 강도 이름을 고른다', () => {
    expect(strengthOf(20).label).toBe('약함');
    expect(strengthOf(50).label).toBe('보통');
    expect(strengthOf(70).label).toBe('강함');
    expect(strengthOf(100).label).toBe('매우 강함');
  });
});
