import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

test.describe('거래처 등록신청서 양식', () => {
  test('업체 정보와 등록 품목이 들어간다', async ({ page }) => {
    await page.goto('/forms/vendor-registration/');
    await expect(page.getByRole('heading', { name: '거래처 등록신청서 양식' })).toBeVisible();
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-field="company"]')).toHaveValue('거래처 주식회사');
    await expect(page.locator('[data-computed="itemCount"]')).toHaveText('2개');

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('거래처 등록신청서');
    await expect(preview).toContainText('220-81-62517');
    await expect(preview).toContainText('계좌 이체 30일');
    await expect(preview).toContainText('거래처 등록과 거래 관리에만 이용됨');
  });

  test('사업자번호 자릿수를 검사한다', async ({ page }) => {
    await page.goto('/forms/vendor-registration/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.locator('[data-field="bizNo"]').fill('220-81-6251');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    await expect(page.getByText('사업자번호는 숫자 10자리로 입력하세요.')).toBeVisible();
  });

  test('PDF를 내려받는다', async ({ page }) => {
    await page.goto('/forms/vendor-registration/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('거래처 등록신청서');
    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('한글 파일은 글자·표 개체로 만든다', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/forms/vendor-registration/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/거래처 등록신청서.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('거래처 주식회사');
    expect(section).not.toContain('<hp:pic ');
  });
});
