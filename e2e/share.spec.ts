import { expect, test } from '@playwright/test';

test.describe('도구·양식 공유', () => {
  test('도구 공유 패널에서 링크를 복사한다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/tools/pdf-merge/');
    await page.locator('.share-toggle').click();

    const dialog = page.getByRole('dialog', { name: '이 도구 추천하기' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-share-url-input]')).toHaveValue(
      'https://officekit.kr/tools/pdf-merge/',
    );

    await page.getByRole('button', { name: '복사', exact: true }).click();
    await expect(page.locator('[data-share-status]')).toContainText('링크를 복사했습니다');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe('https://officekit.kr/tools/pdf-merge/');
  });

  test('양식 공유 패널은 현재 양식 링크를 보여 주고 Escape로 닫힌다', async ({ page }) => {
    await page.goto('/forms/leave-request/');
    const toggle = page.locator('.share-toggle');
    await toggle.click();

    const dialog = page.getByRole('dialog', { name: '이 양식 추천하기' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-share-url-input]')).toHaveValue(
      'https://officekit.kr/forms/leave-request/',
    );
    await expect(dialog).toContainText('입력한 내용은 링크에 담기지 않습니다');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('공유 시트가 있으면 OS 공유를 연다', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: ShareData) => {
          (window as unknown as { __shared?: ShareData }).__shared = data;
        },
      });
    });
    await page.goto('/tools/pdf-merge/');
    await page.locator('.share-toggle').click();

    const native = page.getByRole('button', { name: '공유 시트 열기' });
    await expect(native).toBeVisible();
    await native.click();

    const shared = await page.evaluate(
      () => (window as unknown as { __shared?: ShareData }).__shared,
    );
    expect(shared?.title).toBe('PDF 합치기');
    expect(shared?.text).toContain('PDF 합치기');
    expect(shared?.url).toBe('https://officekit.kr/tools/pdf-merge/');
  });

  test('모바일에서는 공유 패널이 화면 안에 들어온다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/forms/leave-request/');
    await page.locator('.share-toggle').click();

    const dialog = page.getByRole('dialog', { name: '이 양식 추천하기' });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });
});
