import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('검토 요청서 양식', () => {
  test('예시를 채우면 검토 대상과 요청 사항이 들어간다', async ({ page }) => {
    await page.goto('/forms/review-request/');
    await expect(page.getByRole('heading', { name: '검토 요청서 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('검토 요청서');
    await expect(preview).toContainText('2027년 사업계획서 초안');
    await expect(preview).toContainText('이검토 팀장');
    await expect(preview).toContainText('2026. 11. 24.');
    await expect(preview).toContainText('신규 서비스 매출 추정 근거');
  });

  test('검토 요청서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/review-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('검토 요청서');
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
    await page.goto('/forms/review-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/검토 요청서.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('2027년 사업계획서 초안');
    expect(section).toContain('이검토 팀장');
    expect(section).not.toContain('<hp:pic ');
  });

  test('검토 요청 사항이 짧으면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/review-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="reviewPoint"]').fill('확인');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '검토 요청 사항을 10자 이상 적어 주세요.',
    );
  });
});
