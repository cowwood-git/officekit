import { expect, test } from '@playwright/test';

test.describe('도구 준비 게이트', () => {
  test('준비가 끝나기 전에는 본문을 비활성화하고, 끝나면 연다', async ({ page }) => {
    await page.goto('/tools/pdf-merge/', { waitUntil: 'commit' });
    const body = page.locator('[data-tool-body]');

    await expect(body).toHaveClass(/is-loading/);
    await expect(body).toHaveAttribute('aria-busy', 'true');
    await expect(body).toHaveJSProperty('inert', true);

    await expect(body).not.toHaveClass(/is-loading/, { timeout: 5000 });
    await expect(body).not.toHaveAttribute('aria-busy');
    await expect(body).toHaveJSProperty('inert', false);
    await expect(page.locator('[data-tool-loading-status]')).toHaveText('도구 준비 완료');
  });
});
