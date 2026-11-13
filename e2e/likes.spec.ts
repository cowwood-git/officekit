import { expect, test } from '@playwright/test';

test.describe('도구 좋아요', () => {
  test('도구 페이지에서 좋아요를 누르고 취소한다', async ({ page }) => {
    let count = 12;
    let liked = false;
    await page.route('**/api/likes**', async (route) => {
      const request = route.request();
      if (request.method() === 'GET') {
        const slugs = new URL(request.url()).searchParams.get('slugs')?.split(',') ?? [];
        await route.fulfill({
          json: { counts: Object.fromEntries(slugs.map((slug) => [slug, count])) },
        });
        return;
      }
      const body = request.postDataJSON() as { action?: string };
      liked = body.action === 'like';
      count = Math.max(0, count + (liked ? 1 : -1));
      await route.fulfill({ json: { slug: 'pdf-merge', count, liked } });
    });

    await page.goto('/tools/pdf-merge/');
    const button = page.locator('.like-btn');
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('[data-like-count]')).toHaveText('12');

    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-like-count]')).toHaveText('13');
    await expect(page.locator('.like-status')).toHaveText('좋아요를 남겼습니다. 현재 13개입니다.');

    await page.waitForFunction(() =>
      JSON.parse(localStorage.getItem('officekit-liked-tools') ?? '[]').includes('pdf-merge'),
    );
    await page.reload();
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-like-count]')).toHaveText('13');

    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('[data-like-count]')).toHaveText('12');
    await expect(page.locator('.like-status')).toHaveText('좋아요를 취소했습니다.');
  });

  test('API가 없으면 좋아요 버튼을 숨긴다', async ({ page }) => {
    await page.route('**/api/likes**', (route) => route.abort());
    await page.goto('/tools/pdf-merge/');
    await expect(page.locator('.like-wrap')).toBeHidden();
  });

  test('카탈로그를 좋아요순으로 정렬한다', async ({ page }) => {
    await page.route('**/api/likes**', async (route) => {
      const slugs = new URL(route.request().url()).searchParams.get('slugs')?.split(',') ?? [];
      const counts: Record<string, number> = {};
      for (const slug of slugs) counts[slug] = slug === 'csv-pdf' ? 99 : 0;
      await route.fulfill({ json: { counts } });
    });

    await page.goto('/tools/');
    const sort = page.locator('#catalog-sort');
    await expect(sort).toBeVisible();
    await sort.selectOption('likes');
    await expect(page).toHaveURL(/sort=likes/);
    await expect(page.locator('#catalog-grid [data-tile-wrap]:visible').first()).toHaveAttribute(
      'data-slug',
      'csv-pdf',
    );
  });
});

test.describe('좋아요 많은 도구', () => {
  test('충분한 좋아요가 쌓이면 홈에 상위 도구를 보여 준다', async ({ page }) => {
    const items = Array.from({ length: 20 }, (_, index) => ({
      slug: `tool-${index}`,
      count: 3 + index,
      title: `도구 ${index}`,
      summary: '요약',
      path: `/tools/tool-${index}/`,
      iconName: 'file',
    }));
    await page.route('**/api/likes/top**', (route) => route.fulfill({ json: { items } }));
    await page.goto('/');
    const section = page.locator('[data-home-top-likes]');
    await expect(section).toBeVisible();
    await expect(section.locator('.home-top-like-card')).toHaveCount(8);

    await page.locator('[data-home-op="convert"]').click();
    await expect(section).toBeHidden();
  });

  test('좋아요가 부족하면 홈 섹션을 숨긴다', async ({ page }) => {
    await page.route('**/api/likes/top**', (route) => route.fulfill({ json: { items: [] } }));
    await page.goto('/');
    await expect(page.locator('[data-home-top-likes]')).toBeHidden();
  });

  test('함께 좋아한 도구를 도구 페이지에 보여 준다', async ({ page }) => {
    await page.route('**/api/likes/related**', (route) =>
      route.fulfill({
        json: {
          items: [
            {
              slug: 'csv-pdf',
              count: 5,
              overlap: 3,
              title: 'CSV·XLS·XLSX → PDF',
              summary: '표를 PDF로',
              path: '/tools/csv-pdf/',
              iconName: 'file-csv',
            },
            {
              slug: 'pdf-split',
              count: 4,
              overlap: 2,
              title: 'PDF 나누기',
              summary: 'PDF를 나눕니다',
              path: '/tools/pdf-split/',
              iconName: 'scissors',
            },
          ],
        },
      }),
    );
    await page.goto('/tools/pdf-merge/');
    const section = page.locator('[data-related-likes]');
    await expect(section).toBeVisible();
    await expect(section.locator('li')).toHaveCount(2);
    await expect(section.locator('a').first()).toHaveAttribute('href', '/tools/csv-pdf/');
  });
});
