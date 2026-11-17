import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('임명장', () => {
  test('예시를 채우면 대상자와 직위·임기가 들어간다', async ({ page }) => {
    await page.goto('/forms/appointment/');
    await expect(page.getByRole('heading', { name: '임명장 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('LETTER OF APPOINTMENT');
    await expect(preview).toContainText('김옷깃');
    await expect(preview).toContainText('경영지원팀');
    await expect(preview).toContainText('문서혁신 TF 팀장');
    await expect(preview).toContainText('2026. 12. 1. ~ 2027. 11. 30.');
    await expect(preview).toContainText('옷깃 주식회사');
  });

  test('임명장 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/appointment/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('임명장');

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
    await page.goto('/forms/appointment/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/임명장.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('김옷깃');
    expect(section).toContain('문서혁신 TF 팀장');
    expect(section).not.toContain('<hp:pic ');
  });

  test('빈 양식 PDF는 필수 입력 없이 내려받는다', async ({ page }) => {
    await page.goto('/forms/appointment/');
    await page.getByRole('button', { name: '빈 양식', exact: true }).click();
    await expect(page.locator('[data-preview-stage] svg')).not.toContainText('김옷깃');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '빈 양식 PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('임명장');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });
});
