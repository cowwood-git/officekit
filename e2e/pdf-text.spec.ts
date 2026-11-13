import { expect, test } from '@playwright/test';
import { captureDownload, fixture } from './fixtures';

test.describe('PDF 텍스트 추출', () => {
  test('전체 페이지의 텍스트를 추출한다', async ({ page }) => {
    await page.goto('/tools/pdf-text/');
    await page.setInputFiles('#pt-input', fixture('pages.pdf'));
    await expect(page.locator('#pt-panel')).toBeVisible({ timeout: 20_000 });

    await page.click('#pt-extract');
    await expect(page.locator('#pt-output')).toHaveValue(/--- 1페이지 ---/, {
      timeout: 20_000,
    });
    const output = page.locator('#pt-output');
    await expect(output).toHaveValue(/PAGE A/);
    await expect(output).toHaveValue(/PAGE E/);
    await expect(page.locator('#pt-pages')).toHaveText('5');

    const { buffer, name } = await captureDownload(page, () => page.click('#pt-download'));
    expect(name).toBe('pages.txt');
    expect(buffer.toString('utf8')).toContain('PAGE C');
  });

  test('페이지 범위와 구분선 옵션을 적용한다', async ({ page }) => {
    await page.goto('/tools/pdf-text/');
    await page.setInputFiles('#pt-input', fixture('pages.pdf'));
    await expect(page.locator('#pt-panel')).toBeVisible({ timeout: 20_000 });

    await page.fill('#pt-range', '2-3');
    await page.uncheck('#pt-markers');
    await page.click('#pt-extract');
    await expect(page.locator('#pt-output')).toHaveValue(/PAGE B/, { timeout: 20_000 });
    await expect(page.locator('#pt-output')).toHaveValue(/PAGE C/);
    await expect(page.locator('#pt-output')).not.toHaveValue(/PAGE A/);
    await expect(page.locator('#pt-output')).not.toHaveValue(/1페이지/);
  });

  test('스캔 PDF는 OCR 안내를 보여준다', async ({ page }) => {
    await page.goto('/tools/pdf-text/');
    await page.setInputFiles('#pt-input', fixture('scanned.pdf'));
    await expect(page.locator('#pt-panel')).toBeVisible({ timeout: 20_000 });

    await page.click('#pt-extract');
    await expect(page.locator('#pt-error')).toContainText('PDF OCR', { timeout: 20_000 });
  });
});
