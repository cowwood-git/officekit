import { expect, test } from '@playwright/test';
import { captureDownload, fixture } from './fixtures';

test.describe('이미지 정보·EXIF 제거', () => {
  test('촬영 정보를 보여주고 제거한다', async ({ page }) => {
    await page.goto('/tools/image-info/');
    await page.setInputFiles('#ii-input', fixture('exif.jpg'));
    await expect(page.locator('#ii-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#ii-basics')).toContainText('1200 × 800px');
    await expect(page.locator('#ii-exif')).toContainText('OfficeKit');
    await expect(page.locator('#ii-exif')).toContainText('TestCam');

    await page.click('#ii-apply');
    await expect(page.locator('#ii-result')).toBeVisible({ timeout: 20_000 });
    const { buffer, name } = await captureDownload(page, () => page.click('#ii-download'));
    expect(name).toBe('exif-clean.jpg');

    const exifr = (await import('exifr')).default;
    const data = await exifr.parse(buffer, { tiff: true, exif: true, gps: true });
    expect(data?.Make).toBeUndefined();
    expect(data?.Model).toBeUndefined();
  });

  test('EXIF가 없는 이미지도 안내한다', async ({ page }) => {
    await page.goto('/tools/image-info/');
    await page.setInputFiles('#ii-input', fixture('big.jpg'));
    await expect(page.locator('#ii-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#ii-exif-note')).toContainText('EXIF');
  });
});
