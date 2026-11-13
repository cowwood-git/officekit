import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import sharp from 'sharp';
import { captureDownload, fixture } from './fixtures';

test.describe('PDF 이미지 추출', () => {
  test('스캔 PDF에서 페이지 이미지를 추출한다', async ({ page }) => {
    await page.goto('/tools/pdf-image-extract/');
    await page.setInputFiles('#ie-input', fixture('scanned.pdf'));
    await expect(page.locator('#ie-panel')).toBeVisible({ timeout: 20_000 });

    await page.click('#ie-extract');
    await expect(page.locator('#ie-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#ie-result-count')).toHaveText('2개');
    await expect(page.locator('#ie-list figure')).toHaveCount(2);
    await expect(page.locator('#ie-list')).toContainText('900×500px');

    const first = page.locator('#ie-list figure img').first();
    const dimensions = await first.evaluate((image: HTMLImageElement) => ({
      width: image.naturalWidth,
      height: image.naturalHeight,
    }));
    expect(dimensions).toEqual({ width: 900, height: 500 });

    const { buffer } = await captureDownload(page, () => page.click('#ie-zip'));
    const zip = await JSZip.loadAsync(buffer);
    const files = Object.keys(zip.files).filter((name) => !zip.files[name]?.dir);
    expect(files).toHaveLength(2);
    expect(files).toContain('page-01-image-01.png');

    const file = zip.files['page-01-image-01.png'];
    if (!file) throw new Error('이미지를 찾지 못했습니다.');
    const meta = await sharp(await file.async('nodebuffer')).metadata();
    expect(meta.width).toBe(900);
    expect(meta.height).toBe(500);
  });

  test('이미지가 없는 PDF는 안내한다', async ({ page }) => {
    await page.goto('/tools/pdf-image-extract/');
    await page.setInputFiles('#ie-input', fixture('pages.pdf'));
    await expect(page.locator('#ie-panel')).toBeVisible({ timeout: 20_000 });

    await page.click('#ie-extract');
    await expect(page.locator('#ie-error')).toContainText('이미지를 찾지 못했습니다', {
      timeout: 30_000,
    });
  });
});
