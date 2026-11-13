import { describe, expect, it } from 'vitest';
import { APP_FLOWS } from '../src/data/app-flows';
import { tools } from '../src/data/tools';

describe('APP_FLOWS', () => {
  it('모든 도구에 입력 → 결과 한 줄이 있다', () => {
    const missing = tools.filter((tool) => !APP_FLOWS[tool.slug]).map((tool) => tool.slug);
    expect(missing).toEqual([]);
  });

  it('없는 도구를 가리키지 않는다', () => {
    const slugs = new Set(tools.map((tool) => tool.slug));
    expect(Object.keys(APP_FLOWS).filter((slug) => !slugs.has(slug))).toEqual([]);
  });
});
