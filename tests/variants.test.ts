import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tools } from '../src/data/tools';
import { VARIANTS } from '../src/data/variants';

const route = readFileSync(
  new URL('../src/pages/tools/[tool]/[variant].astro', import.meta.url),
  'utf8',
);

// docs/scale-plan.md §5 품질 관문
describe('목적별 페이지(변형) 품질 관문', () => {
  const slugs = new Set(tools.map((tool) => tool.slug));

  it.each(VARIANTS.map((variant) => [`${variant.tool}/${variant.slug}`, variant] as const))(
    '%s',
    (_, variant) => {
      expect(slugs.has(variant.tool), '없는 도구').toBe(true);
      expect(route.includes(`'${variant.tool}':`), '작업 영역이 등록되지 않음').toBe(true);
      expect(Object.keys(variant.preset).length, 'preset 이 비어 있음').toBeGreaterThan(0);
      const body = variant.sections.flatMap((section) => section.body).join('');
      expect(body.replace(/\s/g, '').length, '설명 200자 미만').toBeGreaterThanOrEqual(200);
      expect(variant.faq.length, 'FAQ 2개 미만').toBeGreaterThanOrEqual(2);
      expect(variant.title.length).toBeGreaterThanOrEqual(10);
      expect(variant.title.length).toBeLessThanOrEqual(65);
      expect(variant.description.length).toBeGreaterThanOrEqual(50);
      expect(variant.description.length).toBeLessThanOrEqual(170);
      expect(variant.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    },
  );

  it('주소가 겹치지 않고, 도구당 5개 이하', () => {
    const keys = VARIANTS.map((variant) => `${variant.tool}/${variant.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
    const perTool = new Map<string, number>();
    for (const variant of VARIANTS) perTool.set(variant.tool, (perTool.get(variant.tool) ?? 0) + 1);
    expect([...perTool].filter(([, count]) => count > 5)).toEqual([]);
  });

  it('같은 도구의 변형끼리 preset 이 서로 다르다', () => {
    const seen = new Set<string>();
    for (const variant of VARIANTS) {
      const key = `${variant.tool}:${JSON.stringify(variant.preset)}`;
      expect(seen.has(key), `${variant.slug} preset 중복`).toBe(false);
      seen.add(key);
    }
  });
});
