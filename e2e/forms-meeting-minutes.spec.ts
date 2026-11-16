import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.describe('회의록 양식', () => {
  test('예시를 채우면 결정 사항과 후속 조치가 문서에 들어간다', async ({ page }) => {
    await page.goto('/forms/meeting-minutes/');
    await expect(page.getByRole('heading', { name: '회의록 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-field="place"]')).toHaveValue('본사 3층 회의실');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('회의록');
    await expect(preview).toContainText('2026. 11. 15. 14:00~15:00');
    await expect(preview).toContainText('결정 사항');
    await expect(preview).toContainText('후속 조치');
    await expect(preview).toContainText('박회의');
  });

  test('회의록 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/meeting-minutes/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('회의록');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  });
});

test('양식관에 휴가신청서와 회의록이 보인다', async ({ page }) => {
  await page.goto('/forms/');
  await expect(page.getByRole('heading', { name: '업무 양식' })).toBeVisible();
  await expect(page.locator('.form-card[href="/forms/leave-request/"]')).toBeVisible();
  await expect(page.locator('.form-card[href="/forms/meeting-minutes/"]')).toBeVisible();
  await expect(page.locator('.form-card[href="/forms/quote/"]')).toBeVisible();
  await expect(page.locator('.form-card[href="/forms/statement/"]')).toBeVisible();
});
