import { expect, test } from '@playwright/test';

test.describe('테마', () => {
  test('기본은 라이트 모드이고 다크 모드로 전환·유지된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const lightBackground = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(lightBackground).toBe('rgb(251, 250, 247)');

    const toggle = page.locator('#theme-toggle');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('officekit-theme')))
      .toBe('dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-label', '다크 모드로 전환');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('officekit-theme')))
      .toBe('light');
  });

  test('테마 전환 후 도구 화면 색이 바뀐다', async ({ page }) => {
    await page.goto('/tools/pdf-merge/');
    const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const dropzone = () =>
      page.evaluate(() => {
        const element = document.querySelector('.dropzone');
        return element ? getComputedStyle(element).backgroundColor : '';
      });
    expect(await background()).toBe('rgb(251, 250, 247)');
    await expect.poll(dropzone).toBe('rgb(244, 241, 234)');

    await page.click('#theme-toggle');
    await expect.poll(background).toBe('rgb(16, 20, 24)');
  });
});
