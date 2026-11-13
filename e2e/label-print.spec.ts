import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';
import { extractPdfText } from './pdf-text';

test.describe('라벨·봉투 인쇄', () => {
  test('예시 주소를 A4 라벨 PDF로 만든다', async ({ page }) => {
    await page.goto('/tools/label-print/');
    await expect(page.locator('#lp-count')).toHaveText('3개');
    await page.click('#lp-generate');
    await expect(page.locator('#lp-result')).toBeVisible({ timeout: 60_000 });

    const { name, buffer } = await captureDownload(page, () => page.click('#lp-download'));
    expect(name).toMatch(/^라벨-\d{8}\.pdf$/);
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(1);
    const pages = await extractPdfText(buffer);
    expect(pages[0] ?? '').toContain('홍길동');
    expect(pages[0] ?? '').toContain('서울시 강남구');
    expect(pages[0] ?? '').toContain('010-1234-5678');
  });

  test('CSV 머리글을 읽어 라벨을 채운다', async ({ page }) => {
    await page.goto('/tools/label-print/');
    await page.setInputFiles('#lp-file', {
      name: 'labels.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        '이름,우편번호,주소,연락처\n홍길동,06236,서울시 강남구,010-1234-5678\n김옷깃,48058,부산시 해운대구,010-2222-3333',
      ),
    });
    await expect(page.locator('#lp-count')).toHaveText('2개');
    await expect(page.locator('#lp-import-note')).toContainText('머리글');
    await expect(page.locator('#lp-page-note')).toHaveText('2개 · 1페이지');
  });

  test('시작 위치를 비우면 다음 페이지로 넘어간다', async ({ page }) => {
    await page.goto('/tools/label-print/');
    await page.fill('#lp-start', '23');
    await expect(page.locator('#lp-page-note')).toHaveText('3개 · 2페이지');
  });

  test('DL 봉투 PDF는 봉투 크기로 만든다', async ({ page }) => {
    await page.goto('/tools/label-print/');
    await page.selectOption('#lp-preset', 'envelope-dl');
    await expect(page.locator('#lp-size-note')).toContainText('196.0 × 86.0mm');
    await page.click('#lp-generate');
    await expect(page.locator('#lp-result')).toBeVisible({ timeout: 60_000 });
    const { buffer } = await captureDownload(page, () => page.click('#lp-download'));
    const pdf = await PDFDocument.load(buffer);
    const pageSize = pdf.getPage(0).getSize();
    expect(pageSize.width).toBeCloseTo((220 * 72) / 25.4, 1);
    expect(pageSize.height).toBeCloseTo((110 * 72) / 25.4, 1);
  });

  test('내용이 없으면 안내한다', async ({ page }) => {
    await page.goto('/tools/label-print/');
    await page.click('#lp-reset');
    await page.click('#lp-generate');
    await expect(page.locator('#lp-error')).toBeVisible();
    await expect(page.locator('#lp-error')).toContainText('라벨 내용');
  });
});
