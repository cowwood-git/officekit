import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('급여명세서 양식', () => {
  test('지급·공제 합계와 실수령액을 계산한다', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/forms/payslip/');
    await expect(page.getByRole('heading', { name: '급여명세서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-field="name"]')).toHaveValue('김옷깃');
    await expect(page.locator('[data-computed="totalEarnings"]')).toHaveText('3,350,000원');
    await expect(page.locator('[data-computed="totalDeductions"]')).toHaveText('313,000원');
    await expect(page.locator('[data-computed="netPay"]')).toHaveText('3,037,000원');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('급여명세서');
    await expect(preview).toContainText('3,350,000원');
    await expect(preview).toContainText('3,037,000원');
    await expect(preview).toContainText('삼백삼만');
    expect(errors).toEqual([]);
  });

  test('공제가 지급보다 크면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/payslip/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const deduction = page
      .locator('[data-row-group="deductions"] [data-row-field="amount"]')
      .first();
    await deduction.fill('9999999');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '공제 합계가 지급 합계보다 클 수 없습니다',
    );
  });

  test('PDF를 내려받으면 A4 한 장짜리 급여명세서가 만들어진다', async ({ page }) => {
    await page.goto('/forms/payslip/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('급여명세서');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('한글 파일은 글자·표 개체로 만든다', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/forms/payslip/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/급여명세서.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('3,037,000원');
    expect(section).not.toContain('<hp:pic ');
  });
});
