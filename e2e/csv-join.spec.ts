import { expect, test } from '@playwright/test';
import { captureDownload, fixture } from './fixtures';

test.describe('CSV 조인', () => {
  test('inner 조인으로 일치하는 행만 합친다', async ({ page }) => {
    await page.goto('/tools/csv-join/');
    await page.setInputFiles('#cj-left-input', fixture('join-left.csv'));
    await page.setInputFiles('#cj-right-input', fixture('join-right.csv'));
    await expect(page.locator('#cj-panel')).toBeVisible({ timeout: 20_000 });
    await page.click('#cj-run');

    await expect(page.locator('#cj-preview')).toContainText('a@officekit.kr');
    await expect(page.locator('#cj-preview')).not.toContainText('박없음');
    await expect(page.locator('#cj-stats')).toContainText('2행');
    await expect(page.locator('#cj-stats')).toContainText('일치 2');

    const { buffer, name } = await captureDownload(page, () => page.click('#cj-csv'));
    expect(name).toBe('join-left-joined.csv');
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
    expect(text.split('\n')[0]).toBe('사번,이름,부서,이메일,연락처');
    expect(text).toContain('1,김오피스,개발,a@officekit.kr,010-1111-1111');
  });

  test('left 조인은 왼쪽 행을 모두 유지한다', async ({ page }) => {
    await page.goto('/tools/csv-join/');
    await page.setInputFiles('#cj-left-input', fixture('join-left.csv'));
    await page.setInputFiles('#cj-right-input', fixture('join-right.csv'));
    await expect(page.locator('#cj-panel')).toBeVisible({ timeout: 20_000 });

    await page.selectOption('#cj-type', 'left');
    await page.click('#cj-run');
    await expect(page.locator('#cj-preview')).toContainText('박없음');
    await expect(page.locator('#cj-stats')).toContainText('3행');
    await expect(page.locator('#cj-stats')).toContainText('왼쪽만 1');
  });

  test('full 조인은 오른쪽에만 있는 행도 포함한다', async ({ page }) => {
    await page.goto('/tools/csv-join/');
    await page.setInputFiles('#cj-left-input', fixture('join-left.csv'));
    await page.setInputFiles('#cj-right-input', fixture('join-right.csv'));
    await expect(page.locator('#cj-panel')).toBeVisible({ timeout: 20_000 });

    await page.selectOption('#cj-type', 'full');
    await page.click('#cj-run');
    await expect(page.locator('#cj-preview')).toContainText('d@officekit.kr');
    await expect(page.locator('#cj-stats')).toContainText('4행');
    await expect(page.locator('#cj-stats')).toContainText('오른쪽만 1');
  });
});
