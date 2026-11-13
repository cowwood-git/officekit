import { expect, test } from '@playwright/test';

test.describe('비밀번호 생성기', () => {
  test('문자 조합 비밀번호를 만들고 복사한다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/tools/password-generator/');

    const first = (await page.locator('#pw-output').textContent()) ?? '';
    expect(first).toHaveLength(16);
    await expect(page.locator('#pw-strength')).toContainText('비트');

    await page.click('#pw-generate');
    const second = (await page.locator('#pw-output').textContent()) ?? '';
    expect(second).not.toBe(first);

    await page.click('#pw-copy');
    await expect(page.locator('#pw-status')).toContainText('복사');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(second);
  });

  test('패스프레이즈 모드로 단어를 만든다', async ({ page }) => {
    await page.goto('/tools/password-generator/');
    await page.selectOption('#pw-mode', 'words');
    await expect(page.locator('#pw-word-options')).toBeVisible();
    await expect(page.locator('#pw-char-options')).toBeHidden();

    const value = (await page.locator('#pw-output').textContent()) ?? '';
    expect(value.split('-')).toHaveLength(6);

    await page.selectOption('#pw-separator', '.');
    const dotted = (await page.locator('#pw-output').textContent()) ?? '';
    expect(dotted.split('.')).toHaveLength(6);
  });

  test('문자 종류를 모두 끄면 안내한다', async ({ page }) => {
    await page.goto('/tools/password-generator/');
    for (const id of ['pw-lower', 'pw-upper', 'pw-digits', 'pw-symbols']) {
      await page.uncheck(`#${id}`);
    }
    await expect(page.locator('#pw-error')).toBeVisible();
    await expect(page.locator('#pw-output')).toContainText('문자 종류');
    await expect(page.locator('#pw-copy')).toBeDisabled();
  });

  test('비슷한 글자를 제외할 수 있다', async ({ page }) => {
    await page.goto('/tools/password-generator/');
    await page.check('#pw-ambiguous');
    const value = (await page.locator('#pw-output').textContent()) ?? '';
    expect(value).not.toMatch(/[Il1O0o]/);
  });
});
