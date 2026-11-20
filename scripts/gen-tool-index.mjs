// 좋아요 Function용 도구 색인(functions/_lib/tool-index.json)을 src/data/tools.ts에서 만든다.
// Function이 tools.ts 전체(FAQ·본문 포함 4천여 줄)를 묶으면 Worker가 368KB가 된다. 필요한 건
// 이름·요약뿐이라 그것만 뽑는다. prebuild에서 다시 만들고, tests/tool-index.test.ts가 어긋남을 잡는다.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
export const OUT = join(ROOT, 'functions', '_lib', 'tool-index.json');

export async function buildToolIndex() {
  const { tools } = await import('../src/data/tools.ts');
  return Object.fromEntries(
    tools.map((tool) => [tool.slug, { title: tool.title.ko, summary: tool.summary.ko }]),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(OUT, `${JSON.stringify(await buildToolIndex(), null, 2)}\n`);
  console.log('도구 색인:', OUT.replace(ROOT, ''));
}
