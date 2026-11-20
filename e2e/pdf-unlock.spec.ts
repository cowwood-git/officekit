import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';

const PASSWORD = 'okit-test-2026';

test.describe('PDF 암호 풀기', () => {
  test('암호를 건 PDF를 같은 암호로 풀면 원래 쪽수로 열린다', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/tools/pdf-protect/');
    await page.setInputFiles('#pp-input', fixture('pages.pdf'));
    await expect(page.locator('#pp-panel')).toBeVisible({ timeout: 20_000 });
    await page.fill('#pp-password', PASSWORD);
    await page.fill('#pp-confirm', PASSWORD);
    await page.click('#pp-apply');
    await expect(page.locator('#pp-result')).toBeVisible({ timeout: 60_000 });
    const locked = await captureDownload(page, () => page.click('#pp-download'));
    await expect(PDFDocument.load(locked.buffer)).rejects.toThrow();

    await page.goto('/tools/pdf-unlock/');
    await page.setInputFiles('#pu-input', {
      name: 'locked.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(locked.buffer),
    });
    await expect(page.locator('#pu-panel')).toBeVisible({ timeout: 20_000 });

    await page.fill('#pu-password', 'wrong-password');
    await page.click('#pu-apply');
    await expect(page.locator('#pu-error')).toBeVisible({ timeout: 60_000 });

    await page.fill('#pu-password', PASSWORD);
    await page.click('#pu-apply');
    await expect(page.locator('#pu-result')).toBeVisible({ timeout: 60_000 });
    const unlocked = await captureDownload(page, () => page.click('#pu-download'));
    const pdf = await PDFDocument.load(unlocked.buffer);
    expect(pdf.getPageCount()).toBe(5);
  });
});
