import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { captureDownload, fixture } from './fixtures';

test.describe('이미지 테두리·둥근 모서리', () => {
  test('여백과 테두리를 적용해 저장한다', async ({ page }) => {
    await page.goto('/tools/image-frame/');
    await page.setInputFiles('#ifr-input', fixture('big.jpg'));
    await expect(page.locator('#ifr-panel')).toBeVisible();

    await page.fill('#ifr-radius', '40');
    await page.fill('#ifr-border', '10');
    await page.fill('#ifr-padding', '20');
    await page.click('#ifr-apply');
    await expect(page.locator('#ifr-result')).toBeVisible({ timeout: 20_000 });

    const { buffer, name } = await captureDownload(page, () => page.click('#ifr-download'));
    expect(name).toBe('big-framed.png');
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(1240);
    expect(meta.height).toBe(840);
    expect(meta.format).toBe('png');
  });

  test('투명 배경 PNG를 만들 수 있다', async ({ page }) => {
    await page.goto('/tools/image-frame/');
    await page.setInputFiles('#ifr-input', fixture('big.jpg'));
    await expect(page.locator('#ifr-panel')).toBeVisible();

    await page.fill('#ifr-padding', '30');
    await page.check('#ifr-transparent');
    await page.click('#ifr-apply');
    await expect(page.locator('#ifr-result')).toBeVisible({ timeout: 20_000 });

    const { buffer } = await captureDownload(page, () => page.click('#ifr-download'));
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const alpha = data[3] ?? 0;
    expect(info.width).toBe(1260);
    expect(alpha).toBe(0);
  });
});
