import type { APIRoute } from 'astro';
import { SITE } from '@/consts';
import { groupFor } from '@/data/app-groups';
import { CATEGORIES, tools, tx } from '@/data/tools';
import { rssXml } from '@/lib/rss';

/** /rss.xml — 도구 목록(수정일 최신순). 네이버 서치어드바이저 «RSS 제출»에 이 주소를 낸다. */
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(SITE.url);
  const body = rssXml({
    title: SITE.title,
    link: new URL('/', base).href,
    description: SITE.description,
    self: new URL('/rss.xml', base).href,
    items: tools.map((tool) => ({
      title: tx(tool.title),
      link: new URL(`/tools/${tool.slug}/`, base).href,
      description: tx(tool.description),
      date: tool.updated,
      category: groupFor(tool.slug)?.label ?? CATEGORIES[tool.category].label,
    })),
  });
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
