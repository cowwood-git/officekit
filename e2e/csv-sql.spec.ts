import { expect, test } from '@playwright/test';
import { captureDownload, fixture } from './fixtures';

test.describe('CSV → SQL', () => {
  test('CREATE TABLE과 INSERT를 만들고 내려받는다', async ({ page }) => {
    await page.goto('/tools/csv-sql/');
    await page.setInputFiles('#cs-input', fixture('messy.csv'));
    await expect(page.locator('#cs-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#cs-table')).toHaveValue('messy');
    await page.click('#cs-run');

    await expect(page.locator('#cs-code')).toHaveValue(/CREATE TABLE "messy"/);
    await expect(page.locator('#cs-code')).toHaveValue(/"금액" INTEGER/);
    await expect(page.locator('#cs-code')).toHaveValue(/INSERT INTO "messy"/);
    await expect(page.locator('#cs-code')).toHaveValue(/'김오피스', '개발', 1200000/);
    await expect(page.locator('#cs-stats')).toContainText('5행');

    const { buffer, name } = await captureDownload(page, () => page.click('#cs-download'));
    expect(name).toBe('messy.sql');
    expect(buffer.toString('utf8')).toContain('CREATE TABLE');
  });

  test('MySQL 방언과 NULL 옵션을 적용한다', async ({ page }) => {
    await page.goto('/tools/csv-sql/');
    await page.setInputFiles('#cs-input', fixture('messy.csv'));
    await expect(page.locator('#cs-panel')).toBeVisible({ timeout: 20_000 });

    await page.selectOption('#cs-dialect', 'mysql');
    await page.uncheck('#cs-null');
    await page.click('#cs-run');
    await expect(page.locator('#cs-code')).toHaveValue(/CREATE TABLE `messy`/);
    await expect(page.locator('#cs-code')).toHaveValue(/'', '', ''/);
  });
});
