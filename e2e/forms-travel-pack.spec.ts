import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test.describe('출장신청서', () => {
  test('예시를 채우면 예상 경비 합계가 계산된다', async ({ page }) => {
    await page.goto('/forms/travel-request/');
    await expect(page.getByRole('heading', { name: '출장신청서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-field="destination"]')).toHaveValue('부산');
    await expect(page.locator('[data-row]')).toHaveCount(3);
    await expect(page.locator('[data-row-summary="costs"]')).toHaveText('330,000원');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('출장신청서');
    await expect(preview).toContainText('KTX 왕복');
    await expect(preview).toContainText('330,000원');
  });

  test('출장신청서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/travel-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('출장신청서');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });
});

test.describe('출장보고서', () => {
  test('예시를 채우면 일정과 활동 내용이 들어간다', async ({ page }) => {
    await page.goto('/forms/travel-report/');
    await expect(page.getByRole('heading', { name: '출장보고서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-row]')).toHaveCount(3);

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('출장보고서');
    await expect(preview).toContainText('거래처 미팅');
    await expect(page.locator('[data-page-label]')).toHaveText('1 / 2');
    await page.locator('[data-page-next]').click();
    await expect(preview).toContainText('후속 조치');
  });

  test('출장보고서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/travel-report/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('출장보고서');
  });
});

test.describe('출장비 정산서', () => {
  test('예시를 채우면 지출 합계와 잔액이 계산된다', async ({ page }) => {
    await page.goto('/forms/travel-expense/');
    await expect(page.getByRole('heading', { name: '출장비 정산서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-row-summary="expenses"]')).toHaveText('330,000원');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('출장비 정산서');
    await expect(preview).toContainText('330,000원');
    await expect(preview).toContainText('30,000원 추가 지급');
  });

  test('정산서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/travel-expense/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('출장비 정산서');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('붙임 배치로 바꾸면 본문과 지출 내역서를 분리한다', async ({ page }) => {
    await page.goto('/forms/travel-expense/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.check('input[name="items-layout"][value="attachment"]');
    await expect(page.locator('[data-page-label]')).toHaveText('1 / 2');
    await expect(page.locator('[data-preview-stage] svg')).toContainText('붙임 1. 지출 내역서');

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
});
