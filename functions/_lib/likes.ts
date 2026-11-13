import type { D1Database } from '@cloudflare/workers-types';
import { tools } from '../../src/data/tools';

export interface Env {
  LIKES_DB: D1Database;
  LIKES_SECRET?: string;
}

export const TOOL_SLUGS = new Set(tools.map((tool) => tool.slug));
export const SLUG_PATTERN = /^[a-z0-9-]{1,60}$/;
export const VISITOR_PATTERN = /^[A-Za-z0-9_-]{8,80}$/;
export const RATE_LIMIT_PER_DAY = 300;

const FALLBACK_SECRET = 'officekit-likes-v1';

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && TOOL_SLUGS.has(slug);
}

export function isValidVisitorId(value: unknown): value is string {
  return typeof value === 'string' && VISITOR_PATTERN.test(value);
}

export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 기존 like_visitors·like_rate 행과 호환되도록 비밀키 prefix + SHA-256을 유지한다.
 * 입력이 무작위 UUID라 원본 복원이 사실상 불가능하고, 해시를 바꾸면 기존 좋아요가
 * 중복 집계되므로 지금은 HMAC으로 전환하지 않는다.
 */
export function visitorHash(visitorId: string, env: Env): Promise<string> {
  return sha256(`${env.LIKES_SECRET ?? FALLBACK_SECRET}:visitor:${visitorId}`);
}

export function ipHash(ip: string, env: Env): Promise<string> {
  return sha256(`${env.LIKES_SECRET ?? FALLBACK_SECRET}:ip:${ip}`);
}

export function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** IP당 하루 좋아요 요청 수를 제한한다. IP가 없으면(로컬·테스트) 통과. */
export async function canWriteLike(request: Request, env: Env): Promise<boolean> {
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return true;
  const hash = await ipHash(ip, env);
  const day = dayKey();
  const row = await env.LIKES_DB.prepare(
    `INSERT INTO like_rate (ip_hash, day, count) VALUES (?, ?, 1)
     ON CONFLICT(ip_hash, day) DO UPDATE SET count = count + 1
     RETURNING count`,
  )
    .bind(hash, day)
    .first<{ count: number }>();
  return (row?.count ?? 0) <= RATE_LIMIT_PER_DAY;
}
