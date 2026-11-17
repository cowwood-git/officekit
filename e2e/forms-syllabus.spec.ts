import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('강의계획서 양식', () => {
  test('주차 수와 주차별 계획이 들어간다', async ({ page }) => {
    await page.goto('/forms/syllabus/');
    await expect(page.getByRole('heading', { name: '강의계획서 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-computed="weekCountLabel"]')).toHaveText('4주');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('강의계획서');
    await expect(preview).toContainText('데이터 분석 실무');
    await expect(preview).toContainText('1주차');
    await expect(preview).toContainText('4주차');
    await expect(preview).toContainText('4주');
  });

  test('강의계획서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/syllabus/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('강의계획서');
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
    await page.goto('/forms/syllabus/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/강의계획서.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('1주차');
    expect(section).toContain('데이터 분석 실무');
    expect(section).not.toContain('<hp:pic ');
  });

  test('종료일이 시작일보다 빠르면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/syllabus/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="startDate"]').fill('2026-12-10');
    await page.locator('[data-field="endDate"]').fill('2026-12-01');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '종료일은 시작일보다 빠를 수 없습니다.',
    );
  });
});
