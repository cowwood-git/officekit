import { expect, test } from '@playwright/test';
import { fixture } from './fixtures';

test.describe('PDF OCR 텍스트 레이어 안내', () => {
  test('텍스트가 있는 PDF는 텍스트 추출로 안내한다', async ({ page }) => {
    await page.goto('/tools/pdf-ocr/');
    await page.setInputFiles('#po-input', fixture('form.pdf'));

    await expect(page.locator('#po-file-info')).toContainText('form.pdf');
    await expect(page.locator('#po-text-layer')).toBeVisible();
    await expect(page.getByRole('link', { name: /PDF 텍스트 추출로 이동/ })).toHaveAttribute(
      'href',
      '/tools/pdf-text/',
    );
    await expect(page.locator('#po-run')).toHaveText('그래도 OCR 실행');

    await page.getByRole('link', { name: /PDF 텍스트 추출로 이동/ }).click();
    await expect(page).toHaveURL(/\/tools\/pdf-text\/$/);
    await expect(page.locator('#pt-file-info')).toContainText('form.pdf');
    await expect(page.locator('#pt-panel')).toBeVisible();
  });

  test('스캔 PDF에는 안내를 띄우지 않는다', async ({ page }) => {
    await page.goto('/tools/pdf-ocr/');
    await page.setInputFiles('#po-input', fixture('scanned.pdf'));

    await expect(page.locator('#po-file-info')).toContainText('scanned.pdf');
    await expect(page.locator('#po-text-layer')).toBeHidden();
    await expect(page.locator('#po-run')).toHaveText('PDF 텍스트 추출');
  });
});
