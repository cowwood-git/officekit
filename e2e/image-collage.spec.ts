import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { captureDownload, fixture } from './fixtures';

const images = ['big.jpg', 'wide.png', 'ocr-en.png', 'scan.png'].map(fixture);

test.describe('이미지 콜라주', () => {
  test('4장을 1:1 콜라주로 만든다', async ({ page }) => {
    await page.goto('/tools/image-collage/');
    await page.setInputFiles('#ic-input', images);
    await expect(page.locator('#ic-panel')).toBeVisible();
    await expect(page.locator('#ic-info')).toContainText('4장 · 1080 × 1080px');
    await expect(page.locator('#ic-list li')).toHaveCount(4);

    await page.click('#ic-apply');
    await expect(page.locator('#ic-result')).toBeVisible({ timeout: 20_000 });
    const { buffer, name } = await captureDownload(page, () => page.click('#ic-download'));
    expect(name).toBe('big-collage.png');

    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1080);
    expect(meta.format).toBe('png');
  });

  test('4:5 비율과 모서리·간격을 적용한다', async ({ page }) => {
    await page.goto('/tools/image-collage/');
    await page.setInputFiles('#ic-input', images);
    await expect(page.locator('#ic-panel')).toBeVisible();

    await page.selectOption('#ic-ratio', 'portrait');
    await expect(page.locator('#ic-info')).toContainText('1080 × 1350px');
    await page.fill('#ic-gap', '20');
    await page.fill('#ic-radius', '40');
    await page.click('#ic-apply');
    await expect(page.locator('#ic-result')).toBeVisible({ timeout: 20_000 });

    const { buffer } = await captureDownload(page, () => page.click('#ic-download'));
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1350);
  });

  test('이미지 순서를 바꾼다', async ({ page }) => {
    await page.goto('/tools/image-collage/');
    await page.setInputFiles('#ic-input', images);
    await expect(page.locator('#ic-panel')).toBeVisible();

    const first = page.locator('#ic-list li').first();
    await expect(first).toContainText('big.jpg');
    await first.locator('button').nth(1).click();
    await expect(first).toContainText('wide.png');
  });

  test('이미지가 1장이면 콜라주를 막는다', async ({ page }) => {
    await page.goto('/tools/image-collage/');
    await page.setInputFiles('#ic-input', [fixture('big.jpg')]);
    await expect(page.locator('#ic-panel')).toBeVisible();
    await expect(page.locator('#ic-apply')).toBeDisabled();
  });
});
