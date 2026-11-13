import { expect, test } from '@playwright/test';

test.describe('PWA 오프라인', () => {
  test('셸 캐시·오프라인 폴백', async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect
      .poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
      .toBe(true);

    const cached = await page.evaluate(async () => {
      const keys = await caches.keys();
      const cache = keys[0] ? await caches.open(keys[0]) : null;
      const requests = cache ? await cache.keys() : [];
      return requests.map((request) => new URL(request.url).pathname);
    });
    expect(cached).toEqual(expect.arrayContaining(['/', '/offline/']));

    await context.setOffline(true);

    await page.reload();
    await expect(page.locator('h1')).toContainText('업무 도구');

    await page.goto('/tools/pdf-compress/');
    await expect(page.locator('h1')).toContainText('인터넷에 연결되어 있지 않습니다');

    await context.setOffline(false);
  });

  test('manifest와 아이콘', async ({ request }) => {
    for (const path of ['/manifest.webmanifest', '/icon-192.png', '/icon-512.png']) {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
    }
    const manifest = await (await request.get('/manifest.webmanifest')).json();
    expect(manifest.name).toContain('옷깃');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
  });
});
