import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('월간업무보고 양식', () => {
  test('예시를 채우면 완료 현황과 평균 진행률이 계산된다', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/forms/monthly-report/');
    await expect(page.getByRole('heading', { name: '월간업무보고 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-computed="doneLabel"]')).toHaveText('1 / 3 완료');
    await expect(page.locator('[data-computed="progressAvg"]')).toHaveText('평균 63%');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('월간업무보고');
    await expect(preview).toContainText('2026년 11월');
    await expect(preview).toContainText('1 / 3 완료');
    await expect(preview).toContainText('평균 63%');
    await expect(preview).toContainText('11월 정산 마감');
    await expect(preview).toContainText('다음 달 계획');
    expect(errors).toEqual([]);
  });

  test('PDF를 내려받으면 A4 한 장짜리 월간보고가 만들어진다', async ({ page }) => {
    await page.goto('/forms/monthly-report/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('월간업무보고');

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
    await page.goto('/forms/monthly-report/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/월간업무보고.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('11월 정산 마감');
    expect(section).not.toContain('<hp:pic ');
  });
});
