import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('클레임 접수대장 양식', () => {
  test('접수 건수와 처리 중 건수를 계산한다', async ({ page }) => {
    await page.goto('/forms/claim-log/');
    await expect(page.getByRole('heading', { name: '클레임 접수대장 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-computed="totalLabel"]')).toHaveText('4건');
    await expect(page.locator('[data-computed="openLabel"]')).toHaveText('3건');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('클레임 접수대장');
    await expect(preview).toContainText('납품 수량이 주문보다 1박스 부족');
    await expect(preview).toContainText('4건');
    await expect(preview).toContainText('3건');
  });

  test('PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/claim-log/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('클레임 접수대장');
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
    await page.goto('/forms/claim-log/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/클레임 접수대장.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('거래처 주식회사');
    expect(section).not.toContain('<hp:pic ');
  });
});
