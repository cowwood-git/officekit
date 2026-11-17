import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('제안서 표지 양식', () => {
  test('제목과 제안 정보가 들어간다', async ({ page }) => {
    await page.goto('/forms/proposal-cover/');
    await expect(page.getByRole('heading', { name: '제안서 표지 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('홈페이지 리뉴얼 제안');
    await expect(preview).toContainText('거래처 주식회사');
    await expect(preview).toContainText('제안 요약');
    await expect(preview).toContainText('2026. 12. 31.');
  });

  test('PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/proposal-cover/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('제안서 표지');
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
    await page.goto('/forms/proposal-cover/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/제안서 표지.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('홈페이지 리뉴얼 제안');
    expect(section).not.toContain('<hp:pic ');
  });
});
