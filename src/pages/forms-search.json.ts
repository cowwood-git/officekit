import type { APIRoute } from 'astro';
import { formSearchEntries } from '@/data/form-search';

/** 홈 검색의 양식 결과 색인(src/data/form-search.ts). 검색창을 쓸 때만 받는다. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(formSearchEntries()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
