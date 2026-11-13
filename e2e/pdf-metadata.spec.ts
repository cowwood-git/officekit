import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';

test.describe('PDF 메타데이터', () => {
  test('제목·작성자·키워드를 저장한다', async ({ page }) => {
    await page.goto('/tools/pdf-metadata/');
    await page.setInputFiles('#pm-input', fixture('pages.pdf'));
    await expect(page.locator('#pm-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#pm-current')).toContainText('만든 프로그램');
    await expect(page.locator('#pm-title')).toHaveValue('');

    await page.fill('#pm-title', '2026년 1분기 보고서');
    await page.fill('#pm-author', '김오피스');
    await page.fill('#pm-subject', '영업 실적');
    await page.fill('#pm-keywords', '보고서, 영업, 2026, 보고서');

    await page.click('#pm-apply');
    await expect(page.locator('#pm-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#pm-result-summary')).toContainText('제목');
    await expect(page.locator('#pm-result-summary')).toContainText('키워드 3개');

    const { buffer, name } = await captureDownload(page, () => page.click('#pm-download'));
    expect(name).toBe('pages-metadata.pdf');

    const output = await PDFDocument.load(buffer);
    expect(output.getTitle()).toBe('2026년 1분기 보고서');
    expect(output.getAuthor()).toBe('김오피스');
    expect(output.getSubject()).toBe('영업 실적');
    expect(output.getKeywords()).toBe('보고서 영업 2026');
    expect(output.getPageCount()).toBe(5);
  });

  test('모두 비우면 메타데이터가 빈 값으로 저장된다', async ({ page }) => {
    await page.goto('/tools/pdf-metadata/');
    await page.setInputFiles('#pm-input', fixture('pages.pdf'));
    await expect(page.locator('#pm-panel')).toBeVisible({ timeout: 20_000 });

    await page.fill('#pm-title', '임시 제목');
    await page.click('#pm-clear');
    await expect(page.locator('#pm-title')).toHaveValue('');

    await page.click('#pm-apply');
    await expect(page.locator('#pm-result')).toBeVisible({ timeout: 30_000 });
    const { buffer } = await captureDownload(page, () => page.click('#pm-download'));
    const output = await PDFDocument.load(buffer);
    expect(output.getTitle()).toBe('');
    expect(output.getAuthor()).toBe('');
  });
});
