import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/**
 * 한 줄에 나란히 놓인 입력칸(.field)의 «입력 상자» 위치·높이가 어긋나지 않는지 전 도구를 잰다.
 *
 * 배경: 옆 칸 안내문이 두 줄이 되면 짧은 칸의 입력 상자만 늘어나 높이·위치가 달라 보였다
 * (pdf-to-jpg 해상도 칸, 2026-11-13). 파일을 넣어야 보이는 설정 패널도 재기 위해 hidden 을 걷고
 * 접힌 세부 설정(details)도 펼친 뒤 잰다. 화면 폭은 여러 칸이 한 줄에 놓이는 데스크톱 기준.
 */

const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
const toolPaths = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/tools\/[^<]+)<\/loc>/g)]
  .map((m) => m[1] as string)
  .filter((path) => path.split('/').filter(Boolean).length === 2);

const TOLERANCE = 2;

test.use({ viewport: { width: 1280, height: 900 } });

test('같은 줄 입력칸의 상자 위치·높이가 맞는다', async ({ page }) => {
  test.setTimeout(300_000);
  expect(toolPaths.length).toBeGreaterThan(50);
  const problems: string[] = [];

  for (const path of toolPaths) {
    await page.goto(path);
    const found = await page.evaluate((tolerance) => {
      const main = document.querySelector('main') ?? document.body;
      for (const el of main.querySelectorAll('[hidden]')) el.removeAttribute('hidden');
      for (const el of main.querySelectorAll('details')) (el as HTMLDetailsElement).open = true;

      const CONTROL =
        'input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]):not([type=range]):not([type=color]), select';
      const out: string[] = [];
      const parents = new Set<Element>();
      for (const field of main.querySelectorAll('.field')) {
        if (field.parentElement) parents.add(field.parentElement);
      }
      for (const parent of parents) {
        const fields = [...parent.children].filter((el) => el.classList.contains('field'));
        if (fields.length < 2) continue;
        // 같은 줄 = 세로로 겹치는 칸끼리(아래 정렬된 줄은 윗변이 달라도 같은 줄이다).
        const rows: Element[][] = [];
        const visible = fields
          .map((field) => ({ field, rect: field.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width > 0 && rect.height > 0)
          .sort((a, b) => a.rect.top - b.rect.top);
        let current: { bottom: number; items: Element[] } | undefined;
        for (const { field, rect } of visible) {
          if (current && rect.top < current.bottom - 1) {
            current.items.push(field);
            current.bottom = Math.max(current.bottom, rect.bottom);
          } else {
            current = { bottom: rect.bottom, items: [field] };
            rows.push(current.items);
          }
        }
        for (const row of rows) {
          if (row.length < 2) continue;
          const boxes = row
            .map((field) => {
              const control = field.querySelector(CONTROL);
              if (!control) return undefined;
              const rect = control.getBoundingClientRect();
              const label = field.querySelector('label')?.textContent?.trim() ?? control.id;
              return { label, top: rect.top, height: rect.height };
            })
            .filter((box): box is { label: string; top: number; height: number } => Boolean(box));
          if (boxes.length < 2) continue;
          const tops = boxes.map((box) => box.top);
          const heights = boxes.map((box) => box.height);
          if (
            Math.max(...tops) - Math.min(...tops) > tolerance ||
            Math.max(...heights) - Math.min(...heights) > tolerance
          ) {
            out.push(
              boxes
                .map(
                  (box) => `${box.label}(top ${Math.round(box.top)}, h ${Math.round(box.height)})`,
                )
                .join(' | '),
            );
          }
        }
      }
      return out;
    }, TOLERANCE);
    for (const row of found) problems.push(`${path}: ${row}`);
  }

  expect(problems, problems.join('\n')).toEqual([]);
});
