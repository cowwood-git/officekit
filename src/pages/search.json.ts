import type { APIRoute } from 'astro';
import { APP_GROUPS } from '@/data/app-groups';
import { iconFor } from '@/data/app-icons';
import { FORM_CATEGORIES } from '@/data/form-categories';
import { FORMS } from '@/data/forms';
import { capabilityFor, operationSearchText } from '@/data/tool-capabilities';
import { CATEGORIES, getTool, tools, tx } from '@/data/tools';
import { VARIANTS } from '@/data/variants';

const groupOf = new Map(
  APP_GROUPS.flatMap((group) => group.items.map((tool) => [tool.slug, group] as const)),
);

export const GET: APIRoute = () => {
  const index: Record<string, unknown>[] = tools.map((tool) => ({
    type: 'tool',
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
      type: 'tool',
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

  // 양식: 이름·용도·카테고리로 찾을 수 있게 한다.
  const categoryOf = new Map(FORM_CATEGORIES.map((category) => [category.id, category] as const));
  for (const form of FORMS) {
    const category = categoryOf.get(form.category);
    index.push({
      type: 'form',
      slug: form.slug,
      path: `/forms/${form.slug}/`,
      title: form.title,
      summary: form.lead,
      description: form.description,
      category: category?.label ?? '양식',
      iconName: 'file-text',
      keywords: [...form.keywords, category?.label ?? ''].filter(Boolean),
      updated: form.updated,
    });
  }

  // 카테고리 자체도 검색 결과로 보여 준다(예: "인사", "재무").
  for (const category of FORM_CATEGORIES) {
    index.push({
      type: 'category',
      slug: category.id,
      path: `/forms/#${category.id}`,
      title: `${category.label} 양식`,
      summary: category.description,
      description: category.description,
      category: '양식 카테고리',
      iconName: 'files',
      keywords: [category.label, category.examples, '양식', '카테고리'],
      updated: '2026-11-15',
    });
  }

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
