import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';

test.describe('PDF 머리글·바닥글', () => {
  test('기본 머리글과 페이지 번호를 넣는다', async ({ page }) => {
    await page.goto('/tools/pdf-header-footer/');
    await page.setInputFiles('#hf-input', fixture('pages.pdf'));
    await expect(page.locator('#hf-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#hf-preview-label')).toContainText('전체 5쪽');

    await page.click('#hf-apply');
    await expect(page.locator('#hf-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#hf-result-pages')).toHaveText('5 / 5쪽');

    const { buffer, name } = await captureDownload(page, () => page.click('#hf-download'));
    expect(name).toBe('pages-header-footer.pdf');
    const output = await PDFDocument.load(buffer);
    expect(output.getPageCount()).toBe(5);
    expect(buffer.byteLength).toBeGreaterThan(2000);
  });

  test('페이지 범위와 한글 문구를 적용한다', async ({ page }) => {
    await page.goto('/tools/pdf-header-footer/');
    await page.setInputFiles('#hf-input', fixture('pages.pdf'));
    await expect(page.locator('#hf-panel')).toBeVisible({ timeout: 20_000 });

    await page.fill('#hf-header-left', '사내한정');
    await page.fill('#hf-footer-center', '{page:2} / {total}');
    await page.fill('#hf-range', '2-');
    await page.click('#hf-apply');
    await expect(page.locator('#hf-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#hf-result-pages')).toHaveText('4 / 5쪽');
  });
});
