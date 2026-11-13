import type { APIRoute } from 'astro';
import { APP_GROUPS } from '@/data/app-groups';
import { iconFor } from '@/data/app-icons';
import { capabilityFor, operationSearchText } from '@/data/tool-capabilities';
import { CATEGORIES, getTool, tools, tx } from '@/data/tools';
import { VARIANTS } from '@/data/variants';

const groupOf = new Map(
  APP_GROUPS.flatMap((group) => group.items.map((tool) => [tool.slug, group] as const)),
);

export const GET: APIRoute = () => {
  const index = tools.map((tool) => ({
    slug: tool.slug,
    path: `/tools/${tool.slug}/`,
    title: tx(tool.title),
    summary: tx(tool.summary),
    description: tx(tool.description),
    category: groupOf.get(tool.slug)?.label ?? CATEGORIES[tool.category].label,
    iconName: iconFor(tool.slug),
    keywords: tool.keywords,
    format: capabilityFor(tool.slug).format,
    operations: capabilityFor(tool.slug).operations,
    operationSearch: capabilityFor(tool.slug).operations.map(operationSearchText).join(' '),
    accepts: capabilityFor(tool.slug).accepts,
    produces: capabilityFor(tool.slug).produces,
    updated: tool.updated,
  }));

  // 목적별 페이지도 검색에 나오게 한다(PNG → JPG 처럼 검색어 그대로 찾는 사람이 많다).
  for (const variant of VARIANTS) {
    const tool = getTool(variant.tool);
    if (!tool) continue;
    index.push({
      slug: `${variant.tool}/${variant.slug}`,
      path: `/tools/${variant.tool}/${variant.slug}/`,
      title: variant.h1,
      summary: variant.summary,
      description: variant.description,
      category: groupOf.get(tool.slug)?.label ?? CATEGORIES[tool.category].label,
      iconName: iconFor(tool.slug),
      keywords: [variant.slug.replaceAll('-', ' '), variant.h1.replace('→', ' '), ...tool.keywords],
      format: capabilityFor(tool.slug).format,
      operations: capabilityFor(tool.slug).operations,
      operationSearch: capabilityFor(tool.slug).operations.map(operationSearchText).join(' '),
      accepts: capabilityFor(tool.slug).accepts,
      produces: capabilityFor(tool.slug).produces,
      updated: variant.updated,
    });
  }

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
