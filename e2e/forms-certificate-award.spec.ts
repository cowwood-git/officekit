import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test.describe('수료증', () => {
  test('예시를 채우면 과정과 발급 기관이 들어간다', async ({ page }) => {
    await page.goto('/forms/certificate/');
    await expect(page.getByRole('heading', { name: '수료증 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('CERTIFICATE OF COMPLETION');
    await expect(preview).toContainText('김옷깃');
    await expect(preview).toContainText('2026 사무행정 실무 과정');
    await expect(preview).toContainText('2026년 11월 15일');
    await expect(preview).toContainText('옷깃 아카데미');
  });

  test('수료증 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/certificate/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('수료증');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('교육 기간이 거꾸로면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/certificate/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="courseStart"]').fill('2026-11-01');
    await page.locator('[data-field="courseEnd"]').fill('2026-10-01');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '교육 시작일은 종료일보다 늦을 수 없습니다.',
    );
  });
});

test.describe('상장', () => {
  test('예시를 채우면 상 이름과 수여 사유가 들어간다', async ({ page }) => {
    await page.goto('/forms/award/');
    await expect(page.getByRole('heading', { name: '상장 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('CERTIFICATE OF APPRECIATION');
    await expect(preview).toContainText('김옷깃');
    await expect(preview).toContainText('2026년 우수 직원상');
    await expect(preview).toContainText('부상: 상금 50만 원');
    await expect(preview).toContainText('대표이사 박대표');
  });

  test('상장 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/award/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('상장');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('수여 사유가 짧으면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/award/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="reason"]').fill('열심히 함');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '수여 사유를 10자 이상 적어 주세요.',
    );
  });
});
