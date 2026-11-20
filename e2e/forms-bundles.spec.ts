import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test.describe('상황별 문서 묶음', () => {
  test('묶음 허브에서 28개 묶음을 보여준다', async ({ page }) => {
    await page.goto('/forms/bundles/');
    await expect(
      page.getByRole('heading', { name: '상황별 문서 묶음', exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-bundle-card]')).toHaveCount(28);
    await expect(page.locator('[data-bundle-card="exit"]')).toContainText('퇴사 문서');
    await expect(page.locator('[data-bundle-card="business-trip"]')).toContainText('출장 문서');
    await expect(page.locator('[data-bundle-card="hiring"]')).toContainText('채용 문서');
    await expect(page.locator('[data-bundle-card="korean-notebook"]')).toContainText('국어 공책');
    await expect(page.locator('[data-bundle-card="english-notebook"]')).toContainText('영어 공책');
    await expect(page.locator('[data-bundle-card="tax"]')).toContainText('세금계산서');
    await expect(page.locator('[data-bundle-card="payroll"]')).toContainText('급여·근태');
    await expect(page.locator('[data-bundle-card="vendor"]')).toContainText('거래처 관리');
    await expect(page.locator('[data-bundle-card="reports"]')).toContainText('업무 보고');
    await expect(page.locator('.bundle-grid')).toBeVisible();
  });

  test('국어 공책 묶음에서 공책 4종과 받아쓰기를 확인한다', async ({ page }) => {
    await page.goto('/forms/bundles/korean-notebook/');
    await expect(page.getByRole('heading', { name: '아이 국어 공책 만들기' })).toBeVisible();
    await expect(page.locator('[data-bundle-step]')).toHaveCount(4);
    await expect(page.locator('[data-bundle-step="korean-notebook-8"]')).toContainText(
      '국어 8칸 노트',
    );
    await expect(page.locator('[data-bundle-step="dictation-notebook"]')).toContainText(
      '받아쓰기 노트',
    );

    await page.locator('[data-bundle-step="korean-notebook-10"]').click();
    await expect(page).toHaveURL(/\/forms\/korean-notebook-10\/$/);
    await expect(page.locator('.bundle-chip')).toContainText('국어 공책 4종에 포함');
  });

  test('퇴사 묶음에서 순서·체크리스트·FAQ를 확인한다', async ({ page }) => {
    await page.goto('/forms/bundles/exit/');
    await expect(page.getByRole('heading', { name: '퇴사할 때 필요한 문서' })).toBeVisible();
    await expect(page.locator('[data-bundle-step]')).toHaveCount(4);
    await expect(page.locator('[data-bundle-step="resignation"]')).toContainText('퇴사 의사 표시');
    await expect(page.locator('[data-bundle-step="handover"]')).toContainText('인수인계');
    await expect(page.getByRole('heading', { name: '준비물 체크리스트' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '자주 하는 실수' })).toBeVisible();
    await expect(page.getByText('퇴직증명서와 재직증명서는 무엇이 다른가요?')).toBeVisible();
  });

  test('묶음 → 양식 → 묶음으로 이어진다', async ({ page }) => {
    await page.goto('/forms/bundles/exit/');
    await page.locator('[data-bundle-step="resignation"]').click();
    await expect(page).toHaveURL(/\/forms\/resignation\/$/);
    await expect(page.getByRole('heading', { name: '사직서 양식' })).toBeVisible();
    await expect(page.locator('.bundle-chip')).toContainText('퇴사 문서 4종에 포함');
    await expect(page.locator('[data-related-form]')).toHaveCount(3);

    await page.locator('.bundle-chip').click();
    await expect(page).toHaveURL(/\/forms\/bundles\/exit\/$/);
    await expect(page.getByRole('heading', { name: '퇴사할 때 필요한 문서' })).toBeVisible();
  });

  test('양식 페이지에서 다음 문서와 도구를 보여준다', async ({ page }) => {
    await page.goto('/forms/resignation/');
    await expect(page.getByRole('heading', { name: '이 양식 다음에' })).toBeVisible();
    await expect(page.locator('[data-related-form="handover"]')).toBeVisible();
    await expect(page.locator('[data-related-form="resignation-certificate"]')).toBeVisible();
    await expect(page.locator('[data-related-form="employment-certificate"]')).toBeVisible();
    await expect(page.locator('.related-tools')).toContainText('PDF');
  });

  test('묶음에서 양식을 작성해 1쪽 PDF로 저장한다', async ({ page }) => {
    await page.goto('/forms/bundles/exit/');
    await page.locator('[data-bundle-step="resignation"]').click();
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('사직서');
    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const pdf = await PDFDocument.load(await readFile(path));
    expect(pdf.getPageCount()).toBe(1);
  });

  test('묶음 페이지는 모바일에서 가로로 넘치지 않는다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/forms/bundles/exit/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    );
    expect(overflow).toBe(false);
    await expect(page.locator('[data-bundle-step]').first()).toBeVisible();

    await page.goto('/forms/resignation/');
    const formOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    );
    expect(formOverflow).toBe(false);
    await expect(page.locator('[data-related-form]')).toHaveCount(3);
  });

  test('묶음 페이지에 구조화 데이터가 있다', async ({ page }) => {
    await page.goto('/forms/bundles/exit/');
    const types = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts.flatMap((script) => {
        try {
          const data = JSON.parse(script.textContent ?? '{}') as { '@type'?: string };
          return data['@type'] ? [data['@type']] : [];
        } catch {
          return [];
        }
      }),
    );
    expect(types).toContain('CollectionPage');
    expect(types).toContain('HowTo');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');
  });
});
