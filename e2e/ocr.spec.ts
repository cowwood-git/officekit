import { expect, test } from '@playwright/test';
import { fixture } from './fixtures';

test.describe('OCR (느린 테스트) @slow', () => {
  test('이미지 OCR: 영어 텍스트 추출', async ({ page }) => {
    await page.goto('/tools/image-ocr/');
    await page.setInputFiles('#ocr-input', fixture('ocr-en.png'));
    await expect(page.locator('#ocr-file-info')).toContainText('ocr-en.png');

    await page.selectOption('#ocr-language', 'eng');
    await page.click('#ocr-run');
    await expect(page.locator('#ocr-result')).toBeVisible({ timeout: 180_000 });
    await expect(page.locator('#ocr-text')).toHaveValue(/OFFICEKIT/);
    await expect(page.locator('#ocr-confidence')).not.toHaveText('-');
  });

  test('PDF OCR: 스캔 1페이지', async ({ page }) => {
    await page.goto('/tools/pdf-ocr/');
    await page.setInputFiles('#po-input', fixture('scanned.pdf'));
    await expect(page.locator('#po-file-info')).toContainText('2쪽');

    await page.fill('#po-range', '1');
    await page.selectOption('#po-dpi', '150');
    await page.selectOption('#po-language', 'eng');
    await page.click('#po-run');
    await expect(page.locator('#po-result')).toBeVisible({ timeout: 180_000 });
    await expect(page.locator('#po-text')).toHaveValue(/OFFICEKIT|SCANNED/);
  });
});
