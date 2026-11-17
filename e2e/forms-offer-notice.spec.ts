import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('합격 통보서 양식', () => {
  test('예시를 채우면 채용 조건과 제출 서류가 들어간다', async ({ page }) => {
    await page.goto('/forms/offer-notice/');
    await expect(page.getByRole('heading', { name: '합격 통보서 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('합격 통보서');
    await expect(preview).toContainText('김지원');
    await expect(preview).toContainText('문서 자동화 개발자');
    await expect(preview).toContainText('2026. 12. 1.');
    await expect(preview).toContainText('주민등록등본 1부');
    await expect(preview).toContainText('2026. 11. 24.');
  });

  test('합격 통보서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/offer-notice/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('합격 통보서');
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
    await page.goto('/forms/offer-notice/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/합격 통보서.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('김지원');
    expect(section).toContain('주민등록등본 1부');
    expect(section).not.toContain('<hp:pic ');
  });

  test('입사일이 통보일보다 빠르면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/offer-notice/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="date"]').fill('2026-12-01');
    await page.locator('[data-field="startDate"]').fill('2026-11-30');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '입사일은 통보일보다 빠를 수 없습니다.',
    );
  });
});
