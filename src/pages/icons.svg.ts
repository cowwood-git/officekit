import type { APIRoute } from 'astro';
import { buildSprite } from '@/lib/icon-sprite';

/** 도구 아이콘 스프라이트 — 모든 페이지가 이 한 파일을 캐시해 공유한다. */
export const GET: APIRoute = () =>
  new Response(buildSprite(), { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
