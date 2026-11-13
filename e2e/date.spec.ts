import { expect, test } from '@playwright/test';

test.describe('날짜·영업일 계산기', () => {
  test('설날 연휴를 제외한 영업일과 날짜 더하기', async ({ page }) => {
    await page.goto('/tools/date-calc/');

    await page.fill('#dc-start', '2026-02-13');
    await page.fill('#dc-end', '2026-02-19');
    await expect(page.locator('#dc-dday')).toHaveText('D-6');
    await expect(page.locator('#dc-diff-total')).toHaveText('6일');
    await expect(page.locator('#dc-diff-business')).toHaveText('1일');
    await expect(page.locator('#dc-diff-holidays')).toHaveText('3일');
    await expect(page.locator('#dc-holiday-list')).toContainText('설날');

    await page.fill('#dc-base', '2026-02-13');
    await page.fill('#dc-amount', '1');
    await page.selectOption('#dc-unit', 'business');
    await expect(page.locator('#dc-result')).toContainText('2026년 2월 19일');
    await expect(page.locator('#dc-result')).toContainText('(목)');

    await page.locator('.dc-custom summary').click();
    await page.fill('#dc-custom', '2026-02-19');
    await expect(page.locator('#dc-diff-business')).toHaveText('0일');
    await expect(page.locator('#dc-status')).toContainText('법정공휴일');
  });

  test('시작일 포함 옵션과 주말만 제외', async ({ page }) => {
    await page.goto('/tools/date-calc/');
    await page.fill('#dc-start', '2026-02-13');
    await page.fill('#dc-end', '2026-02-19');
    await expect(page.locator('#dc-diff-business')).toHaveText('1일');

    await page.check('#dc-include-start');
    await expect(page.locator('#dc-diff-business')).toHaveText('2일');

    await page.uncheck('#dc-use-holidays');
    await expect(page.locator('#dc-diff-business')).toHaveText('5일');
    await expect(page.locator('#dc-diff-holidays')).toHaveText('0일');
  });
});
