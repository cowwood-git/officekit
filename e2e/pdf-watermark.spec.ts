import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';

test.describe('PDF 워터마크', () => {
  test('전체 페이지에 넣고 원본 쪽수를 유지한다', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/tools/pdf-watermark/');
    await page.setInputFiles('#pw-input', fixture('pages.pdf'));
    await expect(page.locator('#pw-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#pw-file-info')).toContainText('5쪽');
    await expect(page.locator('#pw-preview-label')).toHaveText('1쪽 미리보기 · 전체 5쪽');

    await page.fill('#pw-text', '대외비');
    await page.selectOption('#pw-layout', 'center');
    await page.fill('#pw-range', '');

    await page.click('#pw-apply');
    await expect(page.locator('#pw-result')).toBeVisible({ timeout: 30_000 });
    const { buffer, name } = await captureDownload(page, () => page.click('#pw-download'));
    expect(name).toBe('pages-watermark.pdf');
    expect(buffer.byteLength).toBeGreaterThan(0);

    const output = await PDFDocument.load(buffer);
    expect(output.getPageCount()).toBe(5);

    await expect(page.locator('#pw-result-pages')).toHaveText('5 / 5쪽');
    await expect(page.locator('#pw-result')).toBeVisible();
    await expect(page.locator('#pw-result-note')).toContainText('원본 텍스트');
    expect(errors).toEqual([]);
  });

  test('페이지 범위를 지정하면 해당 페이지만 적용한다', async ({ page }) => {
    await page.goto('/tools/pdf-watermark/');
    await page.setInputFiles('#pw-input', fixture('pages.pdf'));
    await expect(page.locator('#pw-panel')).toBeVisible({ timeout: 20_000 });

    await page.fill('#pw-range', '1-3,5');
    await expect(page.locator('#pw-preview-label')).toContainText('총 4쪽에 적용');

    await page.click('#pw-apply');
    await expect(page.locator('#pw-result')).toBeVisible({ timeout: 30_000 });
    const { buffer } = await captureDownload(page, () => page.click('#pw-download'));
    const output = await PDFDocument.load(buffer);
    expect(output.getPageCount()).toBe(5);
    await expect(page.locator('#pw-result-pages')).toHaveText('4 / 5쪽');
  });

  test('회전된 페이지의 회전 값을 유지한다', async ({ page }) => {
    await page.goto('/tools/pdf-watermark/');
    await page.setInputFiles('#pw-input', fixture('rotated.pdf'));
    await expect(page.locator('#pw-panel')).toBeVisible({ timeout: 20_000 });

    await page.click('#pw-apply');
    await expect(page.locator('#pw-result')).toBeVisible({ timeout: 30_000 });
    const { buffer } = await captureDownload(page, () => page.click('#pw-download'));

    const output = await PDFDocument.load(buffer);
    expect(output.getPageCount()).toBe(1);
    expect(output.getPage(0).getRotation().angle).toBe(90);
  });

  test('잘못된 페이지 범위는 오류로 안내한다', async ({ page }) => {
    await page.goto('/tools/pdf-watermark/');
    await page.setInputFiles('#pw-input', fixture('pages.pdf'));
    await expect(page.locator('#pw-panel')).toBeVisible({ timeout: 20_000 });

    await page.fill('#pw-range', '9-12');
    await expect(page.locator('#pw-error')).toContainText('범위', { timeout: 10_000 });
    await expect(page.locator('#pw-result')).toBeHidden();
  });

  test('PDF가 아닌 파일은 거부한다', async ({ page }) => {
    await page.goto('/tools/pdf-watermark/');
    await page.setInputFiles('#pw-input', fixture('big.jpg'));
    await expect(page.locator('#pw-error')).toContainText('PDF가 아닌 파일');
    await expect(page.locator('#pw-panel')).toBeHidden();
  });
});
