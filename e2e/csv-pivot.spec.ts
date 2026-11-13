import { expect, test } from '@playwright/test';
import { captureDownload, fixture } from './fixtures';

test.describe('CSV 피벗', () => {
  test('행·열 합계와 총합을 계산한다', async ({ page }) => {
    await page.goto('/tools/csv-pivot/');
    await page.setInputFiles('#cpv-input', fixture('pivot.csv'));
    await expect(page.locator('#cpv-panel')).toBeVisible({ timeout: 20_000 });
    await page.click('#cpv-run');
    await expect(page.locator('#cpv-preview')).toContainText('부산');
    await expect(page.locator('#cpv-preview')).toContainText('450');
    await expect(page.locator('#cpv-preview')).toContainText('750');
    await expect(page.locator('#cpv-stats')).toContainText('2행 × 2열');

    const { buffer, name } = await captureDownload(page, () => page.click('#cpv-csv'));
    expect(name).toBe('pivot-pivot.csv');
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
    expect(text.split('\n')[0]).toBe('지역,A,B,합계');
    expect(text).toContain('부산,450,0,450');
    expect(text).toContain('합계,550,200,750');
  });

  test('집계 방식을 바꾸고 합계를 끈다', async ({ page }) => {
    await page.goto('/tools/csv-pivot/');
    await page.setInputFiles('#cpv-input', fixture('pivot.csv'));
    await expect(page.locator('#cpv-panel')).toBeVisible({ timeout: 20_000 });

    await page.selectOption('#cpv-aggregate', 'count');
    await page.uncheck('#cpv-totals');
    await page.click('#cpv-run');
    await expect(page.locator('#cpv-preview')).toContainText('2');
    await expect(page.locator('#cpv-preview')).not.toContainText('합계');
    await expect(page.locator('#cpv-stats')).toContainText('2행 × 2열');
  });
});
