import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';
import { extractPdfText } from './pdf-text';

test.describe('PDF 모아찍기', () => {
  test('5쪽을 2쪽씩 모아 3장으로 만든다', async ({ page }) => {
    await page.goto('/tools/pdf-nup/');
    await page.setInputFiles('#nu-input', fixture('pages.pdf'));
    await expect(page.locator('#nu-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#nu-preview-label')).toContainText('1 / 3장');

    await page.selectOption('#nu-per-sheet', '2');
    await page.click('#nu-apply');
    await expect(page.locator('#nu-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#nu-result-sheets')).toHaveText('3장');

    const { buffer, name } = await captureDownload(page, () => page.click('#nu-download'));
    expect(name).toBe('pages-2up.pdf');
    const output = await PDFDocument.load(buffer);
    expect(output.getPageCount()).toBe(3);
    const size = output.getPage(0).getSize();
    expect(size.width).toBeCloseTo(595.28, 1);
    expect(size.height).toBeCloseTo(841.89, 1);

    const pages = await extractPdfText(buffer);
    expect(pages[0]).toContain('PAGE A');
    expect(pages[0]).toContain('PAGE B');
    expect(pages[1]).toContain('PAGE C');
    expect(pages[2]).toContain('PAGE E');
  });

  test('4쪽씩 모으면 2장이 된다', async ({ page }) => {
    await page.goto('/tools/pdf-nup/');
    await page.setInputFiles('#nu-input', fixture('pages.pdf'));
    await expect(page.locator('#nu-panel')).toBeVisible({ timeout: 20_000 });
    await page.selectOption('#nu-per-sheet', '4');
    await page.click('#nu-apply');
    await expect(page.locator('#nu-result-sheets')).toHaveText('2장', { timeout: 30_000 });
  });

  test('회전된 페이지도 텍스트를 유지한다', async ({ page }) => {
    await page.goto('/tools/pdf-nup/');
    await page.setInputFiles('#nu-input', fixture('rotated.pdf'));
    await expect(page.locator('#nu-panel')).toBeVisible({ timeout: 20_000 });
    await page.click('#nu-apply');
    await expect(page.locator('#nu-result')).toBeVisible({ timeout: 30_000 });
    const { buffer } = await captureDownload(page, () => page.click('#nu-download'));
    const pages = await extractPdfText(buffer);
    expect(pages[0]).toContain('ROTATED PAGE');
  });
});
