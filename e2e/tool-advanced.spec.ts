import { expect, test } from '@playwright/test';
import { fixture } from './fixtures';

// 접어 둔 세부 설정(src/scripts/tool-advanced.ts)

test.describe('세부 설정 접기', () => {
  for (const [slug, prefix, hidden, visible] of [
    ['pdf-watermark', 'pw', '#pw-opacity', '#pw-range'],
    ['pdf-page-number', 'pn', '#pn-margin', '#pn-start'],
    ['pdf-header-footer', 'hf', '#hf-color', '#hf-range'],
  ] as const) {
    test(`${slug}: 자주 쓰는 항목만 보이고 세부 설정은 접혀 있다`, async ({ page }) => {
      await page.goto(`/tools/${slug}/`);
      await page.setInputFiles(`#${prefix}-input`, fixture('pages.pdf'));
      await expect(page.locator(`#${prefix}-panel`)).toBeVisible({ timeout: 20_000 });
      const details = page.locator('details[data-tool-advanced]');
      await expect(details).toHaveCount(1);
      await expect(details).not.toHaveAttribute('open', '');
      await expect(page.locator(hidden)).toBeHidden();
      await expect(page.locator(visible)).toBeVisible();
    });
  }

  test('바꾼 개수를 요약에 보여 주고, 펼침 상태를 기억한다', async ({ page }) => {
    await page.goto('/tools/pdf-watermark/');
    await page.setInputFiles('#pw-input', fixture('pages.pdf'));
    await expect(page.locator('#pw-panel')).toBeVisible({ timeout: 20_000 });
    const details = page.locator('details[data-tool-advanced]');
    const state = details.locator('[data-advanced-state]');
    await expect(details).toHaveAttribute('data-advanced-ready', '');
    await expect(state).toHaveText('기본값');

    await details.locator('summary').click();
    await page.selectOption('#pw-angle', '0');
    await expect(state).toHaveText('1개 바꿈');
    await page.selectOption('#pw-angle', '-30');
    await expect(state).toHaveText('기본값');

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('officekit:advanced:pdf-watermark:0')))
      .toBe('open');
    await page.reload();
    await expect(page.locator('details[data-tool-advanced]')).toHaveAttribute('open', '');
  });
});
