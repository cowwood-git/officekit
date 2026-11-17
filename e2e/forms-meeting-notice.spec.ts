import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('회의 소집 안내문 양식', () => {
  test('예시를 채우면 일시·장소·안건이 들어간다', async ({ page }) => {
    await page.goto('/forms/meeting-notice/');
    await expect(page.getByRole('heading', { name: '회의 소집 안내문 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('회의 소집 안내문');
    await expect(preview).toContainText('2027년 사업계획 Kick-off 회의');
    await expect(preview).toContainText('14:00~15:30');
    await expect(preview).toContainText('본사 3층 대회의실');
    await expect(preview).toContainText('2027년 회사 목표와 전략 방향');
  });

  test('회의 소집 안내문 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/meeting-notice/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('회의 소집 안내문');
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
    await page.goto('/forms/meeting-notice/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/회의 소집 안내문.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('2027년 회사 목표와 전략 방향');
    expect(section).not.toContain('<hp:pic ');
  });

  test('회의 일자가 작성일보다 빠르면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/meeting-notice/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="date"]').fill('2026-12-01');
    await page.locator('[data-field="meetingDate"]').fill('2026-11-01');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '회의 일자는 작성일보다 빠를 수 없습니다.',
    );
  });
});
