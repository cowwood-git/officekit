import { expect, test } from '@playwright/test';

const shortcut = process.platform === 'darwin' ? 'Meta+K' : 'Control+K';

test.describe('양식 카테고리', () => {
  test('양식관에서 5개 카테고리와 전체 양식을 보여준다', async ({ page }) => {
    await page.goto('/forms/');
    await expect(page.getByRole('heading', { name: '업무 양식', exact: true })).toBeVisible();
    await expect(page.locator('.form-category')).toHaveCount(5);
    await expect(page.locator('.form-category-chip')).toHaveCount(6);
    await expect(page.locator('.form-card')).toHaveCount(34);

    await page.locator('[data-form-filter="people"]').dispatchEvent('click');
    await expect(page).toHaveURL(/\/forms\/#people$/);
    await expect(page.locator('#people')).toBeVisible();
    await expect(page.locator('#people h3')).toHaveText('인사·총무');
    await expect(page.locator('#people .form-card')).toHaveCount(11);
  });

  test('양식관과 양식 작성 페이지의 좌우 폭이 같다', async ({ page }) => {
    await page.goto('/forms/');
    const hub = await page.locator('.container').first().boundingBox();
    await page.goto('/forms/leave-request/');
    const detail = await page.locator('.container').first().boundingBox();
    const input = await page.locator('.form-input').boundingBox();
    const preview = await page.locator('.form-preview').boundingBox();

    expect(Math.round(hub?.x ?? 0)).toBe(Math.round(detail?.x ?? 0));
    expect(Math.round(hub?.width ?? 0)).toBe(Math.round(detail?.width ?? 0));
    expect(input?.width ?? 0).toBeLessThan(preview?.width ?? 0);
  });

  test('양식관에서 이름과 쓰임새로 검색한다', async ({ page }) => {
    await page.goto('/forms/');
    const input = page.locator('#forms-search');
    await input.fill('휴가');
    await expect(page.locator('.form-card:visible')).toHaveCount(1);
    await expect(page.locator('.form-card:visible')).toContainText('휴가신청서');
    await expect(page.locator('#forms-search-count')).toContainText('1개 양식');
    await expect(page.locator('#people')).toBeVisible();
    await expect(page.locator('#money')).toBeHidden();

    await page.locator('#forms-search-clear').click();
    await expect(page.locator('.form-card:visible')).toHaveCount(34);
    await expect(page.locator('#forms-search-count')).toHaveText('34개 양식');
  });
});

test.describe('도구·양식 검색', () => {
  test('양식 이름으로 검색해 바로 이동한다', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press(shortcut);
    const input = page.locator('#search-input');
    await input.fill('휴가');

    const first = page.locator('#search-results a').first();
    await expect(first).toContainText('휴가신청서');
    await expect(first.locator('.result-kind-form')).toHaveText('양식');
    await expect(page.locator('#search-count')).toContainText('양식 1');

    await page.keyboard.press('Enter');
    await page.waitForURL('**/forms/leave-request/');
    await expect(page.locator('h1')).toContainText('휴가신청서');
  });

  test('카테고리 이름으로도 검색한다', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press(shortcut);
    const input = page.locator('#search-input');
    await input.fill('인사');

    await expect(page.locator('#search-results a', { hasText: '인사·총무 양식' })).toBeVisible();
    await expect(page.locator('#search-results .result-kind-category').first()).toHaveText(
      '카테고리',
    );

    await page.locator('#search-results a', { hasText: '인사·총무 양식' }).click();
    await expect(page).toHaveURL(/\/forms\/#people$/);
  });
});
