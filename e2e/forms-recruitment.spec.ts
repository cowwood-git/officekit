import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('채용공고 양식', () => {
  test('예시를 채우면 직무와 전형 절차가 들어간다', async ({ page }) => {
    await page.goto('/forms/recruitment/');
    await expect(page.getByRole('heading', { name: '채용공고 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('채용공고');
    await expect(preview).toContainText('문서 자동화 개발자');
    await expect(preview).toContainText('서류 전형');
    await expect(preview).toContainText('면접 전형');
    await expect(preview).toContainText('2026. 12. 15.');
    await expect(preview).toContainText('옷깃 주식회사');
  });

  test('채용공고 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/recruitment/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('채용공고');
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
    await page.goto('/forms/recruitment/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/채용공고.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('문서 자동화 개발자');
    expect(section).toContain('서류 전형');
    expect(section).not.toContain('<hp:pic ');
  });

  test('마감일이 공고일보다 빠르면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/recruitment/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="date"]').fill('2026-12-20');
    await page.locator('[data-field="deadline"]').fill('2026-12-01');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '마감일은 공고일보다 빠를 수 없습니다.',
    );
  });
});
