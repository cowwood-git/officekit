import { expect, test } from '@playwright/test';

test.describe('저장 공간 관리', () => {
  test('누끼 모델 캐시를 보여주고 삭제한다', async ({ page }) => {
    await page.goto('/storage/');
    await page.evaluate(async () => {
      const cache = await caches.open('officekit-bg');
      await cache.put(
        '/bg/1.7.0/model.bin',
        new Response('x', { headers: { 'content-length': '1024' } }),
      );
      await cache.put(
        '/bg/ort-1.21.0/engine.wasm',
        new Response('y', { headers: { 'content-length': '2048' } }),
      );
    });
    await page.click('#storage-refresh');

    await expect(page.locator('#storage-caches')).toContainText('누끼 AI 모델');
    await expect(page.locator('#storage-caches')).toContainText('누끼 실행 엔진');
    await expect(page.locator('[data-storage-group="bg-model"]')).toBeEnabled();
    await expect(page.locator('#storage-status')).toContainText('저장되어 있습니다');

    page.once('dialog', (dialog) => void dialog.accept());
    await page.click('[data-storage-group="bg-model"]');
    await expect(page.locator('#storage-status')).toContainText('삭제했습니다');
    await expect(page.locator('#storage-caches')).not.toContainText('누끼 AI 모델');
    await expect(page.locator('#storage-caches')).toContainText('누끼 실행 엔진');

    const remains = await page.evaluate(async () => {
      const cache = await caches.open('officekit-bg');
      return (await cache.keys()).map((request) => new URL(request.url).pathname);
    });
    expect(remains).toContain('/bg/ort-1.21.0/engine.wasm');
    expect(remains).not.toContain('/bg/1.7.0/model.bin');
  });
});
