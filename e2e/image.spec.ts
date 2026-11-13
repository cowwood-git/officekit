import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import sharp from 'sharp';
import { captureDownload, fixture } from './fixtures';

test.describe('이미지 도구', () => {
  test('이미지 압축: 2장 일괄 → ZIP', async ({ page }) => {
    await page.goto('/tools/image-compress/');
    await page.setInputFiles('#image-input', [fixture('big.jpg'), fixture('wide.png')]);
    await expect(page.locator('#image-list li')).toHaveCount(2);

    await page.click('#image-convert');
    await expect(page.locator('#image-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#out-count')).toContainText('2장');

    const { buffer, name } = await captureDownload(page, () => page.click('#image-download'));
    expect(name).toBe('images-compressed.zip');
    const zip = await JSZip.loadAsync(buffer);
    expect(Object.keys(zip.files)).toHaveLength(2);
  });

  test('이미지 자르기: 지정 크기로 출력', async ({ page }) => {
    await page.goto('/tools/image-crop/');
    await page.setInputFiles('#crop-input', fixture('big.jpg'));
    await expect(page.locator('#crop-panel')).toBeVisible();

    await page.fill('#crop-w', '400');
    await page.fill('#crop-h', '300');
    await page.fill('#crop-x', '100');
    await page.fill('#crop-y', '100');
    await page.locator('#crop-w').blur();

    await page.uncheck('#out-lock');
    await page.fill('#out-w', '200');
    await page.fill('#out-h', '150');
    await page.click('#crop-apply');
    await expect(page.locator('#crop-result')).toBeVisible();

    const { buffer } = await captureDownload(page, () => page.click('#crop-download'));
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(150);
  });

  test('모자이크: 검은색으로 가리면 픽셀이 검어진다', async ({ page }) => {
    await page.goto('/tools/image-mosaic/');
    await page.setInputFiles('#mosaic-input', fixture('wide.png'));
    await expect(page.locator('.region')).toHaveCount(1);

    await page.click('#mosaic-modes button[data-mode="black"]');
    await page.click('#mosaic-apply');
    await expect(page.locator('#mosaic-result')).toBeVisible();

    const { buffer } = await captureDownload(page, () => page.click('#mosaic-download'));
    const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
    const index = (100 * info.width + 200) * info.channels;
    expect(data[index]).toBeLessThan(12);
    expect(data[index + 1]).toBeLessThan(12);
    expect(data[index + 2]).toBeLessThan(12);
  });

  test('이미지 형식 변환: SVG → PNG', async ({ page }) => {
    await page.goto('/tools/image-convert/');
    await page.setInputFiles('#ic-input', fixture('vector.svg'));
    await expect(page.locator('#ic-list li')).toHaveCount(1);

    await page.selectOption('#ic-format', 'image/png');
    await page.click('#ic-convert');
    await expect(page.locator('#ic-result')).toBeVisible({ timeout: 30_000 });

    const { buffer } = await captureDownload(page, () => page.click('#ic-download'));
    const meta = await sharp(buffer).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(100);
  });
});
