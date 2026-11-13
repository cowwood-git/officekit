import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { captureDownload, fixture } from './fixtures';

test.describe('이미지 합치기', () => {
  test('가로로 이어 붙인다', async ({ page }) => {
    await page.goto('/tools/image-merge/');
    await page.setInputFiles('#im-input', [fixture('big.jpg'), fixture('wide.png')]);
    await expect(page.locator('#im-panel')).toBeVisible();
    await expect(page.locator('#im-info')).toContainText('2장');

    await page.click('#im-apply');
    await expect(page.locator('#im-result')).toBeVisible({ timeout: 20_000 });
    const { buffer, name } = await captureDownload(page, () => page.click('#im-download'));
    expect(name).toBe('big-merged.jpg');

    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(2800);
    expect(meta.height).toBe(800);
  });

  test('격자 배치와 간격을 적용한다', async ({ page }) => {
    await page.goto('/tools/image-merge/');
    await page.setInputFiles('#im-input', [fixture('big.jpg'), fixture('wide.png')]);
    await expect(page.locator('#im-panel')).toBeVisible();

    await page.selectOption('#im-mode', 'grid');
    await page.fill('#im-gap', '20');
    await page.click('#im-apply');
    await expect(page.locator('#im-result')).toBeVisible({ timeout: 20_000 });
    const { buffer } = await captureDownload(page, () => page.click('#im-download'));

    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(2420);
    expect(meta.height).toBe(800);
  });

  test('이미지가 1장이면 합치기를 막는다', async ({ page }) => {
    await page.goto('/tools/image-merge/');
    await page.setInputFiles('#im-input', [fixture('big.jpg')]);
    await expect(page.locator('#im-panel')).toBeVisible();
    await expect(page.locator('#im-apply')).toBeDisabled();
  });
});
