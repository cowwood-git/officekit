import { expect, test } from '@playwright/test';
import { captureDownload, fixture } from './fixtures';

test.describe('CSV → HTML·Markdown', () => {
  test('HTML 표 코드를 만들고 미리보기를 보여준다', async ({ page }) => {
    await page.goto('/tools/csv-table/');
    await page.setInputFiles('#ct-input', fixture('messy.csv'));
    await expect(page.locator('#ct-panel')).toBeVisible({ timeout: 20_000 });
    await page.click('#ct-run');

    await expect(page.locator('#ct-preview')).toContainText('김오피스');
    await expect(page.locator('#ct-code')).toHaveValue(/<table>/);
    await expect(page.locator('#ct-code')).toHaveValue(
      /<td style="text-align: left;">김오피스<\/td>/,
    );
    await expect(page.locator('#ct-code')).toHaveValue(/<th/);

    const { buffer, name } = await captureDownload(page, () => page.click('#ct-download'));
    expect(name).toBe('messy-table.html');
    expect(buffer.toString('utf8')).toContain('<table>');
  });

  test('Markdown 표로 바꾸고 내려받는다', async ({ page }) => {
    await page.goto('/tools/csv-table/');
    await page.setInputFiles('#ct-input', fixture('messy.csv'));
    await expect(page.locator('#ct-panel')).toBeVisible({ timeout: 20_000 });

    await page.selectOption('#ct-format', 'markdown');
    await page.click('#ct-run');
    await expect(page.locator('#ct-code')).toHaveValue(/\| 이름 \| 부서 \| 금액 \|/);
    await expect(page.locator('#ct-code')).toHaveValue(/\| :--- \| :--- \| :--- \|/);

    const { buffer, name } = await captureDownload(page, () => page.click('#ct-download'));
    expect(name).toBe('messy-table.md');
    expect(buffer.toString('utf8')).toContain('| 김오피스 | 개발 | 1200000 |');
  });

  test('헤더를 끄면 thead가 사라진다', async ({ page }) => {
    await page.goto('/tools/csv-table/');
    await page.setInputFiles('#ct-input', fixture('messy.csv'));
    await expect(page.locator('#ct-panel')).toBeVisible({ timeout: 20_000 });

    await page.uncheck('#ct-header');
    await page.click('#ct-run');
    await expect(page.locator('#ct-code')).not.toHaveValue(/<thead>/);
    await expect(page.locator('#ct-code')).toHaveValue(/<tbody>/);
  });
});
