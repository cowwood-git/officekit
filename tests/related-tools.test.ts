import { describe, expect, it } from 'vitest';
import { groupFor } from '../src/data/app-groups';
import { getTool, tools } from '../src/data/tools';
import {
  hubCrumb,
  hubForTool,
  RELATED_LIMIT,
  relatedToolsFor,
  workflowsFor,
} from '../src/lib/related-tools';

describe('함께 쓰면 좋은 도구', () => {
  it('손으로 고른 도구가 맨 앞에 그 순서대로 온다', () => {
    for (const tool of tools) {
      const curated = tool.related.filter((slug) => slug !== tool.slug && getTool(slug));
      const head = relatedToolsFor(tool.slug)
        .slice(0, curated.length)
        .map((item) => item.slug);
      expect(head, tool.slug).toEqual(curated);
    }
  });

  it('모든 도구가 자기 자신·중복 없이 LIMIT 개를 채운다', () => {
    for (const tool of tools) {
      const slugs = relatedToolsFor(tool.slug).map((item) => item.slug);
      expect(slugs, tool.slug).not.toContain(tool.slug);
      expect(new Set(slugs).size, tool.slug).toBe(slugs.length);
      const groupSize = groupFor(tool.slug)?.items.length ?? 0;
      expect(slugs.length, tool.slug).toBeLessThanOrEqual(RELATED_LIMIT);
      expect(slugs.length, tool.slug).toBeGreaterThanOrEqual(
        Math.min(RELATED_LIMIT, groupSize - 1),
      );
    }
  });

  it('나를 고른 도구도 이어진다(역방향 링크)', () => {
    const target = tools.find((tool) => tools.some((other) => other.related.includes(tool.slug)));
    expect(target).toBeDefined();
    if (!target) return;
    const backers = tools.filter((other) => other.related.includes(target.slug));
    const linked = relatedToolsFor(target.slug, 100).map((item) => item.slug);
    for (const backer of backers) {
      if (backer.slug !== target.slug) expect(linked).toContain(backer.slug);
    }
  });

  it('모든 도구가 적어도 한 곳 이상에서 링크를 받는다', () => {
    const inbound = new Set(
      tools.flatMap((tool) => relatedToolsFor(tool.slug).map((item) => item.slug)),
    );
    const orphans = tools.filter((tool) => !inbound.has(tool.slug)).map((tool) => tool.slug);
    expect(orphans).toEqual([]);
  });

  it('없는 도구는 빈 목록', () => {
    expect(relatedToolsFor('no-such-tool')).toEqual([]);
  });
});

describe('허브·작업 흐름 링크', () => {
  it('모든 도구가 자기 형식 허브를 가진다', () => {
    for (const tool of tools) expect(hubForTool(tool.slug), tool.slug).toBeDefined();
    expect(hubForTool('pdf-merge')?.slug).toBe('pdf');
    expect(hubCrumb('pdf-merge')).toEqual([{ name: 'PDF', path: '/pdf/' }]);
    expect(hubCrumb('no-such-tool')).toEqual([]);
  });

  it('작업 흐름은 단계에 나오는 도구만 잇는다', () => {
    for (const tool of tools) {
      for (const workflow of workflowsFor(tool.slug)) {
        expect(workflow.steps.some((step) => step.tool === tool.slug)).toBe(true);
      }
    }
  });
});
