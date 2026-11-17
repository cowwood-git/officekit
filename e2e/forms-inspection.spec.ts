import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('검수확인서 양식', () => {
  test('품목 수와 검수 수량 합계를 계산한다', async ({ page }) => {
    await page.goto('/forms/inspection/');
    await expect(page.getByRole('heading', { name: '검수확인서 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-computed="itemCountLabel"]')).toHaveText('3개');
    await expect(page.locator('[data-computed="totalQuantityLabel"]')).toHaveText('16개');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('검수확인서');
    await expect(preview).toContainText('조건부 합격');
    await expect(preview).toContainText('16개');
    await expect(preview).toContainText('1박스 부족');
  });

  test('검수확인서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/inspection/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('검수확인서');
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
    await page.goto('/forms/inspection/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/검수확인서.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('A4 복사용지');
    expect(section).toContain('조건부 합격');
    expect(section).not.toContain('<hp:pic ');
  });

  test('검수 수량이 0이면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/inspection/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-row] [data-row-field="inspected"]').first().fill('0');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '검수 수량은 1 이상이어야 합니다.',
    );
  });
});
