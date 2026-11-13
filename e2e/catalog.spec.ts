import { expect, test } from '@playwright/test';

test.describe('도구 카탈로그', () => {
  test('형식과 용도로 88개 도구를 거른다', async ({ page }) => {
    await page.goto('/tools/');
    await expect(page.locator('.catalog-head h1')).toHaveText('도구 전체');
    await expect(page.locator('#catalog-grid [data-app-tile]')).toHaveCount(88);
    await expect(page.locator('#catalog-count')).toHaveText('88개 도구');

    await page.locator('[data-catalog-format="document"]').click();
    await expect(page.locator('#catalog-count')).toHaveText('26개 도구 · PDF');
    await expect(page.locator('#catalog-grid [data-app-tile]:visible')).toHaveCount(26);
    await expect(page).toHaveURL(/format=document/);

    await page.locator('[data-catalog-op="convert"]').click();
    await expect(page.locator('#catalog-count')).toHaveText('4개 도구 · PDF · 변환');
    await expect(page.locator('#catalog-grid [data-app-tile]:visible')).toHaveCount(4);
    await expect(page).toHaveURL(/use=convert/);

    await page.locator('#catalog-search').fill('OCR');
    await expect(page.locator('#catalog-grid [data-app-tile]:visible')).toHaveCount(1);
    await expect(page.locator('#catalog-count')).toContainText('OCR');

    await page.locator('#catalog-clear').click();
    await expect(page.locator('#catalog-count')).toHaveText('88개 도구');
    await expect(page.locator('#catalog-grid [data-app-tile]:visible')).toHaveCount(88);
  });

  test('URL의 필터를 그대로 복원한다', async ({ page }) => {
    await page.goto('/tools/?format=office&use=view');
    await expect(page.locator('#catalog-count')).toHaveText('4개 도구 · OFFICE · 보기');
    await expect(page.locator('#catalog-grid [data-app-tile]:visible')).toHaveCount(4);
  });

  test('용도 이름으로도 검색한다', async ({ page }) => {
    await page.goto('/tools/');
    await page.locator('#catalog-search').fill('합치기');
    await expect(
      page.locator('#catalog-grid [data-app-tile][data-slug="pdf-merge"]'),
    ).toBeVisible();
    await expect(page.locator('#catalog-grid [data-app-tile]:visible')).not.toHaveCount(0);
  });
});

test.describe('형식별 허브', () => {
  const hubs = [
    ['pdf', 'PDF 도구', 26],
    ['office', 'OFFICE 도구', 8],
    ['image', 'IMAGE 도구', 21],
    ['sheet', 'CSV 도구', 10],
    ['text', 'TEXT 도구', 5],
    ['utility', 'UTIL 도구', 18],
  ] as const;

  for (const [slug, title, count] of hubs) {
    test(`${slug} 허브는 ${count}개 도구를 보여 준다`, async ({ page }) => {
      await page.goto(`/${slug}/`);
      await expect(page.locator('.hub-head h1')).toHaveText(title);
      await expect(page.locator('.hub-grid [data-app-tile]')).toHaveCount(count);
      await expect(page.locator('.hub-jump-all')).toBeVisible();
    });
  }

  test('홈 카테고리에서 허브로 이동한다', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-app-group][data-group="office"] .app-section-more').click();
    await expect(page).toHaveURL(/\/office\/$/);
    await expect(page.locator('.hub-head h1')).toHaveText('OFFICE 도구');
  });
});

test.describe('작업 흐름', () => {
  test('6개 흐름을 보여 주고 단계별 도구로 연결한다', async ({ page }) => {
    await page.goto('/workflows/');
    await expect(page.locator('.workflow-card')).toHaveCount(6);
    await page.locator('.workflow-card', { hasText: '제출용 PDF 만들기' }).click();
    await expect(page.locator('.workflow-head h1')).toHaveText('제출용 PDF 만들기');
    await expect(page.locator('.workflow-step')).toHaveCount(4);
    await expect(page.locator('.workflow-tool-link')).toHaveCount(4);
    await page.locator('.workflow-tool-link[href="/tools/pdf-merge/"]').click();
    await expect(page).toHaveURL(/\/tools\/pdf-merge\/$/);
  });
});
