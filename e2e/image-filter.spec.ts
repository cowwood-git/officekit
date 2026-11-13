import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { captureDownload, fixture } from './fixtures';

test.describe('이미지 필터', () => {
  test('흑백 필터를 적용해 저장한다', async ({ page }) => {
    await page.goto('/tools/image-filter/');
    await page.setInputFiles('#if-input', fixture('big.jpg'));
    await expect(page.locator('#if-panel')).toBeVisible();

    await page.fill('#if-grayscale', '100');
    await expect(page.locator('#if-grayscale-value')).toHaveText('100%');
    await page.click('#if-apply');
    await expect(page.locator('#if-result')).toBeVisible({ timeout: 20_000 });

    const { buffer, name } = await captureDownload(page, () => page.click('#if-download'));
    expect(name).toBe('big-filtered.jpg');
    const { data } = await sharp(buffer)
      .extract({ left: 0, top: 0, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const [red = 0, green = 0, blue = 0] = data;
    expect(Math.abs(red - green)).toBeLessThanOrEqual(2);
    expect(Math.abs(green - blue)).toBeLessThanOrEqual(2);
  });

  test('필터 초기화와 기본값 저장 방지를 지원한다', async ({ page }) => {
    await page.goto('/tools/image-filter/');
    await page.setInputFiles('#if-input', fixture('big.jpg'));
    await expect(page.locator('#if-panel')).toBeVisible();

    await page.fill('#if-sepia', '60');
    await expect(page.locator('#if-sepia-value')).toHaveText('60%');
    await page.click('#if-reset-filters');
    await expect(page.locator('#if-sepia-value')).toHaveText('0%');

    await page.click('#if-apply');
    await expect(page.locator('#if-error')).toContainText('필터를 하나 이상');
  });
});
