import { describe, expect, it } from 'vitest';
import { parseRecent, pushRecent } from '../src/lib/recent-tools';

describe('recent-tools', () => {
  it('방문한 도구를 맨 앞에 두고 중복을 없앤다', () => {
    expect(pushRecent(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it('최대 개수를 넘기지 않는다', () => {
    expect(pushRecent(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b']);
  });

  it('형식이 틀린 slug 는 기록하지 않는다', () => {
    expect(pushRecent(['a'], '"><script>')).toEqual(['a']);
  });

  it('저장값이 깨졌거나 배열이 아니면 빈 목록', () => {
    expect(parseRecent(null)).toEqual([]);
    expect(parseRecent('{oops')).toEqual([]);
    expect(parseRecent('{"a":1}')).toEqual([]);
  });

  it('배열 안의 잘못된 항목은 걸러낸다', () => {
    expect(parseRecent(JSON.stringify(['pdf-merge', 3, 'Bad Slug', 'image-ocr']))).toEqual([
      'pdf-merge',
      'image-ocr',
    ]);
  });
});
