import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import sharp from 'sharp';
import { captureDownload, fixture } from './fixtures';

test.describe('이미지 분할', () => {
  test('2×2로 나눠 ZIP에 4조각을 담는다', async ({ page }) => {
    await page.goto('/tools/image-split/');
    await page.setInputFiles('#is-input', fixture('big.jpg'));
    await expect(page.locator('#is-panel')).toBeVisible();
    await expect(page.locator('#is-tile-info')).toContainText('4조각');
    await expect(page.locator('#is-tile-info')).toContainText('600×400');

    await page.click('#is-apply');
    await expect(page.locator('#is-result')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#is-result-count')).toHaveText('4조각');

    const { buffer, name } = await captureDownload(page, () => page.click('#is-download'));
    expect(name).toBe('big-split.zip');

    const zip = await JSZip.loadAsync(buffer);
    const files = Object.keys(zip.files).filter((file) => !zip.files[file]?.dir);
    expect(files).toHaveLength(4);
    expect(files).toContain('big-r01c01.png');
    expect(files).toContain('big-r02c02.png');

    const first = zip.files['big-r01c01.png'];
    if (!first) throw new Error('조각을 찾지 못했습니다.');
    const meta = await sharp(await first.async('nodebuffer')).metadata();
    expect(meta.width).toBe(600);
    expect(meta.height).toBe(400);
  });

  test('행·열을 바꾸면 조각 수가 바뀐다', async ({ page }) => {
    await page.goto('/tools/image-split/');
    await page.setInputFiles('#is-input', fixture('big.jpg'));
    await expect(page.locator('#is-panel')).toBeVisible();

    await page.selectOption('#is-rows', '3');
    await page.selectOption('#is-cols', '3');
    await expect(page.locator('#is-tile-info')).toContainText('9조각');

    await page.click('#is-apply');
    await expect(page.locator('#is-result-count')).toHaveText('9조각', { timeout: 20_000 });
  });
});
