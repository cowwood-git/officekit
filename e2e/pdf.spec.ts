import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';

test.describe('PDF 도구', () => {
  test('PDF 합치기: 3쪽 + 2쪽 = 5쪽', async ({ page }) => {
    await page.goto('/tools/pdf-merge/');
    await page.setInputFiles('#pdf-input', [fixture('merge-a.pdf'), fixture('merge-b.pdf')]);
    await expect(page.locator('#pdf-summary')).toContainText('2개 파일');
    await page.click('#pdf-merge');
    await expect(page.locator('#pdf-download')).toBeVisible();

    const { buffer } = await captureDownload(page, () => page.click('#pdf-download'));
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(5);
  });

  test('PDF 나누기: 범위 1-3, 5 → 4쪽', async ({ page }) => {
    await page.goto('/tools/pdf-split/');
    await page.setInputFiles('#split-input', fixture('ten.pdf'));
    await expect(page.locator('#split-file-info')).toContainText('10쪽');

    await page.fill('#split-range', '1-3, 5');
    await page.click('#split-button');
    await expect(page.locator('#split-download')).toBeVisible();

    const { buffer, name } = await captureDownload(page, () => page.click('#split-download'));
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(4);
    expect(name).toContain('1-3_5');
  });

  test('PDF 페이지 정리: 재배열·회전·삭제', async ({ page }) => {
    await page.goto('/tools/pdf-organize/');
    await page.setInputFiles('#po2-input', fixture('pages.pdf'));
    await expect(page.locator('.page-card')).toHaveCount(5);

    await page.locator('.page-card').nth(0).locator('[data-action="right"]').click();
    await page.locator('.page-card').nth(1).locator('[data-action="right"]').click();
    await page.locator('.page-card').nth(2).locator('[data-action="rotate"]').click();
    await page.locator('.page-card').nth(4).locator('[data-action="remove"]').click();
    await expect(page.locator('.page-card')).toHaveCount(4);

    await page.click('#po2-apply');
    await expect(page.locator('#po2-download')).toBeVisible();

    const { buffer } = await captureDownload(page, () => page.click('#po2-download'));
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(4);
    expect(pdf.getPages().map((item) => item.getRotation().angle)).toEqual([0, 0, 90, 0]);
  });

  test('PDF 압축: 결과가 유효한 PDF', async ({ page }) => {
    await page.goto('/tools/pdf-compress/');
    await page.setInputFiles('#pc-input', fixture('scanned.pdf'));
    await expect(page.locator('#pc-file-info')).toContainText('2쪽');

    await page.click('#pc-run');
    await expect(page.locator('#pc-result')).toBeVisible({ timeout: 60_000 });
    const { buffer } = await captureDownload(page, () => page.click('#pc-download'));
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(2);
  });

  test('텍스트 PDF는 압축 전 경고를 보여준다', async ({ page }) => {
    await page.goto('/tools/pdf-compress/');
    await page.setInputFiles('#pc-input', fixture('ten.pdf'));
    await expect(page.locator('#pc-note')).toContainText('텍스트가 있습니다');
    await expect(page.locator('#pc-note')).toHaveClass(/notice-warn/);
  });
});
