import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('연장·휴일근로 동의서 양식', () => {
  test('적용 기간과 동의 내용을 보여 준다', async ({ page }) => {
    await page.goto('/forms/overtime-agreement/');
    await expect(page.getByRole('heading', { name: '연장·휴일근로 동의서 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('연장·휴일근로 동의서');
    await expect(preview).toContainText('김근로');
    await expect(preview).toContainText('12시간');
    await expect(preview).toContainText('2026. 12. 1.');
    await expect(preview).toContainText('동의함');
  });

  test('연장·휴일근로 동의서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/overtime-agreement/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('연장·휴일근로 동의서');
    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('한글 파일은 글자 개체로 만든다', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/forms/overtime-agreement/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/연장·휴일근로 동의서.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('김근로');
    expect(section).toContain('12시간');
    expect(section).not.toContain('<hp:pic ');
  });

  test('업무 범위가 짧으면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/overtime-agreement/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="scope"]').fill('야근');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '업무 범위·사유를 10자 이상 적어 주세요.',
    );
  });
});
