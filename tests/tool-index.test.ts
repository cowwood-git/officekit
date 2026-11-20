import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { tools } from '../src/data/tools';

describe('좋아요 Function 도구 색인', () => {
  it('functions/_lib/tool-index.json이 src/data/tools.ts와 같다(어긋나면 npm run build 또는 node scripts/gen-tool-index.mjs)', async () => {
    const index = JSON.parse(
      await readFile(new URL('../functions/_lib/tool-index.json', import.meta.url), 'utf8'),
    ) as Record<string, { title: string; summary: string }>;
    const expected = Object.fromEntries(
      tools.map((tool) => [tool.slug, { title: tool.title.ko, summary: tool.summary.ko }]),
    );
    expect(index).toEqual(expected);
  });
});
