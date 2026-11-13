import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';
import { extractPdfText } from './pdf-text';

test.describe('PDF 페이지 크기', () => {
  test('A4 PDF를 Letter 크기로 바꾼다', async ({ page }) => {
    await page.goto('/tools/pdf-resize/');
    await page.setInputFiles('#pr-input', fixture('pages.pdf'));
    await expect(page.locator('#pr-panel')).toBeVisible({ timeout: 20_000 });

    await page.selectOption('#pr-size', 'letter');
    await expect(page.locator('#pr-preview-label')).toContainText('612×792pt');
    await page.click('#pr-apply');
    await expect(page.locator('#pr-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#pr-result-pages')).toHaveText('5쪽');

    const { buffer, name } = await captureDownload(page, () => page.click('#pr-download'));
    expect(name).toBe('pages-letter.pdf');
    const output = await PDFDocument.load(buffer);
    expect(output.getPageCount()).toBe(5);
    const size = output.getPage(0).getSize();
    expect(size.width).toBeCloseTo(612, 0);
    expect(size.height).toBeCloseTo(792, 0);

    const pages = await extractPdfText(buffer);
    expect(pages[0]).toContain('PAGE A');
    expect(pages[4]).toContain('PAGE E');
  });

  test('A3 가로 방향으로 바꾼다', async ({ page }) => {
    await page.goto('/tools/pdf-resize/');
    await page.setInputFiles('#pr-input', fixture('pages.pdf'));
    await expect(page.locator('#pr-panel')).toBeVisible({ timeout: 20_000 });

    await page.selectOption('#pr-size', 'a3');
    await page.selectOption('#pr-orientation', 'landscape');
    await page.click('#pr-apply');
    await expect(page.locator('#pr-result')).toBeVisible({ timeout: 30_000 });
    const { buffer } = await captureDownload(page, () => page.click('#pr-download'));
    const output = await PDFDocument.load(buffer);
    const size = output.getPage(0).getSize();
    expect(size.width).toBeCloseTo(1190.55, 0);
    expect(size.height).toBeCloseTo(841.89, 0);
  });

  test('PDF가 아닌 파일은 거부한다', async ({ page }) => {
    await page.goto('/tools/pdf-resize/');
    await page.setInputFiles('#pr-input', fixture('big.jpg'));
    await expect(page.locator('#pr-error')).toContainText('PDF가 아닌 파일');
  });
});
