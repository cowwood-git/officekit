import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('교육 신청서 양식', () => {
  test('교육 정보와 비용이 들어간다', async ({ page }) => {
    await page.goto('/forms/training-request/');
    await expect(page.getByRole('heading', { name: '교육 신청서 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-computed="costLabel"]')).toHaveText('450,000원');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('교육 신청서');
    await expect(preview).toContainText('데이터 분석 실무');
    await expect(preview).toContainText('450,000원');
    await expect(preview).toContainText('교육 목적');
  });

  test('PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/training-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('교육 신청서');
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
    await page.goto('/forms/training-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/교육 신청서.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('데이터 분석 실무');
    expect(section).not.toContain('<hp:pic ');
  });
});
