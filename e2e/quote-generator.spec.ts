import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';
import { extractPdfText } from './pdf-text';

const fillParties = async (page: import('@playwright/test').Page) => {
  const values: Array<[string, string]> = [
    ['q-supplier-company', '옷깃'],
    ['q-supplier-biz', '123-45-67890'],
    ['q-supplier-ceo', '홍길동'],
    ['q-supplier-address', '서울시 강남구 테헤란로 1'],
    ['q-supplier-contact', '010-1234-5678'],
    ['q-buyer-company', '거래처 주식회사'],
    ['q-buyer-biz', '987-65-43210'],
    ['q-buyer-ceo', '김담당'],
    ['q-buyer-address', '부산시 해운대구 1'],
    ['q-buyer-contact', '051-123-4567'],
  ];
  for (const [id, value] of values) await page.fill(`#${id}`, value);
};

test.describe('견적서·거래명세서', () => {
  test('품목과 부가세를 계산해 PDF로 저장한다', async ({ page }) => {
    await page.goto('/tools/quote-generator/');
    await fillParties(page);

    const rows = page.locator('#q-items-body [data-item-row]');
    await rows.nth(0).locator('[data-field="name"]').fill('웹사이트 디자인');
    await rows.nth(0).locator('[data-field="quantity"]').fill('2');
    await rows.nth(0).locator('[data-field="unitPrice"]').fill('500000');
    await page.click('#q-add-item');
    await rows.nth(1).locator('[data-field="name"]').fill('유지보수');
    await rows.nth(1).locator('[data-field="quantity"]').fill('1');
    await rows.nth(1).locator('[data-field="unitPrice"]').fill('100000');

    await expect(page.locator('#q-supply')).toHaveText('1,100,000원');
    await expect(page.locator('#q-vat-amount')).toHaveText('110,000원');
    await expect(page.locator('#q-total')).toHaveText('1,210,000원');

    await page.click('#q-generate');
    await expect(page.locator('#q-result')).toBeVisible({ timeout: 60_000 });
    const { name, buffer } = await captureDownload(page, () => page.click('#q-download'));
    expect(name).toMatch(/^견적서-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(1);
    const pages = await extractPdfText(buffer);
    expect(pages[0] ?? '').toContain('옷깃');
    expect(pages[0] ?? '').toContain('거래처');
    expect(pages[0] ?? '').toContain('웹사이트');
    expect(pages[0] ?? '').toContain('1,210,000');
    expect(pages[0] ?? '').toContain('참고용');
  });

  test('부가세 포함 금액을 역산한다', async ({ page }) => {
    await page.goto('/tools/quote-generator/');
    await fillParties(page);
    const row = page.locator('#q-items-body [data-item-row]').first();
    await row.locator('[data-field="name"]').fill('용역');
    await row.locator('[data-field="quantity"]').fill('1');
    await row.locator('[data-field="unitPrice"]').fill('110000');
    await page.selectOption('#q-vat', 'included');
    await expect(page.locator('#q-supply')).toHaveText('100,000원');
    await expect(page.locator('#q-vat-amount')).toHaveText('10,000원');
    await expect(page.locator('#q-total')).toHaveText('110,000원');
  });

  test('필수 입력이 없으면 안내한다', async ({ page }) => {
    await page.goto('/tools/quote-generator/');
    await page.click('#q-generate');
    await expect(page.locator('#q-error')).toBeVisible();
    await expect(page.locator('#q-result')).toBeHidden();
  });

  test('회사 정보를 로컬에 저장하고 다시 불러온다', async ({ page }) => {
    await page.goto('/tools/quote-generator/');
    await page.fill('#q-supplier-company', '저장회사');
    await page.check('#q-save-company');
    await page.fill('#q-buyer-company', '거래처');
    const row = page.locator('#q-items-body [data-item-row]').first();
    await row.locator('[data-field="name"]').fill('품목');
    await page.click('#q-generate');
    await expect(page.locator('#q-result')).toBeVisible({ timeout: 60_000 });
    await page.reload();
    await expect(page.locator('#q-supplier-company')).toHaveValue('저장회사');
    await expect(page.locator('#q-save-company')).toBeChecked();
  });
});

test.describe('견적서 여러 페이지', () => {
  test('품목이 많으면 다음 페이지로 넘긴다', async ({ page }) => {
    await page.goto('/tools/quote-generator/');
    await fillParties(page);
    for (let index = 0; index < 25; index += 1) {
      if (index > 0) await page.click('#q-add-item');
      const row = page.locator('#q-items-body [data-item-row]').nth(index);
      await row.locator('[data-field="name"]').fill(`품목 ${index + 1}`);
      await row.locator('[data-field="quantity"]').fill('1');
      await row.locator('[data-field="unitPrice"]').fill('10000');
    }
    await page.click('#q-generate');
    await expect(page.locator('#q-result')).toBeVisible({ timeout: 60_000 });
    const { buffer } = await captureDownload(page, () => page.click('#q-download'));
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    const pages = await extractPdfText(buffer);
    expect(pages.join(' ')).toContain('품목 25');
    expect(pages.join(' ')).toContain('250,000');
  });
});
