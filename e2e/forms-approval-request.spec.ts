import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test.describe('품의서 양식', () => {
  test('예시를 채우면 금액과 일금이 문서에 반영된다', async ({ page }) => {
    await page.goto('/forms/approval-request/');
    await expect(page.getByRole('heading', { name: '품의서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-field="name"]')).toHaveValue('김옷깃');
    await expect(page.locator('[data-field="title"]')).toHaveValue('11월 팀 워크숍 운영비 품의');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('품의서');
    await expect(preview).toContainText('1,200,000원');
    await expect(preview).toContainText('일백이십만 원정');
  });

  test('금액을 바꾸면 미리보기가 따라 바뀐다', async ({ page }) => {
    await page.goto('/forms/approval-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.fill('[data-field="amount"]', '2000000');
    await expect(page.locator('[data-preview-stage] svg')).toContainText('2,000,000원');
    await expect(page.locator('[data-preview-stage] svg')).toContainText('이백만 원정');
  });

  test('품의서 PDF를 한 장으로 내려받는다', async ({ page }) => {
    await page.goto('/forms/approval-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('품의서');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('필수 항목이 없으면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/approval-request/');
    await page.fill('[data-field="name"]', '');
    await page.fill('[data-field="title"]', '');
    await page.fill('[data-field="amount"]', '');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const error = page.locator('[data-form-error]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('성명');
  });
});
