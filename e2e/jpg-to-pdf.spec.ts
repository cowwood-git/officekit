import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';

test.describe('JPG → PDF', () => {
  test('이미지 두 장을 두 쪽 PDF로 만든다', async ({ page }) => {
    await page.goto('/tools/jpg-to-pdf/');
    await page.setInputFiles('#img-input', [fixture('exif.jpg'), fixture('wide.png')]);
    await expect(page.locator('#img-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#img-list > *')).toHaveCount(2);

    await page.click('#img-make');
    await expect(page.locator('#img-result')).toBeVisible({ timeout: 30_000 });

    const { buffer, name } = await captureDownload(page, () => page.click('#img-download'));
    expect(name).toMatch(/\.pdf$/);
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(2);
  });
});
