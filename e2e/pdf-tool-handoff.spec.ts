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

  test('PDF 비교에서 스캔 PDF를 OCR로 넘긴다', async ({ page }) => {
    await page.goto('/tools/pdf-diff/');
    await page.setInputFiles('#pd-old-input', fixture('scanned.pdf'));
    await page.setInputFiles('#pd-new-input', fixture('scanned.pdf'));
    await page.click('#pd-run');

    await expect(page.locator('#pd-ocr-suggest')).toBeVisible();
    await page.getByRole('button', { name: '원본 PDF로 OCR' }).click();
    await expect(page).toHaveURL(/\/tools\/pdf-ocr\/$/);
    await expect(page.locator('#po-file-info')).toContainText('scanned.pdf');
  });

  test('PDF → JPG 결과를 이미지 OCR로 넘긴다', async ({ page }) => {
    await page.goto('/tools/pdf-to-jpg/');
    await page.setInputFiles('#pj-input', fixture('form.pdf'));
    await page.click('#pj-convert');

    const chip = page.locator('.flow-next-chip', { hasText: '이미지 OCR' });
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(page).toHaveURL(/\/tools\/image-ocr\/$/);
    await expect(page.locator('#ocr-file-info')).toContainText('form-page-01.jpg');
  });

  test('도장 PNG를 PDF 서명 도구로 넘긴다', async ({ page }) => {
    await page.goto('/tools/seal-maker/');
    await page.fill('#sm-text', '옷깃');
    await page.click('#sm-download');

    const toSign = page.locator('#sm-to-sign');
    await expect(toSign).toBeVisible();
    await toSign.click();
    await expect(page).toHaveURL(/\/tools\/pdf-sign\/$/);
    await expect(page.locator('#ps-apply')).toBeEnabled();
  });
});
