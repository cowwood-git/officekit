import { expect, test } from '@playwright/test';

const shortcut = process.platform === 'darwin' ? 'Meta+K' : 'Control+K';

test.describe('검색', () => {
  test('⌘K 검색으로 도구를 찾고 이동한다', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press(shortcut);
    const dialog = page.locator('#site-search');
    await expect(dialog).toBeVisible();

    const input = page.locator('#search-input');
    await input.fill('pdf');
    await expect(page.locator('#search-count')).toContainText('8개 결과');
    await expect(page.locator('#search-results li')).toHaveCount(8);
    await expect(page.locator('#search-results a').first()).toContainText('PDF 합치기');

    await input.press('ArrowDown');
    await input.press('Enter');
    await page.waitForURL('**/tools/pdf-split/');
    await expect(page.locator('h1')).toContainText('PDF 나누기');

    await page.goto('/');
    await page.keyboard.press(shortcut);
    await page.locator('#search-input').fill('zzzz-no-result');
    await expect(page.locator('#search-count')).toContainText('결과가 없습니다');
    await page.keyboard.press('Escape');
    await expect(page.locator('#site-search')).toBeHidden();
  });

  test('결과 수가 바뀌어도 검색창 크기가 흔들리지 않는다', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press(shortcut);
    const dialog = page.locator('#site-search');
    const input = page.locator('#search-input');

    await input.fill('pdf');
    const before = await dialog.boundingBox();
    await input.fill('pdfx');
    const after = await dialog.boundingBox();

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(Math.round(after?.y ?? 0)).toBe(Math.round(before?.y ?? 0));
    expect(Math.round(after?.height ?? 0)).toBe(Math.round(before?.height ?? 0));
  });
});
