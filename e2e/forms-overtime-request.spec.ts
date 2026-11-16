import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('초과근무 신청서 양식', () => {
  test('예시를 채우면 총 시간이 자동 계산된다', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/forms/overtime-request/');
    await expect(page.getByRole('heading', { name: '초과근무 신청서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-field="startTime"]')).toHaveValue('18:00');
    await expect(page.locator('[data-computed="hours"]')).toHaveText('2시간');
    await expect(page.locator('[data-computed="breakLabel"]')).toHaveText('30분');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('초과근무 신청서');
    await expect(preview).toContainText('김옷깃');
    await expect(preview).toContainText('18:00');
    await expect(preview).toContainText('2시간');
    await expect(preview).toContainText('업무 마감');
    expect(errors).toEqual([]);
  });

  test('종료 시간이 시작보다 빠르면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/overtime-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.fill('[data-field="endTime"]', '17:00');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '종료 시간은 시작 시간보다 늦어야',
    );
  });

  test('PDF를 내려받으면 A4 한 장짜리 신청서가 만들어진다', async ({ page }) => {
    await page.goto('/forms/overtime-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('초과근무 신청서');

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
    await page.goto('/forms/overtime-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/초과근무 신청서.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('김옷깃');
    expect(section).not.toContain('<hp:pic ');
  });
});
