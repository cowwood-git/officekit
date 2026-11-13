import { describe, expect, it } from 'vitest';
import { APP_GROUPS } from '../src/data/app-groups';
import { capabilityFor, OPERATIONS, TOOL_CAPABILITIES } from '../src/data/tool-capabilities';
import { tools } from '../src/data/tools';

describe('tool-capabilities', () => {
  it('모든 도구에 역량 정보가 있다', () => {
    const missing = tools.map((tool) => tool.slug).filter((slug) => !TOOL_CAPABILITIES[slug]);
    expect(missing).toEqual([]);
  });

  it('없는 도구를 가리키지 않는다', () => {
    const slugs = new Set(tools.map((tool) => tool.slug));
    expect(Object.keys(TOOL_CAPABILITIES).filter((slug) => !slugs.has(slug))).toEqual([]);
  });

  it('형식은 홈 카테고리와 일치한다', () => {
    const groupOf = new Map(
      APP_GROUPS.flatMap((group) => group.items.map((tool) => [tool.slug, group.id] as const)),
    );
    const mismatched = tools
      .filter((tool) => capabilityFor(tool.slug).format !== groupOf.get(tool.slug))
      .map((tool) => tool.slug);
    expect(mismatched).toEqual([]);
  });

  it('모든 도구에 하나 이상의 용도가 있다', () => {
    const empty = tools
      .filter((tool) => capabilityFor(tool.slug).operations.length === 0)
      .map((tool) => tool.slug);
    expect(empty).toEqual([]);
  });

  it('모든 용도가 실제 도구에서 쓰인다', () => {
    const used = new Set(tools.flatMap((tool) => capabilityFor(tool.slug).operations));
    const unused = OPERATIONS.map((operation) => operation.id).filter((id) => !used.has(id));
    expect(unused).toEqual([]);
  });

  it('파일을 받는 도구는 입력 형식을 선언한다', () => {
    const valueTools = new Set(['calculator', 'percent-calc', 'date-calc', 'unit-convert']);
    const noInput = tools
      .filter((tool) => {
        if (valueTools.has(tool.slug)) return false;
        const capability = capabilityFor(tool.slug);
        return (
          capability.operations.some((operation) => operation !== 'create') &&
          capability.accepts.length === 0
        );
      })
      .map((tool) => tool.slug);
    expect(noInput).toEqual([]);
  });
});
