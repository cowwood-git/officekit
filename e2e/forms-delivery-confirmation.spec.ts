import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test.describe('납품확인서 양식', () => {
  test('예시를 채우면 품목 금액과 합계가 계산된다', async ({ page }) => {
    await page.goto('/forms/delivery-confirmation/');
    await expect(page.getByRole('heading', { name: '납품확인서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-field="supplierCompany"]')).toHaveValue('옷깃');
    await expect(page.locator('[data-field="receiverName"]')).toHaveValue('김담당');
    await expect(page.locator('[data-row]')).toHaveCount(3);
    await expect(page.locator('[data-row-summary="items"]')).toHaveText('517,000원');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('납품확인서');
    await expect(preview).toContainText('A4 복사용지');
    await expect(preview).toContainText('517,000원');
  });

  test('품목을 추가·삭제하면 합계가 따라 바뀐다', async ({ page }) => {
    await page.goto('/forms/delivery-confirmation/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    await page.click('[data-row-add]');
    const last = page.locator('[data-row]').last();
    await last.locator('[data-row-field="name"]').fill('추가 품목');
    await last.locator('[data-row-field="spec"]').fill('규격');
    await last.locator('[data-row-field="quantity"]').fill('1');
    await last.locator('[data-row-field="unitPrice"]').fill('100000');
    await expect(page.locator('[data-row-summary="items"]')).toHaveText('627,000원');

    await last.locator('[data-row-remove]').click();
    await expect(page.locator('[data-row]')).toHaveCount(3);
    await expect(page.locator('[data-row-summary="items"]')).toHaveText('517,000원');
  });

  test('납품확인서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/delivery-confirmation/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('납품확인서');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('붙임 배치로 바꾸면 본문과 품목 내역서를 분리한다', async ({ page }) => {
    await page.goto('/forms/delivery-confirmation/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.check('input[name="items-layout"][value="attachment"]');
    await expect(page.locator('[data-page-label]')).toHaveText('1 / 2');
    await expect(page.locator('[data-preview-stage] svg')).toContainText('붙임 1. 품목 내역서');

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

  test('필수 항목이 없으면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/delivery-confirmation/');
    await page.fill('[data-field="supplierCompany"]', '');
    await page.fill('[data-field="buyerCompany"]', '');
    await page.fill('[data-field="receiverName"]', '');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const error = page.locator('[data-form-error]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('공급자 상호');
  });
});
