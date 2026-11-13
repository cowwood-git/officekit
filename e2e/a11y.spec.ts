import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { tools } from '../src/data/tools';

const pages: Array<readonly [string, string]> = [
  ['/', '홈'],
  ['/about/', '소개'],
  ['/privacy/', '개인정보'],
  ['/tools/', '도구 전체'],
  ['/workflows/', '작업 흐름'],
  ['/workflows/submit-pdf/', '제출용 PDF 흐름'],
  ['/pdf/', 'PDF 허브'],
  ['/office/', 'OFFICE 허브'],
  ['/image/', 'IMAGE 허브'],
  ['/sheet/', 'SHEET 허브'],
  ['/text/', 'TEXT 허브'],
  ['/utility/', 'UTIL 허브'],
  ...tools.map((tool) => [`/tools/${tool.slug}/`, tool.title.ko] as const),
];

function serious(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({
      id: violation.id,
      help: violation.help,
      nodes: violation.nodes.map((node) => node.target.join(' ')),
    }));
}

test.describe('접근성 (axe)', () => {
  for (const [path, label] of pages) {
    test(`${label} 페이지에 심각한 위반이 없다`, async ({ page }) => {
      await page.goto(path);
      await page.waitForFunction(
        () => {
          const body = document.querySelector<HTMLElement>('[data-tool-body]');
          return (
            !body ||
            (!body.classList.contains('is-loading') && getComputedStyle(body).opacity === '1')
          );
        },
        { timeout: 5000 },
      );
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(serious(results.violations)).toEqual([]);
    });
  }

  test('검색 다이얼로그', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
    await expect(page.locator('#site-search')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(serious(results.violations)).toEqual([]);
  });

  test('키보드로 검색 열기·이동·닫기', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeVisible();

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
    const input = page.locator('#search-input');
    await expect(input).toBeFocused();
    await input.fill('QR 생성기');
    await expect(page.locator('#search-results li')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await page.waitForURL('**/tools/qr-generate/');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
    await page.keyboard.press('Escape');
    await expect(page.locator('#site-search')).toBeHidden();
  });
});
