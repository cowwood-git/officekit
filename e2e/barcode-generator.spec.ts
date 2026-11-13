import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';
import { extractPdfText } from './pdf-text';

test.describe('바코드 만들기', () => {
  test('Code 128 미리보기와 PNG·SVG를 만든다', async ({ page }) => {
    await page.goto('/tools/barcode-generator/');
    await expect(page.locator('#bc-preview rect').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#bc-png')).toBeEnabled();

    const png = await captureDownload(page, () => page.click('#bc-png'));
    expect(png.name).toMatch(/^OK-2026-001\.png$/);
    expect(png.buffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

    const svg = await captureDownload(page, () => page.click('#bc-svg'));
    expect(svg.name).toBe('OK-2026-001.svg');
    expect(svg.buffer.toString('utf8')).toContain('<svg');
  });

  test('EAN-13 체크 디지트를 자동 계산·검증한다', async ({ page }) => {
    await page.goto('/tools/barcode-generator/');
    await page.selectOption('#bc-format', 'EAN13');
    await page.fill('#bc-value', '400638133393');
    await expect(page.locator('#bc-check')).toContainText('체크 디지트 1');
    await expect(page.locator('#bc-png')).toBeEnabled();

    await page.fill('#bc-value', '4006381333932');
    await expect(page.locator('#bc-check')).toContainText('맞지 않습니다');
    await expect(page.locator('#bc-png')).toBeDisabled();
  });

  test('CSV 상품 목록을 PNG ZIP과 라벨 PDF로 만든다', async ({ page }) => {
    await page.goto('/tools/barcode-generator/');
    await page.check('#bc-mode-batch');
    await page.setInputFiles('#bc-file', {
      name: 'products.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('바코드,상품명,가격\nOK-001,사과,1000\nOK-002,배,2000\nOK-003,포도,3000'),
    });
    await expect(page.locator('#bc-count')).toHaveText('3개');
    await expect(page.locator('#bc-batch-note')).toContainText('3개 코드가 모두');

    const zipDownload = await captureDownload(page, () => page.click('#bc-batch-zip'));
    expect(zipDownload.name).toMatch(/^바코드-\d{8}\.zip$/);
    const zip = await JSZip.loadAsync(zipDownload.buffer);
    expect(Object.keys(zip.files).sort()).toEqual(['OK-001.png', 'OK-002.png', 'OK-003.png']);

    const pdfDownload = await captureDownload(page, () => page.click('#bc-batch-pdf'));
    expect(pdfDownload.name).toMatch(/^바코드-라벨-\d{8}\.pdf$/);
    const pdf = await PDFDocument.load(pdfDownload.buffer);
    expect(pdf.getPageCount()).toBe(1);
    const pages = await extractPdfText(pdfDownload.buffer);
    expect(pages[0] ?? '').toContain('사과');
    expect(pages[0] ?? '').toContain('포도');
  });

  test('형식이 맞지 않는 코드는 생성에서 제외한다', async ({ page }) => {
    await page.goto('/tools/barcode-generator/');
    await page.check('#bc-mode-batch');
    await page.setInputFiles('#bc-file', {
      name: 'products.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('바코드,상품명\nOK-001,정상\n한글코드,오류'),
    });
    await page.selectOption('#bc-batch-format', 'CODE128');
    await expect(page.locator('#bc-batch-note')).toContainText('1개가 정상');
    await expect(page.locator('#bc-batch-table .is-invalid')).toHaveCount(2);
  });
});
