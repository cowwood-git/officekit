import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('거래처 평가표 양식', () => {
  test('항목 수·총점·평균을 계산한다', async ({ page }) => {
    await page.goto('/forms/vendor-evaluation/');
    await expect(page.getByRole('heading', { name: '거래처 평가표 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-computed="itemCountLabel"]')).toHaveText('5개');
    await expect(page.locator('[data-computed="totalLabel"]')).toHaveText('22점');
    await expect(page.locator('[data-computed="averageLabel"]')).toHaveText('4.4점');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('거래처 평가표');
    await expect(preview).toContainText('페이퍼랩');
    await expect(preview).toContainText('22점');
    await expect(preview).toContainText('4.4점');
  });

  test('거래처 평가표 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/vendor-evaluation/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('거래처 평가표');
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
    await page.goto('/forms/vendor-evaluation/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/거래처 평가표.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('페이퍼랩');
    expect(section).toContain('22점');
    expect(section).not.toContain('<hp:pic ');
  });

  test('점수가 비어 있으면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/vendor-evaluation/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-row] [data-row-field="score"]').first().selectOption('');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '모든 평가 항목에 점수를 선택하세요.',
    );
  });
});
