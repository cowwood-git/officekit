import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test.describe('재직증명서', () => {
  test('예시를 채우면 재직기간과 발급 회사가 들어간다', async ({ page }) => {
    await page.goto('/forms/employment-certificate/');
    await expect(page.getByRole('heading', { name: '재직증명서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('재직증명서');
    await expect(preview).toContainText('김옷깃');
    await expect(preview).toContainText('2020. 3. 2. ~ 현재');
    await expect(preview).toContainText('6년 8개월');
    await expect(preview).toContainText('○○은행 대출 심사 제출용');
    await expect(preview).toContainText('대표이사');
  });

  test('재직증명서 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/employment-certificate/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('재직증명서');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('입사일이 발급일보다 늦으면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/employment-certificate/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="joinedAt"]').fill('2026-12-01');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '입사일은 발급일보다 늦을 수 없습니다.',
    );
  });
});

test.describe('위임장', () => {
  test('예시를 채우면 당사자와 위임 사항이 들어간다', async ({ page }) => {
    await page.goto('/forms/delegation/');
    await expect(page.getByRole('heading', { name: '위임장 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('위임장');
    await expect(preview).toContainText('김옷깃');
    await expect(preview).toContainText('박수임');
    await expect(preview).toContainText('○○은행 통장 재발급');
    await expect(preview).toContainText('첨부 서류');
  });

  test('위임장 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/delegation/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('위임장');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('위임 사항이 너무 짧으면 PDF를 만들지 않는다', async ({ page }) => {
    await page.goto('/forms/delegation/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="matter"]').fill('대신 처리');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.locator('[data-form-error]')).toContainText(
      '위임 사항을 10자 이상 구체적으로 적어 주세요.',
    );
  });

  test('빈 양식 PDF는 필수 입력 없이 내려받는다', async ({ page }) => {
    await page.goto('/forms/delegation/');
    await page.getByRole('button', { name: '빈 양식', exact: true }).click();
    await expect(page.locator('[data-preview-stage] svg')).not.toContainText('김옷깃');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '빈 양식 PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('위임장');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });
});
