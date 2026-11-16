import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test.describe('빈 표', () => {
  test('예시를 채우면 제목과 열 이름, 행이 들어간다', async ({ page }) => {
    await page.goto('/forms/blank-table/');
    await expect(page.getByRole('heading', { name: '빈 표 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('11월 업무 현황');
    await expect(preview).toContainText('진행률');
    await expect(preview).toContainText('11월 정산 마감');
    await expect(preview).toContainText('이상 없음');
  });

  test('열 수를 3으로 줄이면 뒤쪽 열을 숨긴다', async ({ page }) => {
    await page.goto('/forms/blank-table/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const preview = page.locator('[data-preview-stage] svg');

    await page.locator('[data-field="columnCount"]').selectOption('3');
    await expect(preview).not.toContainText('진행률');
    await expect(preview).not.toContainText('이상 없음');
    await expect(preview).toContainText('상태');
  });

  test('빈 표 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/blank-table/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('빈 표');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });
});

test.describe('체크리스트', () => {
  test('예시를 채우면 진행률과 점검 항목이 들어간다', async ({ page }) => {
    await page.goto('/forms/checklist/');
    await expect(page.getByRole('heading', { name: '체크리스트 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('11월 정산 체크리스트');
    await expect(preview).toContainText('2 / 5');
    await expect(preview).toContainText('40%');
    await expect(preview).toContainText('정산서 금액 확인');
  });

  test('상태를 바꾸면 진행률이 다시 계산된다', async ({ page }) => {
    await page.goto('/forms/checklist/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const preview = page.locator('[data-preview-stage] svg');

    await page.locator('[data-row] [data-row-field="status"]').nth(2).selectOption('완료');
    await expect(preview).toContainText('3 / 5');
    await expect(preview).toContainText('60%');
  });

  test('체크리스트 PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/checklist/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('체크리스트');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('빈 체크리스트도 내려받는다', async ({ page }) => {
    await page.goto('/forms/checklist/');
    await page.getByRole('button', { name: '빈 양식', exact: true }).click();
    await expect(page.locator('[data-preview-stage] svg')).not.toContainText('김옷깃');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '빈 양식 PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('체크리스트');
  });
});
