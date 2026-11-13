import { expect, test } from '@playwright/test';
import { captureDownload } from './fixtures';

test.describe('CSV 통계 분석', () => {
  test('숫자·문자 열을 요약하고 CSV로 저장한다', async ({ page }) => {
    await page.goto('/tools/csv-stats/');
    await page.setInputFiles('#cs-input', {
      name: 'scores.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('이름,점수,부서\n김,80,개발\n이,90,개발\n박,,디자인\n최,100,개발'),
    });
    await expect(page.locator('#cs-panel')).toBeVisible();
    await page.click('#cs-run');
    await expect(page.locator('#cs-result')).toBeVisible();
    await expect(page.locator('#cs-summary')).toHaveText('4행 · 3열 · 숫자 열 1개');
    await expect(page.locator('.cs-card')).toHaveCount(3);
    await expect(page.locator('.cs-card').nth(1)).toContainText('90');
    await expect(page.locator('.cs-card').nth(2)).toContainText('개발');
    await expect(page.locator('#cs-correlation-section')).toBeHidden();

    const { name, buffer } = await captureDownload(page, () => page.click('#cs-download'));
    expect(name).toBe('scores-통계.csv');
    const csv = buffer.toString('utf8');
    expect(csv).toContain('점수,숫자,3,1,3');
    expect(csv).toContain('개발 (3)');
  });

  test('두 숫자 열의 상관관계를 보여 준다', async ({ page }) => {
    await page.goto('/tools/csv-stats/');
    await page.setInputFiles('#cs-input', {
      name: 'xy.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('x,y\n1,2\n2,4\n3,6'),
    });
    await page.click('#cs-run');
    await expect(page.locator('#cs-result')).toBeVisible();
    await expect(page.locator('#cs-correlation-section')).toBeVisible();
    await expect(page.locator('#cs-correlation')).toContainText('1.00');
  });

  test('머리글 없이 분석한다', async ({ page }) => {
    await page.goto('/tools/csv-stats/');
    await page.setInputFiles('#cs-input', {
      name: 'raw.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('1,가\n2,나'),
    });
    await page.uncheck('#cs-header');
    await page.click('#cs-run');
    await expect(page.locator('#cs-summary')).toHaveText('2행 · 2열 · 숫자 열 1개');
    await expect(page.locator('.cs-card').first()).toContainText('열 1');
  });
});
