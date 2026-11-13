import { expect, test } from '@playwright/test';
import { captureDownload, fixture } from './fixtures';
import { extractPdfText } from './pdf-text';

test.describe('PDF 페이지 번호', () => {
  test('범위를 지정해 번호를 넣고 원본 텍스트를 유지한다', async ({ page }) => {
    await page.goto('/tools/pdf-page-number/');
    await page.setInputFiles('#pn-input', fixture('pages.pdf'));
    await expect(page.locator('#pn-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#pn-preview-label')).toContainText('전체 5쪽');

    await page.selectOption('#pn-format', 'fraction');
    await page.selectOption('#pn-position', 'bottom-right');
    await page.fill('#pn-range', '2-');

    await page.click('#pn-apply');
    await expect(page.locator('#pn-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#pn-result-pages')).toHaveText('4 / 5쪽');

    const { buffer, name } = await captureDownload(page, () => page.click('#pn-download'));
    expect(name).toBe('pages-numbered.pdf');
    const pages = await extractPdfText(buffer);
    expect(pages).toHaveLength(5);
    expect(pages[0]).toContain('PAGE A');
    expect(pages[0]).not.toContain('/ 5');
    expect(pages[1]).toContain('PAGE B');
    expect(pages[1]).toContain('2 / 5');
    expect(pages[4]).toContain('5 / 5');
  });

  test('시작 번호를 바꾸면 번호가 이어진다', async ({ page }) => {
    await page.goto('/tools/pdf-page-number/');
    await page.setInputFiles('#pn-input', fixture('pages.pdf'));
    await expect(page.locator('#pn-panel')).toBeVisible({ timeout: 20_000 });

    await page.selectOption('#pn-format', 'number');
    await page.fill('#pn-start', '10');
    await page.fill('#pn-range', '1');
    await page.click('#pn-apply');
    await expect(page.locator('#pn-result')).toBeVisible({ timeout: 30_000 });

    const { buffer } = await captureDownload(page, () => page.click('#pn-download'));
    const pages = await extractPdfText(buffer);
    expect(pages[0]).toContain('10');
    expect(pages[1]).not.toContain('11');
  });

  test('회전된 페이지에도 번호를 넣는다', async ({ page }) => {
    await page.goto('/tools/pdf-page-number/');
    await page.setInputFiles('#pn-input', fixture('rotated.pdf'));
    await expect(page.locator('#pn-panel')).toBeVisible({ timeout: 20_000 });

    await page.click('#pn-apply');
    await expect(page.locator('#pn-result')).toBeVisible({ timeout: 30_000 });
    const { buffer } = await captureDownload(page, () => page.click('#pn-download'));
    const pages = await extractPdfText(buffer);
    expect(pages[0]).toContain('ROTATED PAGE');
    expect(pages[0]).toContain('1');
  });

  test('잘못된 범위는 오류로 안내한다', async ({ page }) => {
    await page.goto('/tools/pdf-page-number/');
    await page.setInputFiles('#pn-input', fixture('pages.pdf'));
    await expect(page.locator('#pn-panel')).toBeVisible({ timeout: 20_000 });
    await page.fill('#pn-range', '9-12');
    await expect(page.locator('#pn-error')).toContainText('범위', { timeout: 10_000 });
  });
});
