import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import * as XLSX from 'xlsx';

test.describe('표 양식 엑셀', () => {
  test('견적서를 XLSX로 저장하고 금액 수식을 넣는다', async ({ page }) => {
    await page.goto('/forms/quote/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '엑셀로 저장' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('견적서');
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const workbook = XLSX.read(await readFile(path), { type: 'buffer' });
    expect(workbook.SheetNames).toContain('문서 정보');
    expect(workbook.SheetNames).toContain('품목');

    const items = workbook.Sheets['품목'];
    expect(items).toBeDefined();
    if (!items) return;
    expect(items.D2?.f).toContain('*');
    expect(items.D4?.f).toContain('SUM(D2:D3)');
    expect(XLSX.utils.sheet_to_json<string[]>(items, { header: 1 })[0]).toEqual([
      '품목',
      '수량',
      '단가',
      '금액',
    ]);
  });

  test('엑셀에서 복사한 표를 첫 칸에 붙여넣는다', async ({ page }) => {
    await page.goto('/forms/quote/');
    await page.locator('[data-row-field="name"]').first().waitFor();

    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>('[data-row-field="name"]');
      if (!input) throw new Error('첫 칸을 찾지 못했습니다.');
      const data = new DataTransfer();
      data.setData(
        'text/plain',
        '품목\t수량\t단가\t금액\n노트북\t2\t1,000,000\t2,000,000\n모니터\t1\t300,000\t300,000',
      );
      input.focus();
      input.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
      );
    });

    await expect(page.locator('[data-row-field="name"]').nth(0)).toHaveValue('노트북');
    await expect(page.locator('[data-row-field="name"]').nth(1)).toHaveValue('모니터');
    await expect(page.locator('[data-row-field="quantity"]').nth(0)).toHaveValue('2');
    await expect(page.locator('[data-row-computed="amount"]').nth(0)).toHaveText('2,000,000원');
    await expect(page.locator('[data-row-computed="amount"]').nth(1)).toHaveText('300,000원');
  });

  test('클립보드의 표를 엑셀 붙여넣기 버튼으로 채운다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/forms/quote/');
    await page.locator('[data-row-field="name"]').first().waitFor();
    await page.evaluate(() => navigator.clipboard.writeText('품목\t수량\t단가\n키보드\t3\t50,000'));

    await page.getByRole('button', { name: '엑셀 붙여넣기' }).first().click();
    await expect(page.locator('[data-row-field="name"]').first()).toHaveValue('키보드');
    await expect(page.locator('[data-row-field="quantity"]').first()).toHaveValue('3');
    await expect(page.locator('[data-row-computed="amount"]').first()).toHaveText('150,000원');
  });
});
