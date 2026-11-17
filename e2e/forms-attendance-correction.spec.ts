import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('근태 정정 신청서 양식', () => {
  test('원래 기록과 정정 기록을 보여 준다', async ({ page }) => {
    await page.goto('/forms/attendance-correction/');
    await expect(page.getByRole('heading', { name: '근태 정정 신청서 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('근태 정정 신청서');
    await expect(preview).toContainText('김근태');
    await expect(preview).toContainText('09:02');
    await expect(preview).toContainText('18:30');
    await expect(preview).toContainText('출입 기록');
  });

  test('근태 정정 신청서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/attendance-correction/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('근태 정정 신청서');
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
    await page.goto('/forms/attendance-correction/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/근태 정정 신청서.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('김근태');
    expect(section).toContain('18:30');
    expect(section).not.toContain('<hp:pic ');
  });

  test('시간이 HH:MM 형식이 아니면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/attendance-correction/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="correctedIn"]').fill('9시');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '정정 출근 시간은 HH:MM 형식으로 입력하세요.',
    );
  });
});
