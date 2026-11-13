import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { captureDownload, fixture } from './fixtures';

test.describe('이미지 회전·뒤집기', () => {
  test('오른쪽으로 90° 회전하면 가로·세로가 바뀐다', async ({ page }) => {
    await page.goto('/tools/image-rotate/');
    await page.setInputFiles('#ir-input', fixture('big.jpg'));
    await expect(page.locator('#ir-panel')).toBeVisible();
    await expect(page.locator('#ir-info')).toContainText('1200 × 800');

    await page.click('#ir-right');
    await expect(page.locator('#ir-info')).toContainText('800 × 1200');

    await page.click('#ir-apply');
    await expect(page.locator('#ir-result')).toBeVisible({ timeout: 20_000 });
    const { buffer, name } = await captureDownload(page, () => page.click('#ir-download'));
    expect(name).toBe('big-rotated.jpg');

    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(1200);
  });

  test('좌우 반전은 크기를 바꾸지 않는다', async ({ page }) => {
    await page.goto('/tools/image-rotate/');
    await page.setInputFiles('#ir-input', fixture('big.jpg'));
    await expect(page.locator('#ir-panel')).toBeVisible();

    await page.click('#ir-flip-h');
    await expect(page.locator('#ir-flip-h')).toHaveAttribute('aria-pressed', 'true');
    await page.click('#ir-apply');
    await expect(page.locator('#ir-result')).toBeVisible({ timeout: 20_000 });

    const { buffer } = await captureDownload(page, () => page.click('#ir-download'));
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(800);
  });

  test('초기화하면 원래 방향으로 돌아간다', async ({ page }) => {
    await page.goto('/tools/image-rotate/');
    await page.setInputFiles('#ir-input', fixture('big.jpg'));
    await expect(page.locator('#ir-panel')).toBeVisible();

    await page.click('#ir-left');
    await page.click('#ir-right');
    await page.click('#ir-flip-v');
    await page.click('#ir-reset-transform');
    await expect(page.locator('#ir-info')).toContainText('1200 × 800');
    await expect(page.locator('#ir-flip-v')).toHaveAttribute('aria-pressed', 'false');
  });
});
