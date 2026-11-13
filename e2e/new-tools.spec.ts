import { expect, test } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { canvasPixel, captureDownload, fixture } from './fixtures';

async function textPdf(lines: string[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  lines.forEach((line, index) => {
    page.drawText(line, { x: 60, y: 740 - index * 26, size: 14, font });
  });
  return Buffer.from(await doc.save());
}

test.describe('텍스트 비교', () => {
  test('바뀐 줄을 찾아 색으로 표시한다', async ({ page }) => {
    await page.goto('/tools/text-diff/');
    await page.fill('#td-old', '계약 금액: 1,000,000원\n계약 기간: 1년');
    await page.fill('#td-new', '계약 금액: 1,200,000원\n계약 기간: 1년');
    await page.click('#td-run');

    await expect(page.locator('#td-result')).toBeVisible();
    await expect(page.locator('#td-stat-changed')).toHaveText('1');
    await expect(page.locator('#td-stat-unchanged')).toHaveText('1');
    await expect(page.locator('.td-row-change')).toHaveCount(1);
    await expect(page.locator('.td-row-change')).toContainText('1,200,000원');

    const background = await page
      .locator('.td-row-change')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(background).not.toBe('rgba(0, 0, 0, 0)');

    await page.check('#td-only-changed');
    await expect(page.locator('.td-row')).toHaveCount(1);
    await expect(page.locator('.td-row')).toHaveClass(/td-row-change/);
  });

  test('같은 텍스트는 같다고 알려 준다', async ({ page }) => {
    await page.goto('/tools/text-diff/');
    await page.fill('#td-old', '같은 문서');
    await page.fill('#td-new', '같은 문서');
    await page.click('#td-run');
    await expect(page.locator('#td-summary')).toHaveText('두 텍스트가 같습니다.');
  });
});

test.describe('CSV ↔ XLSX 변환', () => {
  test('CSV를 XLSX로 바꾼다', async ({ page }) => {
    await page.goto('/tools/csv-xlsx/');
    await page.setInputFiles('#cx-input', fixture('sample.csv'));
    await expect(page.locator('#cx-direction')).toHaveText('CSV → XLSX');
    await expect(page.locator('#cx-run')).toBeEnabled();

    await page.click('#cx-run');
    await expect(page.locator('#cx-download')).toBeVisible();
    const { buffer, name } = await captureDownload(page, () => page.click('#cx-download'));
    expect(name).toContain('.xlsx');

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    expect(workbook.SheetNames).toHaveLength(1);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('시트가 없습니다.');
    const summarySheet = workbook.Sheets[sheetName];
    if (!summarySheet) throw new Error('시트를 읽지 못했습니다.');
    const rows = XLSX.utils.sheet_to_json<string[]>(summarySheet, {
      header: 1,
      raw: false,
      defval: '',
    });
    expect(rows[0]).toEqual(['이름', '부서', '금액']);
    expect(rows[1]?.[0]).toBe('김오피스');
  });

  test('엑셀 시트를 골라 CSV로 바꾼다', async ({ page }) => {
    await page.goto('/tools/csv-xlsx/');
    await page.setInputFiles('#cx-input', fixture('sample.xlsx'));
    await expect(page.locator('#cx-direction')).toHaveText('XLSX → CSV');
    await expect(page.locator('#cx-sheet-select option')).toHaveCount(2);

    await page.click('#cx-run');
    await expect(page.locator('#cx-download')).toBeVisible();
    const first = await captureDownload(page, () => page.click('#cx-download'));
    expect(first.name).toContain('매출');
    const text = first.buffer.toString('utf8');
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain('번호,거래일,거래처');

    await page.selectOption('#cx-sheet-select', '요약');
    await page.click('#cx-run');
    await expect(page.locator('#cx-download')).toBeVisible();
    const second = await captureDownload(page, () => page.click('#cx-download'));
    const summary = second.buffer.toString('utf8');
    expect(second.name).toContain('요약');
    expect(summary).toContain('총건수');
  });
});

test.describe('CSV 차트', () => {
  test('표를 막대 차트로 그리고 PNG로 저장한다', async ({ page }) => {
    await page.goto('/tools/csv-chart/');
    await page.setInputFiles('#cc-input', fixture('pivot.csv'));
    await expect(page.locator('#cc-canvas')).toBeVisible();
    await expect(page.locator('#cc-stat-categories')).toHaveText('4');
    await expect(page.locator('#cc-stat-total')).toHaveText('750');

    const pixel = await canvasPixel(page, '#cc-canvas', 220, 200);
    expect(pixel[3]).toBeGreaterThan(0);

    await page.selectOption('#cc-type', 'pie');
    await expect(page.locator('#cc-canvas')).toBeVisible();
    await expect(page.locator('#cc-download')).toBeVisible();

    const { buffer, name } = await captureDownload(page, () => page.click('#cc-download'));
    expect(name).toContain('.png');
    expect(Array.from(buffer.subarray(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });
});

test.describe('PDF 페이지 삽입·교체', () => {
  test('3쪽 PDF를 2쪽 뒤에 넣어 8쪽을 만든다', async ({ page }) => {
    await page.goto('/tools/pdf-page-insert/');
    await page.setInputFiles('#pi-base-input', fixture('pages.pdf'));
    await page.setInputFiles('#pi-source-input', fixture('merge-a.pdf'));
    await expect(page.locator('#pi-panel')).toBeVisible();
    await page.fill('#pi-insert-after', '2');
    await expect(page.locator('#pi-summary')).toContainText('8쪽');

    await page.click('#pi-run');
    await expect(page.locator('#pi-download')).toBeVisible();
    const { buffer, name } = await captureDownload(page, () => page.click('#pi-download'));
    expect(name).toContain('page-edit.pdf');
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(8);
  });

  test('2-4쪽을 2쪽으로 교체해 4쪽을 만든다', async ({ page }) => {
    await page.goto('/tools/pdf-page-insert/');
    await page.setInputFiles('#pi-base-input', fixture('pages.pdf'));
    await page.setInputFiles('#pi-source-input', fixture('merge-a.pdf'));
    await page.selectOption('#pi-mode', 'replace');
    await page.fill('#pi-base-range', '2-4');
    await page.fill('#pi-source-range', '1-2');
    await expect(page.locator('#pi-summary')).toContainText('4쪽');

    await page.click('#pi-run');
    await expect(page.locator('#pi-download')).toBeVisible();
    const { buffer } = await captureDownload(page, () => page.click('#pi-download'));
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(4);
  });
});

test.describe('PDF 텍스트 비교', () => {
  test('바뀐 쪽과 줄을 찾고 TXT로 저장한다', async ({ page }) => {
    await page.goto('/tools/pdf-diff/');
    const oldPdf = await textPdf(['CONTRACT', 'Amount: 1,000,000 KRW', 'Term: 1 year']);
    const newPdf = await textPdf(['CONTRACT', 'Amount: 1,200,000 KRW', 'Term: 1 year']);

    await page.setInputFiles('#pd-old-input', {
      name: 'contract-old.pdf',
      mimeType: 'application/pdf',
      buffer: oldPdf,
    });
    await page.setInputFiles('#pd-new-input', {
      name: 'contract-new.pdf',
      mimeType: 'application/pdf',
      buffer: newPdf,
    });
    await expect(page.locator('#pd-run')).toBeEnabled();
    await page.click('#pd-run');

    await expect(page.locator('#pd-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#pd-stat-changed')).toHaveText('1');
    await expect(page.locator('#pd-stat-unchanged')).toHaveText('0');
    await expect(page.locator('.pd-page-changed')).toHaveCount(1);

    const { buffer, name } = await captureDownload(page, () => page.click('#pd-download'));
    const text = buffer.toString('utf8');
    expect(name).toContain('diff.txt');
    expect(text).toContain('- Amount: 1,000,000 KRW');
    expect(text).toContain('+ Amount: 1,200,000 KRW');
  });

  test('같은 PDF는 바뀐 쪽이 없다', async ({ page }) => {
    await page.goto('/tools/pdf-diff/');
    const pdf = await textPdf(['SAME DOCUMENT']);
    await page.setInputFiles('#pd-old-input', {
      name: 'same-a.pdf',
      mimeType: 'application/pdf',
      buffer: pdf,
    });
    await page.setInputFiles('#pd-new-input', {
      name: 'same-b.pdf',
      mimeType: 'application/pdf',
      buffer: pdf,
    });
    await page.click('#pd-run');
    await expect(page.locator('#pd-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#pd-stat-changed')).toHaveText('0');
    await expect(page.locator('#pd-stat-unchanged')).toHaveText('1');
    await expect(page.locator('#pd-result-summary')).toHaveText(
      '두 PDF의 페이지 텍스트가 같습니다.',
    );
  });
});
