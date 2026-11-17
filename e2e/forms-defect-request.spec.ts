import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('하자보수 요청서 양식', () => {
  test('예시를 채우면 하자 항목과 처리 기한이 들어간다', async ({ page }) => {
    await page.goto('/forms/defect-request/');
    await expect(page.getByRole('heading', { name: '하자보수 요청서 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-computed="itemCountLabel"]')).toHaveText('2개');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('하자보수 요청서');
    await expect(preview).toContainText('페이퍼시설 주식회사');
    await expect(preview).toContainText('천장 누수');
    await expect(preview).toContainText('2026. 11. 24.');
    await expect(preview).toContainText('긴급');
  });

  test('하자보수 요청서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/defect-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('하자보수 요청서');
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
    await page.goto('/forms/defect-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/하자보수 요청서.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('천장 누수');
    expect(section).toContain('페이퍼시설 주식회사');
    expect(section).not.toContain('<hp:pic ');
  });

  test('처리 요청일이 발견일보다 빠르면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/defect-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="defectDate"]').fill('2026-12-01');
    await page.locator('[data-field="dueDate"]').fill('2026-11-01');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '처리 요청일은 발견일보다 빠를 수 없습니다.',
    );
  });
});
