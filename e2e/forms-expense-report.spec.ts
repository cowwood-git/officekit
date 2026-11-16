import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test.describe('지출결의서 양식', () => {
  test('예시를 채우면 지출 합계와 일금이 계산된다', async ({ page }) => {
    await page.goto('/forms/expense-report/');
    await expect(page.getByRole('heading', { name: '지출결의서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-field="name"]')).toHaveValue('김옷깃');
    await expect(page.locator('[data-row]')).toHaveCount(3);
    await expect(page.locator('[data-row-summary="expenses"]')).toHaveText('95,000원');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('지출결의서');
    await expect(preview).toContainText('회의 다과');
    await expect(preview).toContainText('95,000원');
    await expect(preview).toContainText('구만오천 원정');
  });

  test('지출 항목을 추가·삭제하면 합계가 따라 바뀐다', async ({ page }) => {
    await page.goto('/forms/expense-report/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    await page.click('[data-row-add]');
    const last = page.locator('[data-row]').last();
    await last.locator('[data-row-field="item"]').fill('추가 지출');
    await last.locator('[data-row-field="amount"]').fill('50000');
    await expect(page.locator('[data-row-summary="expenses"]')).toHaveText('145,000원');

    await last.locator('[data-row-remove]').click();
    await expect(page.locator('[data-row]')).toHaveCount(3);
    await expect(page.locator('[data-row-summary="expenses"]')).toHaveText('95,000원');
  });

  test('지출결의서 PDF를 한 장으로 내려받는다', async ({ page }) => {
    await page.goto('/forms/expense-report/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('지출결의서');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('붙임 배치로 바꾸면 본문과 지출 내역서를 분리한다', async ({ page }) => {
    await page.goto('/forms/expense-report/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.check('input[name="items-layout"][value="attachment"]');
    await expect(page.locator('[data-page-label]')).toHaveText('1 / 2');
    await expect(page.locator('[data-preview-stage] svg')).toContainText('붙임 1. 지출 내역서');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(2);
  });

  test('필수 항목이 없으면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/expense-report/');
    await page.fill('[data-field="name"]', '');
    await page.fill('[data-field="purpose"]', '');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const error = page.locator('[data-form-error]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('성명');
  });
});
