import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test.describe('주간업무보고', () => {
  test('예시를 채우면 업무 표와 진행률이 들어간다', async ({ page }) => {
    await page.goto('/forms/weekly-report/');
    await expect(page.getByRole('heading', { name: '주간업무보고 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-row]')).toHaveCount(3);

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('주간업무보고');
    await expect(preview).toContainText('11월 정산 마감');
    await expect(preview).toContainText('100%');
  });

  test('주간업무보고 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/weekly-report/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('주간업무보고');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
  });
});

test.describe('인수인계서', () => {
  test('예시를 채우면 인수인계자와 확인 항목이 들어간다', async ({ page }) => {
    await page.goto('/forms/handover/');
    await expect(page.getByRole('heading', { name: '인수인계서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('인수인계서');
    await expect(preview).toContainText('김옷깃');
    await expect(preview).toContainText('박인수');

    const label = (await page.locator('[data-page-label]').textContent()) ?? '1 / 1';
    const total = Number(label.split('/')[1]?.trim() ?? '1');
    for (let index = 1; index < total; index += 1) {
      await page.locator('[data-page-next]').click();
    }
    await expect(preview).toContainText('확인 항목');
    await expect(preview).toContainText('업무 목록과 담당자 정리');
  });

  test('인수인계서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/handover/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('인수인계서');
  });
});
