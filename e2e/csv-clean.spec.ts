import { expect, test } from '@playwright/test';
import * as XLSX from 'xlsx';
import { captureDownload, fixture } from './fixtures';

test.describe('CSV 정리', () => {
  test('공백·빈 행·중복을 정리하고 CSV로 저장한다', async ({ page }) => {
    await page.goto('/tools/csv-clean/');
    await page.setInputFiles('#cc-input', fixture('messy.csv'));
    await expect(page.locator('#cc-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#cc-result')).toBeHidden();
    await page.click('#cc-run');
    await expect(page.locator('#cc-stat-input')).toHaveText('5');
    await expect(page.locator('#cc-stat-output')).toHaveText('3');
    await expect(page.locator('#cc-stat-empty')).toHaveText('1');
    await expect(page.locator('#cc-stat-duplicate')).toHaveText('1');
    await expect(page.locator('#cc-preview')).toContainText('김오피스');

    const { buffer, name } = await captureDownload(page, () => page.click('#cc-csv'));
    expect(name).toBe('messy-cleaned.csv');
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
    const lines = text.split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe('이름,부서,금액');
    expect(lines[1]).toBe('김오피스,개발,1200000');
    expect(text).not.toContain(' 김오피스 ');
  });

  test('필터와 숫자 정렬을 적용한다', async ({ page }) => {
    await page.goto('/tools/csv-clean/');
    await page.setInputFiles('#cc-input', fixture('messy.csv'));
    await expect(page.locator('#cc-panel')).toBeVisible({ timeout: 20_000 });

    await page.selectOption('#cc-filter-column', '1');
    await page.selectOption('#cc-filter-operator', 'equals');
    await page.fill('#cc-filter-value', '영업');
    await page.selectOption('#cc-sort-column', '2');
    await page.selectOption('#cc-sort-direction', 'desc');
    await page.click('#cc-run');

    await expect(page.locator('#cc-stat-output')).toHaveText('2');
    await expect(page.locator('#cc-stat-filtered')).toHaveText('1');
    const { buffer } = await captureDownload(page, () => page.click('#cc-csv'));
    const lines = buffer
      .toString('utf8')
      .replace(/^\uFEFF/, '')
      .split('\n');
    expect(lines[1]).toBe('이데이터,영업,950000');
    expect(lines[2]).toBe('박영업,영업,800000');
  });

  test('XLSX로 저장한다', async ({ page }) => {
    await page.goto('/tools/csv-clean/');
    await page.setInputFiles('#cc-input', fixture('messy.csv'));
    await expect(page.locator('#cc-panel')).toBeVisible({ timeout: 20_000 });
    await page.click('#cc-run');

    const { buffer, name } = await captureDownload(page, () => page.click('#cc-xlsx'));
    expect(name).toBe('messy-cleaned.xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
    if (!sheet) throw new Error('시트를 찾지 못했습니다.');
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
    expect(rows).toHaveLength(4);
  });

  test('표가 아닌 파일은 거부한다', async ({ page }) => {
    await page.goto('/tools/csv-clean/');
    await page.setInputFiles('#cc-input', fixture('big.jpg'));
    await expect(page.locator('#cc-error')).toContainText('CSV·TSV·XLSX');
  });
});
