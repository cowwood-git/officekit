import { describe, expect, it } from 'vitest';
import {
  normalizeRotation,
  organizeFileName,
  reorderIndices,
  rotateBy,
} from '../src/lib/pdf-organize';

describe('rotateBy', () => {
  it('90도씩 더하고 360에서 순환한다', () => {
    expect(rotateBy(0)).toBe(90);
    expect(rotateBy(270)).toBe(0);
    expect(rotateBy(180, 180)).toBe(0);
  });
});

describe('normalizeRotation', () => {
  it('0/90/180/270으로 보정한다', () => {
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(89)).toBe(90);
  });
});

describe('reorderIndices', () => {
  it('중복·범위 밖 값을 제거하고 빠진 페이지를 뒤에 붙인다', () => {
    expect(reorderIndices([2, 0, 2, 5], 4)).toEqual([2, 0, 1, 3]);
  });

  it('올바른 순서는 그대로 둔다', () => {
    expect(reorderIndices([1, 0, 2], 3)).toEqual([1, 0, 2]);
  });
});

describe('organizeFileName', () => {
  it('파일명을 만든다', () => {
    expect(organizeFileName('계약서.pdf')).toBe('계약서-organized.pdf');
    expect(organizeFileName('a/b.PDF')).toBe('a_b-organized.pdf');
  });
});
