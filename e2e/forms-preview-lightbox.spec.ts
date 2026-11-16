import { expect, test } from '@playwright/test';

test.describe('양식 미리보기 크게 보기', () => {
  test('클릭하면 블러 배경의 라이트박스에서 확대·쪽 이동한다', async ({ page }) => {
    await page.goto('/forms/travel-report/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-page-label]')).toHaveText('1 / 2');

    await page.locator('[data-preview-stage]').click();
    const dialog = page.locator('[data-doc-lightbox]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-lightbox-page]')).toHaveText('1 / 2');
    await expect(page.locator('[data-lightbox-zoom]')).toHaveText('135%');

    const backdrop = await dialog.evaluate(
      (element) => getComputedStyle(element, '::backdrop').backdropFilter,
    );
    expect(backdrop).toContain('blur');

    await page.locator('[data-lightbox-zoom-in]').click();
    await expect(page.locator('[data-lightbox-zoom]')).not.toHaveText('135%');
    await page.locator('[data-lightbox-next]').click();
    await expect(page.locator('[data-lightbox-page]')).toHaveText('2 / 2');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
