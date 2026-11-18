import { expect, test } from '@playwright/test';

test.describe('내 양식', () => {
  test('즐겨찾기와 최근 본 양식을 저장하고 다시 보여준다', async ({ page }) => {
    await page.goto('/forms/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.goto('/forms/resignation/');
    const favorite = page.locator('[data-form-favorite]');
    await expect(favorite).toHaveAttribute('aria-pressed', 'false');
    await favorite.click();
    await expect(favorite).toHaveAttribute('aria-pressed', 'true');
    await expect(favorite).toContainText('즐겨찾기됨');

    await page.goto('/forms/leave-request/');
    await expect(page.locator('[data-form-favorite]')).toHaveAttribute('aria-pressed', 'false');

    await page.goto('/forms/');
    const myForms = page.locator('[data-my-forms]');
    await expect(myForms).toBeVisible();
    await expect(page.locator('[data-my-favorites] [data-my-form="resignation"]')).toBeVisible();
    await expect(page.locator('[data-my-recent] [data-my-form="leave-request"]')).toBeVisible();
    await expect(page.locator('[data-my-favorites]')).toContainText('사직서');
    await expect(page.locator('[data-my-recent]')).toContainText('휴가신청서');

    await page.reload();
    await expect(page.locator('[data-my-favorites] [data-my-form="resignation"]')).toBeVisible();

    await page.getByRole('button', { name: '최근 기록 지우기' }).click();
    await expect(page.locator('[data-my-recent]')).toBeHidden();
    await expect(page.locator('[data-my-favorites] [data-my-form="resignation"]')).toBeVisible();
  });

  test('즐겨찾기를 다시 누르면 해제된다', async ({ page }) => {
    await page.goto('/forms/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/forms/leave-request/');

    const favorite = page.locator('[data-form-favorite]');
    await favorite.click();
    await expect(favorite).toHaveAttribute('aria-pressed', 'true');
    await favorite.click();
    await expect(favorite).toHaveAttribute('aria-pressed', 'false');
    await expect(favorite).toContainText('즐겨찾기');
  });
});
