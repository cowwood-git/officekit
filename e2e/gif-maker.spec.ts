import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { captureDownload, fixture } from './fixtures';

test.describe('GIF 만들기', () => {
  test('이미지 3장 → gifski 로 3프레임 GIF', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'warning' && message.text().includes('gifski')) {
        warnings.push(message.text());
      }
    });

    await page.goto('/tools/gif-maker/');
    await page.setInputFiles('#gm-input', [
      fixture('big.jpg'),
      fixture('wide.png'),
      fixture('qr-sample.png'),
    ]);
    await expect(page.locator('#gm-panel')).toBeVisible();
    await page.click('#gm-apply');
    await expect(page.locator('#gm-result')).toBeVisible({ timeout: 60_000 });

    const { buffer } = await captureDownload(page, () => page.click('#gm-download'));
    const meta = await sharp(buffer, { animated: true }).metadata();
    expect(meta.format).toBe('gif');
    expect(meta.pages).toBe(3);
    expect(warnings).toEqual([]);
  });
});
