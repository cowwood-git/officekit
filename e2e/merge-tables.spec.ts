import { expect, test } from '@playwright/test';
import * as XLSX from 'xlsx';
import { captureDownload } from './fixtures';

test.describe('여러 표 합치기', () => {
  test('열 이름이 다른 두 CSV를 합친다', async ({ page }) => {
    await page.goto('/tools/merge-tables/');
    await page.setInputFiles('#mt-input', [
      {
        name: 'a.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('이름,부서\n김,개발\n이,개발'),
      },
      {
        name: 'b.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('이름,지역\n박,서울\n최,부산'),
      },
    ]);
    await expect(page.locator('.mt-file')).toHaveCount(2);
    await page.click('#mt-run');
    await expect(page.locator('#mt-result')).toBeVisible();
    await expect(page.locator('#mt-summary')).toContainText('4행 → 4행 · 3열');
    await expect(page.locator('#mt-preview thead th')).toHaveText(['이름', '부서', '지역']);
    await expect(page.locator('#mt-preview tbody tr')).toHaveCount(4);

    const { name, buffer } = await captureDownload(page, () => page.click('#mt-csv'));
    expect(name).toMatch(/^합친표-\d{8}\.csv$/);
    const csv = buffer.toString('utf8');
    expect(csv).toContain('이름,부서,지역');
    expect(csv).toContain('박,,서울');
  });

  test('중복 행을 제거하고 XLSX로 저장한다', async ({ page }) => {
    await page.goto('/tools/merge-tables/');
    await page.setInputFiles('#mt-input', [
      { name: 'a.csv', mimeType: 'text/csv', buffer: Buffer.from('값\n1\n2') },
      { name: 'b.csv', mimeType: 'text/csv', buffer: Buffer.from('값\n2\n3') },
    ]);
    await page.check('#mt-dedupe');
    await page.click('#mt-run');
    await expect(page.locator('#mt-summary')).toContainText('중복 1행 제거');

    const { name, buffer } = await captureDownload(page, () => page.click('#mt-xlsx'));
    expect(name).toMatch(/^합친표-\d{8}\.xlsx$/);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet as XLSX.WorkSheet, {
      header: 1,
      raw: false,
      defval: '',
    });
    expect(rows).toEqual([['값'], ['1'], ['2'], ['3']]);
  });

  test('파일을 지우면 결과와 목록이 초기화된다', async ({ page }) => {
    await page.goto('/tools/merge-tables/');
    await page.setInputFiles('#mt-input', {
      name: 'a.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('값\n1'),
    });
    await page.click('#mt-run');
    await expect(page.locator('#mt-result')).toBeVisible();
    await page.click('#mt-reset');
    await expect(page.locator('#mt-panel')).toBeHidden();
    await expect(page.locator('#mt-drop')).toBeVisible();
  });
});
