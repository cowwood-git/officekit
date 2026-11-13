import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';

test.describe('CSV → PDF 표', () => {
  test('A4 가로 한 페이지 표를 만든다', async ({ page }) => {
    await page.goto('/tools/csv-pdf/');
    await page.setInputFiles('#cp-input', fixture('messy.csv'));
    await expect(page.locator('#cp-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#cp-page-info')).toContainText('1 / 1페이지');
    await expect(page.locator('#cp-title')).toHaveValue('messy');

    await page.click('#cp-apply');
    await expect(page.locator('#cp-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#cp-result-pages')).toHaveText('1장');

    const { buffer, name } = await captureDownload(page, () => page.click('#cp-download'));
    expect(name).toBe('messy.pdf');
    const output = await PDFDocument.load(buffer);
    expect(output.getPageCount()).toBe(1);
    const size = output.getPage(0).getSize();
    expect(size.width).toBeCloseTo(841.89, 0);
    expect(size.height).toBeCloseTo(595.28, 0);
  });

  test('긴 표는 여러 페이지로 나눈다', async ({ page }) => {
    await page.goto('/tools/csv-pdf/');
    await page.setInputFiles('#cp-input', fixture('sample.xlsx'));
    await expect(page.locator('#cp-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#cp-page-info')).not.toContainText('1 / 1페이지');

    await page.click('#cp-apply');
    await expect(page.locator('#cp-result')).toBeVisible({ timeout: 30_000 });
    const pagesText = await page.locator('#cp-result-pages').textContent();
    const count = Number.parseInt(pagesText ?? '0', 10);
    expect(count).toBeGreaterThan(1);

    const { buffer } = await captureDownload(page, () => page.click('#cp-download'));
    const output = await PDFDocument.load(buffer);
    expect(output.getPageCount()).toBe(count);
  });

  test('세로 방향과 글자 크기를 바꾼다', async ({ page }) => {
    await page.goto('/tools/csv-pdf/');
    await page.setInputFiles('#cp-input', fixture('messy.csv'));
    await expect(page.locator('#cp-panel')).toBeVisible({ timeout: 20_000 });

    await page.selectOption('#cp-orientation', 'portrait');
    await page.fill('#cp-font', '12');
    await page.click('#cp-apply');
    await expect(page.locator('#cp-result')).toBeVisible({ timeout: 30_000 });
    const { buffer } = await captureDownload(page, () => page.click('#cp-download'));
    const output = await PDFDocument.load(buffer);
    const size = output.getPage(0).getSize();
    expect(size.width).toBeCloseTo(595.28, 0);
    expect(size.height).toBeCloseTo(841.89, 0);
  });
});
