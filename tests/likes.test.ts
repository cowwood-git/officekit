import { describe, expect, it } from 'vitest';
import {
  type Env,
  isSameOrigin,
  isValidSlug,
  isValidVisitorId,
  visitorHash,
} from '../functions/_lib/likes';
import {
  formatLikeCount,
  hasEnoughTopLikes,
  readLikedTools,
  selectTopLikeCards,
} from '../src/lib/likes';

describe('likes', () => {
  it('좋아요 수를 한국어 형식으로 표시한다', () => {
    expect(formatLikeCount(0)).toBe('0');
    expect(formatLikeCount(1234)).toBe('1,234');
  });

  it('로컬 저장소가 없으면 빈 좋아요 목록을 돌려준다', () => {
    expect(readLikedTools().size).toBe(0);
  });

  it('실제 도구 slug만 허용한다', () => {
    expect(isValidSlug('pdf-merge')).toBe(true);
    expect(isValidSlug('없는-도구')).toBe(false);
    expect(isValidSlug('../etc/passwd')).toBe(false);
    expect(isValidSlug('a'.repeat(61))).toBe(false);
  });

  it('방문자 ID 형식을 검사한다', () => {
    expect(isValidVisitorId('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isValidVisitorId('short')).toBe(false);
    expect(isValidVisitorId('space id 123')).toBe(false);
  });

  it('방문자 ID를 원문 없이 해시한다', async () => {
    const env = { LIKES_SECRET: 'test-secret' } as Env;
    const first = await visitorHash('123e4567-e89b-12d3-a456-426614174000', env);
    const second = await visitorHash('123e4567-e89b-12d3-a456-426614174000', env);
    expect(first).toBe(second);
    expect(first).not.toContain('123e4567');
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    const other = await visitorHash('123e4567-e89b-12d3-a456-426614174000', {
      LIKES_SECRET: 'other-secret',
    } as Env);
    expect(first).not.toBe(other);
  });

  it('상위 좋아요 섹션은 도구 20개·좋아요 3개 이상일 때만 연다', () => {
    const make = (count: number, index: number) => ({ slug: `tool-${index}`, count });
    expect(hasEnoughTopLikes(Array.from({ length: 19 }, (_, i) => make(3, i)))).toBe(false);
    expect(hasEnoughTopLikes(Array.from({ length: 20 }, (_, i) => make(2, i)))).toBe(false);
    expect(hasEnoughTopLikes(Array.from({ length: 20 }, (_, i) => make(3, i)))).toBe(true);
  });

  it('상위 좋아요 카드는 많은 순으로 자른다', () => {
    const cards = selectTopLikeCards(
      [
        { slug: 'a', count: 2 },
        { slug: 'b', count: 9 },
        { slug: 'c', count: 5 },
        { slug: 'd', count: 0 },
      ],
      2,
    );
    expect(cards.map((item) => item.slug)).toEqual(['b', 'c']);
  });

  it('같은 출처의 POST만 허용한다', () => {
    expect(
      isSameOrigin(
        new Request('https://officekit.kr/api/likes/pdf-merge', {
          method: 'POST',
          headers: { Origin: 'https://officekit.kr' },
        }),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(
        new Request('https://officekit.kr/api/likes/pdf-merge', {
          method: 'POST',
          headers: { Origin: 'https://evil.example' },
        }),
      ),
    ).toBe(false);
  });
});

describe('횟수 제한 기록 정리', () => {
  it('어제보다 오래된 날짜를 지울 기준으로 삼는다', async () => {
    const { rateCutoffDay, dayKey } = await import('../functions/_lib/likes');
    const now = new Date('2026-11-14T03:00:00Z');
    expect(dayKey(now)).toBe('2026-11-14');
    expect(rateCutoffDay(now)).toBe('2026-11-13');
  });

  it('정리 쿼리는 오래된 day 만 지운다', async () => {
    const { canWriteLike, RATE_PRUNE_CHANCE } = await import('../functions/_lib/likes');
    expect(RATE_PRUNE_CHANCE).toBeGreaterThan(0);
    const queries: string[] = [];
    const db = {
      prepare: (sql: string) => {
        queries.push(sql);
        return {
          bind: () => ({ first: async () => ({ count: 1 }), run: async () => ({}) }),
        };
      },
    };
    const random = Math.random;
    Math.random = () => 0;
    try {
      const request = new Request('https://officekit.kr/api/likes/x', {
        headers: { 'CF-Connecting-IP': '203.0.113.1' },
      });
      // biome-ignore lint/suspicious/noExplicitAny: D1 최소 흉내
      expect(await canWriteLike(request, { LIKES_DB: db as any })).toBe(true);
    } finally {
      Math.random = random;
    }
    expect(queries.some((sql) => /DELETE FROM like_rate WHERE day < \?/.test(sql))).toBe(true);
  });
});
