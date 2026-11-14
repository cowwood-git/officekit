import { expect, test } from '@playwright/test';

// 로고(옷깃·OfficeKit·한 줄 소개)를 키워도 가운데 메뉴·오른쪽 버튼과 겹치거나 줄이 넘치지 않아야 한다.
for (const width of [761, 820, 1024, 1280, 1440]) {
  test(`머리 로고가 메뉴와 겹치지 않는다 (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const brand = await page.locator('.site-header .brand').boundingBox();
    const nav = await page.locator('.site-header .nav').boundingBox();
    const end = await page.locator('.site-header .header-end').boundingBox();
    if (!brand || !end) throw new Error('머리 요소를 찾지 못했습니다.');
    const next = nav && nav.width > 0 ? nav : end;
    expect(brand.x + brand.width, '로고 오른쪽 끝').toBeLessThanOrEqual(next.x - 8);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, '가로 넘침').toBeLessThanOrEqual(0);
  });
}
