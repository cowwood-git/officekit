import { expect, test } from '@playwright/test';

/**
 * 도구 첫 화면의 "예시로 체험하기"가 파일 없이도 결과까지 가는지 검사한다.
 * 각 도구는 예시 파일을 읽고 실행 버튼까지 자동으로 누른다.
 */

test.describe('도구 예시 체험', () => {
  test('CSV ↔ JSON: 예시 표를 JSON으로 바꾼다', async ({ page }) => {
    await page.goto('/tools/csv-json/');
    await page.locator('[data-sample-load="csv-json"]').click();
    await expect(page.locator('#cj-output')).toHaveValue(/"name"/);
    await expect(page.locator('#cj-output')).toHaveValue(/김옷깃/);
    await expect(page.locator('[data-sample-status="csv-json"]')).toContainText('예시 결과');
  });

  test('CSV 정리: 공백·중복을 정리한다', async ({ page }) => {
    await page.goto('/tools/csv-clean/');
    await page.locator('[data-sample-load="csv-clean"]').click();
    await expect(page.locator('#cc-result')).toBeVisible();
    await expect(page.locator('#cc-preview')).toContainText('김옷깃');
    await expect(page.locator('[data-sample-status="csv-clean"]')).toContainText('예시 결과');
  });

  test('CSV → HTML·Markdown: 표 코드를 만든다', async ({ page }) => {
    await page.goto('/tools/csv-table/');
    await page.locator('[data-sample-load="csv-table"]').click();
    await expect(page.locator('#ct-result')).toBeVisible();
    await expect(page.locator('#ct-preview')).toContainText('A4 복사용지');
    await expect(page.locator('[data-sample-status="csv-table"]')).toContainText('예시 결과');
  });

  test('CSV → SQL: CREATE·INSERT 문을 만든다', async ({ page }) => {
    await page.goto('/tools/csv-sql/');
    await page.locator('[data-sample-load="csv-sql"]').click();
    await expect(page.locator('#cs-code')).toHaveValue(/CREATE TABLE/);
    await expect(page.locator('#cs-code')).toHaveValue(/김옷깃/);
    await expect(page.locator('[data-sample-status="csv-sql"]')).toContainText('예시 결과');
  });

  test('CSV 피벗: 지점·월 합계표를 만든다', async ({ page }) => {
    await page.goto('/tools/csv-pivot/');
    await page.locator('[data-sample-load="csv-pivot"]').click();
    await expect(page.locator('#cpv-preview')).toContainText('강남');
    await expect(page.locator('#cpv-preview')).toContainText('2700000');
    await expect(page.locator('#cpv-stats')).toContainText('3행 × 2열');
    await expect(page.locator('[data-sample-status="csv-pivot"]')).toContainText('예시 결과');
  });

  test('CSV 조인: 사번으로 두 표를 합친다', async ({ page }) => {
    await page.goto('/tools/csv-join/');
    await expect(page.getByText('예시로 먼저 해보세요')).toBeVisible();
    await expect(page.getByText('두 표에 같은 값이 있는 열 1개')).toBeVisible();
    await page.locator('[data-sample-load="csv-join"]').click();
    await expect(page.locator('#cj-preview')).toContainText('김옷깃');
    await expect(page.locator('#cj-preview')).toContainText('kim@example.com');
    await expect(page.locator('#cj-stats')).toContainText('일치 3');
    await expect(page.locator('[data-sample-status="csv-join"]')).toContainText('예시 결과');
  });

  test('CSV ↔ XLSX: 엑셀 파일을 만든다', async ({ page }) => {
    await page.goto('/tools/csv-xlsx/');
    await page.locator('[data-sample-load="csv-xlsx"]').click();
    await expect(page.locator('#cx-preview')).toContainText('A4 복사용지');
    await expect(page.locator('#cx-download')).toBeVisible();
    await expect(page.locator('[data-sample-status="csv-xlsx"]')).toContainText('예시 결과');
  });

  test('CSV 차트: 막대 차트를 그린다', async ({ page }) => {
    await page.goto('/tools/csv-chart/');
    await page.locator('[data-sample-load="csv-chart"]').click();
    await expect(page.locator('#cc-canvas')).toBeVisible();
    await expect(page.locator('#cc-download')).toBeVisible();
    await expect(page.locator('[data-sample-status="csv-chart"]')).toContainText('예시 결과');
  });

  test('CSV 통계: 숫자 열 통계를 낸다', async ({ page }) => {
    await page.goto('/tools/csv-stats/');
    await page.locator('[data-sample-load="csv-stats"]').click();
    await expect(page.locator('#cs-result')).toBeVisible();
    await expect(page.locator('#cs-columns')).toContainText('매출');
    await expect(page.locator('[data-sample-status="csv-stats"]')).toContainText('예시 결과');
  });

  test('여러 표 합치기: 두 파일을 세로로 합친다', async ({ page }) => {
    await page.goto('/tools/merge-tables/');
    await page.locator('[data-sample-load="merge-tables"]').click();
    await expect(page.locator('#mt-preview')).toContainText('2026-02-20');
    await expect(page.locator('#mt-preview')).toContainText('볼펜');
    await expect(page.locator('#mt-summary')).toContainText('4행');
    await expect(page.locator('[data-sample-status="merge-tables"]')).toContainText('예시 결과');
  });

  test('CSV 허브가 하려는 일로 도구를 안내한다', async ({ page }) => {
    await page.goto('/sheet/');
    await expect(page.getByRole('heading', { name: '표 작업, 이 도구부터' })).toBeVisible();
    const guide = page.locator('.hub-guide');
    await expect(guide.getByRole('link', { name: 'CSV 조인' })).toHaveAttribute(
      'href',
      '/tools/csv-join/',
    );
    await expect(guide.getByRole('cell', { name: '두 표를 공통 열로 합치기' })).toBeVisible();
  });
});
