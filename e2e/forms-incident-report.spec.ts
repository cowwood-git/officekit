import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('시말서 양식', () => {
  test('예시를 채우면 경위와 재발 방지 대책이 들어간다', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/forms/incident-report/');
    await expect(page.getByRole('heading', { name: '시말서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-field="name"]')).toHaveValue('김옷깃');
    await expect(page.locator('[data-field="incidentTime"]')).toHaveValue('14:30');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('시말서');
    await expect(preview).toContainText('김옷깃');
    await expect(preview).toContainText('2026. 11. 12.');
    await expect(preview).toContainText('14:30');
    await expect(preview).toContainText('업무 지연');
    await expect(preview).toContainText('재발 방지 대책');
    expect(errors).toEqual([]);
  });

  test('PDF를 내려받으면 A4 한 장짜리 시말서가 만들어진다', async ({ page }) => {
    await page.goto('/forms/incident-report/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('시말서');

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
    await page.goto('/forms/incident-report/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/시말서.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('김옷깃');
    expect(section).not.toContain('<hp:pic ');
  });
});
