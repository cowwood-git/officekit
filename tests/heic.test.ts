import { describe, expect, it } from 'vitest';
import {
  isHeic,
  jpegNameFor,
  MAX_HEIC_FILES,
  MAX_HEIC_TOTAL_BYTES,
  validateHeicSelection,
} from '../src/lib/heic';

describe('isHeic', () => {
  it('확장자와 MIME 타입을 모두 인식한다', () => {
    expect(isHeic({ name: 'IMG_0001.HEIC', size: 1 })).toBe(true);
    expect(isHeic({ name: 'photo.heif', size: 1 })).toBe(true);
    expect(isHeic({ name: 'blob', size: 1, type: 'image/heic' })).toBe(true);
    expect(isHeic({ name: 'photo.jpg', size: 1, type: 'image/jpeg' })).toBe(false);
  });
});

describe('validateHeicSelection', () => {
  it('HEIC 파일을 통과시킨다', () => {
    expect(
      validateHeicSelection([
        { name: 'a.heic', size: 100, type: 'image/heic' },
        { name: 'b.HEIF', size: 100 },
      ]).ok,
    ).toBe(true);
  });

  it('JPG를 거부한다', () => {
    const result = validateHeicSelection([{ name: 'a.jpg', size: 100, type: 'image/jpeg' }]);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('a.jpg');
  });

  it('최대 장수를 넘으면 거부한다', () => {
    const files = Array.from({ length: MAX_HEIC_FILES + 1 }, (_, index) => ({
      name: `${index}.heic`,
      size: 10,
    }));
    expect(validateHeicSelection(files).ok).toBe(false);
  });

  it('전체 용량을 넘으면 거부한다', () => {
    const result = validateHeicSelection([{ name: 'big.heic', size: MAX_HEIC_TOTAL_BYTES + 1 }]);
    expect(result.ok).toBe(false);
  });
});

describe('jpegNameFor', () => {
  it('확장자를 jpg로 바꾼다', () => {
    const used = new Set<string>();
    expect(jpegNameFor('IMG_0001.HEIC', used)).toBe('IMG_0001.jpg');
  });

  it('중복 이름에는 번호를 붙인다', () => {
    const used = new Set<string>();
    expect(jpegNameFor('photo.heic', used)).toBe('photo.jpg');
    expect(jpegNameFor('photo.heif', used)).toBe('photo-2.jpg');
    expect(jpegNameFor('photo.HEIC', used)).toBe('photo-3.jpg');
  });

  it('위험한 문자를 제거한다', () => {
    const used = new Set<string>();
    expect(jpegNameFor('a/b:c.heic', used)).toBe('a_b_c.jpg');
  });
});
