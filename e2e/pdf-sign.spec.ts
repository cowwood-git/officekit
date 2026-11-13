import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';
import { countPageImages } from './pdf-image-count';

test.describe('PDF 서명·도장', () => {
  test('서명 이미지를 마지막 페이지에 넣는다', async ({ page }) => {
    await page.goto('/tools/pdf-sign/');
    await page.setInputFiles('#ps-input', fixture('pages.pdf'));
    await expect(page.locator('#ps-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#ps-preview-label')).toContainText('5 / 5쪽');

    await page.click('#ps-source-tabs button[data-source="upload"]');
    await page.setInputFiles('#ps-signature-input', fixture('signature.png'));
    await expect(page.locator('#ps-apply')).toBeEnabled({ timeout: 20_000 });

    await page.click('#ps-apply');
    await expect(page.locator('#ps-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#ps-result-pages')).toHaveText('1 / 5쪽');

    const { buffer, name } = await captureDownload(page, () => page.click('#ps-download'));
    expect(name).toBe('pages-signed.pdf');
    const output = await PDFDocument.load(buffer);
    expect(output.getPageCount()).toBe(5);
    expect(buffer.byteLength).toBeGreaterThan(3000);
    expect(await countPageImages(buffer, 5)).toBe(1);
    expect(await countPageImages(buffer, 1)).toBe(0);
  });

  test('모든 페이지에 서명을 반복한다', async ({ page }) => {
    await page.goto('/tools/pdf-sign/');
    await page.setInputFiles('#ps-input', fixture('pages.pdf'));
    await expect(page.locator('#ps-panel')).toBeVisible({ timeout: 20_000 });
    await page.click('#ps-source-tabs button[data-source="upload"]');
    await page.setInputFiles('#ps-signature-input', fixture('signature.png'));
    await expect(page.locator('#ps-apply')).toBeEnabled({ timeout: 20_000 });

    await page.selectOption('#ps-target', 'all');
    await page.click('#ps-apply');
    await expect(page.locator('#ps-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#ps-result-pages')).toHaveText('5 / 5쪽');
    const { buffer } = await captureDownload(page, () => page.click('#ps-download'));
    expect(await countPageImages(buffer, 2)).toBe(1);
  });

  test('서명이 없으면 저장할 수 없다', async ({ page }) => {
    await page.goto('/tools/pdf-sign/');
    await page.setInputFiles('#ps-input', fixture('pages.pdf'));
    await expect(page.locator('#ps-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#ps-apply')).toBeDisabled();
  });
});
