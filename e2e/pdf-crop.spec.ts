import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';
import { extractPdfText } from './pdf-text';

test.describe('PDF 여백 자르기', () => {
  test('10mm 여백을 잘라 페이지 크기를 줄인다', async ({ page }) => {
    await page.goto('/tools/pdf-crop/');
    await page.setInputFiles('#pc-input', fixture('pages.pdf'));
    await expect(page.locator('#pc-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#pc-preview-label')).toContainText('189.9×277.0mm');

    await page.click('#pc-apply');
    await expect(page.locator('#pc-result')).toBeVisible({ timeout: 30_000 });

    const { buffer, name } = await captureDownload(page, () => page.click('#pc-download'));
    expect(name).toBe('pages-cropped.pdf');
    const output = await PDFDocument.load(buffer);
    expect(output.getPageCount()).toBe(5);
    const size = output.getPage(0).getSize();
    expect(size.width).toBeCloseTo(538.31, 1);
    expect(size.height).toBeCloseTo(785.31, 1);

    const pages = await extractPdfText(buffer);
    expect(pages[0]).toContain('PAGE A');
    expect(pages[4]).toContain('PAGE E');
  });

  test('프리셋과 0mm 초기화를 지원한다', async ({ page }) => {
    await page.goto('/tools/pdf-crop/');
    await page.setInputFiles('#pc-input', fixture('pages.pdf'));
    await expect(page.locator('#pc-panel')).toBeVisible({ timeout: 20_000 });

    await page.click('button[data-margin="20"]');
    await expect(page.locator('#pc-top')).toHaveValue('20');
    await page.click('#pc-reset-margins');
    await expect(page.locator('#pc-top')).toHaveValue('0');
    await expect(page.locator('#pc-preview-label')).toContainText('209.9×297.0mm');
  });

  test('회전된 페이지도 자른다', async ({ page }) => {
    await page.goto('/tools/pdf-crop/');
    await page.setInputFiles('#pc-input', fixture('rotated.pdf'));
    await expect(page.locator('#pc-panel')).toBeVisible({ timeout: 20_000 });
    await page.fill('#pc-top', '0');
    await page.fill('#pc-right', '0');
    await page.fill('#pc-bottom', '0');
    await page.fill('#pc-left', '0');
    await page.click('#pc-apply');
    await expect(page.locator('#pc-result')).toBeVisible({ timeout: 30_000 });
    const { buffer } = await captureDownload(page, () => page.click('#pc-download'));
    const output = await PDFDocument.load(buffer);
    expect(output.getPage(0).getRotation().angle).toBe(90);
  });
});
