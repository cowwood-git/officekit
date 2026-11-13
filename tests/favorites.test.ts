import { describe, expect, it } from 'vitest';
import { FAVORITES_LIMIT, parseFavorites, toggleSlug } from '../src/lib/favorites';

describe('favorites', () => {
  it('없으면 끝에 추가한다', () => {
    expect(toggleSlug(['a'], 'b')).toEqual({ list: ['a', 'b'], on: true });
  });

  it('있으면 뺀다', () => {
    expect(toggleSlug(['a', 'b'], 'a')).toEqual({ list: ['b'], on: false });
  });

  it('최대 개수에 닿으면 더 추가하지 않는다', () => {
    const full = Array.from({ length: FAVORITES_LIMIT }, (_, i) => `t${i}`);
    expect(toggleSlug(full, 'new')).toEqual({ list: full, on: false });
  });

  it('형식이 틀린 slug 는 무시한다', () => {
    expect(toggleSlug(['a'], '<x>')).toEqual({ list: ['a'], on: false });
  });

  it('깨진 저장값은 빈 목록', () => {
    expect(parseFavorites('nope')).toEqual([]);
    expect(parseFavorites(JSON.stringify(['pdf-merge', 1]))).toEqual(['pdf-merge']);
  });
});
