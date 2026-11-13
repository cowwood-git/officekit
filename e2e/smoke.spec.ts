import { expect, test } from '@playwright/test';
import { tools } from '../src/data/tools';

test.describe('정적 페이지 스모크 테스트', () => {
  for (const tool of tools) {
    test(`${tool.slug} 페이지가 열린다`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });

      const response = await page.goto(`/tools/${tool.slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toContainText(tool.title.ko);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
      expect(errors).toEqual([]);
    });
  }

  test('홈·소개·개인정보·오프라인 페이지', async ({ page }) => {
    for (const [path, heading] of [
      ['/', '업무 도구'],
      ['/about/', '업무 도구는'],
      ['/privacy/', '개인정보처리방침'],
      ['/offline/', '인터넷에 연결되어 있지 않습니다'],
    ] as const) {
      await page.goto(path);
      await expect(page.locator('h1')).toContainText(heading);
    }
  });
});
