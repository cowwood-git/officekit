import { expect, test } from '@playwright/test';
import { fixture } from './fixtures';

test.describe('PDF 도구 사이 파일 전달', () => {
  test('텍스트가 없는 PDF는 OCR로 넘긴다', async ({ page }) => {
    await page.goto('/tools/pdf-text/');
    await page.setInputFiles('#pt-input', fixture('scanned.pdf'));
    await page.click('#pt-extract');

    await expect(page.locator('#pt-ocr-suggest')).toBeVisible();
    await page.getByRole('link', { name: /PDF OCR로 이동/ }).click();
    await expect(page).toHaveURL(/\/tools\/pdf-ocr\/$/);
    await expect(page.locator('#po-file-info')).toContainText('scanned.pdf');
  });

  test('양식 필드가 없는 PDF는 OCR로 넘긴다', async ({ page }) => {
    await page.goto('/tools/pdf-form-fill/');
    await page.setInputFiles('#pf-input', fixture('scanned.pdf'));

    await expect(page.locator('#pf-ocr-suggest')).toBeVisible();
    await page.getByRole('link', { name: /PDF OCR로 이동/ }).click();
    await expect(page).toHaveURL(/\/tools\/pdf-ocr\/$/);
    await expect(page.locator('#po-file-info')).toContainText('scanned.pdf');
  });

  test('PDF 뷰어에서 텍스트 추출로 파일을 넘긴다', async ({ page }) => {
    await page.goto('/tools/pdf-viewer/');
    await page.setInputFiles('#pv-input', fixture('form.pdf'));
    await expect(page.locator('#pv-panel')).toBeVisible();

    await page.locator('a[data-flow-handoff="pdf-text"]').first().click();
    await expect(page).toHaveURL(/\/tools\/pdf-text\/$/);
    await expect(page.locator('#pt-file-info')).toContainText('form.pdf');
  });
});
