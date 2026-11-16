import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test.describe('견적서 양식', () => {
  test('예시를 채우면 줄별 금액과 합계가 계산되고 미리보기가 바뀐다', async ({ page }) => {
    await page.goto('/forms/quote/');
    await expect(page.getByRole('heading', { name: '견적서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-field="supplierCompany"]')).toHaveValue('옷깃');
    await expect(page.locator('[data-field="buyerCompany"]')).toHaveValue('거래처 주식회사');
    await expect(page.locator('[data-row]')).toHaveCount(2);
    await expect(page.locator('[data-row-computed="amount"]').first()).toHaveText('1,000,000원');
    await expect(page.locator('[data-row-summary="items"]')).toHaveText('1,210,000원');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('견적서');
    await expect(preview).toContainText('웹사이트 디자인');
    await expect(preview).toContainText('1,210,000원');
  });

  test('품목을 추가·삭제하면 금액과 합계가 따라 바뀐다', async ({ page }) => {
    await page.goto('/forms/quote/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    await page.click('[data-row-add]');
    const last = page.locator('[data-row]').last();
    await last.locator('[data-row-field="name"]').fill('추가 품목');
    await last.locator('[data-row-field="quantity"]').fill('3');
    await last.locator('[data-row-field="unitPrice"]').fill('200000');

    await expect(last.locator('[data-row-computed="amount"]')).toHaveText('600,000원');
    await expect(page.locator('[data-row-summary="items"]')).toHaveText('1,870,000원');

    await last.locator('[data-row-remove]').click();
    await expect(page.locator('[data-row]')).toHaveCount(2);
    await expect(page.locator('[data-row-summary="items"]')).toHaveText('1,210,000원');
  });

  test('부가세 포함으로 바꾸면 공급가액과 부가세를 역산한다', async ({ page }) => {
    await page.goto('/forms/quote/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.selectOption('[data-field="vatMode"]', '부가세 포함');
    await expect(page.locator('[data-row-summary="items"]')).toHaveText('1,100,000원');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('1,100,000원');
    await expect(preview).toContainText('부가세 포함');
  });

  test('한 장 유지 + 붙임으로 바꾸면 본문과 품목 내역서를 분리한다', async ({ page }) => {
    await page.goto('/forms/quote/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    await page.check('input[name="items-layout"][value="attachment"]');
    await expect(page.locator('[data-page-label]')).toHaveText('1 / 2');
    await expect(page.locator('[data-layout-hint]')).toContainText('붙임');
    await expect(page.locator('[data-preview-stage] svg')).toContainText('붙임 1. 품목 내역서');

    await page.locator('[data-page-next]').click();
    await expect(page.locator('[data-preview-stage] svg')).toContainText(
      '본 붙임은 본문 견적서의 일부입니다.',
    );

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(2);
  });

  test('본문에 이어서로 되돌리면 다시 한 장이 된다', async ({ page }) => {
    await page.goto('/forms/quote/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.check('input[name="items-layout"][value="attachment"]');
    await expect(page.locator('[data-page-label]')).toHaveText('1 / 2');

    await page.check('input[name="items-layout"][value="body"]');
    await expect(page.locator('[data-page-label]')).toHaveText('1 / 1');
    await expect(page.locator('[data-layout-hint]')).toContainText('본문');
  });

  test('견적서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/quote/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('견적서');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('필수 항목이 없으면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/quote/');
    await page.getByRole('button', { name: '초기화' }).click();
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const error = page.locator('[data-form-error]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('공급자 상호');
  });
});

test.describe('거래명세서 양식', () => {
  test('견적서와 분리된 거래명세서 화면에서 예시를 채운다', async ({ page }) => {
    await page.goto('/forms/statement/');
    await expect(page.getByRole('heading', { name: '거래명세서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-field="docNo"]')).toHaveValue(/^S-/);
    await expect(page.locator('[data-row]')).toHaveCount(2);
    await expect(page.locator('[data-row-summary="items"]')).toHaveText('1,210,000원');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('거래명세서');
    await expect(preview).toContainText('거래일');
    await expect(preview).toContainText('1,210,000원');
  });

  test('거래명세서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/statement/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('거래명세서');
  });
});
