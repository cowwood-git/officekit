import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEMO_TYPES, demoTypeFor } from '../src/data/app-demos';
import { tools } from '../src/data/tools';

describe('홈 hover 데모', () => {
  it('도구마다 고유한 데모를 쓴다(두 도구가 같은 애니메이션을 공유하지 않는다)', () => {
    const owners = new Map<string, string[]>();
    for (const tool of tools) {
      const type = demoTypeFor(tool.slug);
      owners.set(type, [...(owners.get(type) ?? []), tool.slug]);
    }
    const shared = [...owners].filter(([, slugs]) => slugs.length > 1);
    expect(shared).toEqual([]);
  });

  it('모든 데모 유형을 실제로 쓰고, 그림이 있다', () => {
    const used = new Set(tools.map((tool) => demoTypeFor(tool.slug)));
    const svg = readFileSync(new URL('../src/components/AppDemo.astro', import.meta.url), 'utf8');
    for (const type of DEMO_TYPES) {
      expect(used.has(type), `${type} 를 쓰는 도구가 없다`).toBe(true);
      expect(svg.includes(`type === '${type}'`), `${type} 그림이 없다`).toBe(true);
    }
  });
});
