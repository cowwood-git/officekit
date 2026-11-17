import { expect, test } from '@playwright/test';

test.describe('머리말 양식 링크', () => {
  test('좁은 화면에서는 오른쪽 위에 양식 링크를 보여 준다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const link = page.locator('.nav-forms');
    await expect(link).toBeVisible();
    await expect(link).toHaveText('양식');

    await link.click();
    await expect(page).toHaveURL(/\/forms\/$/);
  });

  test('양식관 안에서는 양식 링크가 현재 위치로 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/forms/leave-request/');

    await expect(page.locator('.nav-forms')).toHaveAttribute('aria-current', 'page');
  });

  test('넓은 화면에서는 주요 메뉴를 모두 보여 준다', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    for (const name of ['도구', '양식', '작동 원리', '소개']) {
      await expect(page.locator('.nav').getByRole('link', { name, exact: true })).toBeVisible();
    }
  });

  test('중간 폭에서도 머리말이 한 줄로 유지된다', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 900 });
    await page.goto('/forms/');

    const layout = await page.evaluate(() => {
      const inner = document.querySelector('.header-inner') as HTMLElement;
      const search = document.querySelector('.search-trigger') as HTMLElement;
      const nav = document.querySelector('.nav') as HTMLElement;
      return {
        scroll: inner.scrollWidth,
        client: inner.clientWidth,
        searchHeight: Math.round(search.getBoundingClientRect().height),
        navHeight: Math.round(nav.getBoundingClientRect().height),
      };
    });

    expect(layout.searchHeight).toBeLessThanOrEqual(40);
    expect(layout.navHeight).toBeLessThanOrEqual(32);
    expect(layout.scroll).toBeLessThanOrEqual(layout.client);
  });
});
