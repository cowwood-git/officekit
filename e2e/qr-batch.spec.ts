import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { captureDownload } from './fixtures';

test.describe('QR 코드 대량 생성', () => {
  test('예시 항목을 QR PNG ZIP으로 만든다', async ({ page }) => {
    await page.goto('/tools/qr-batch/');
    await expect(page.locator('#qb-count')).toHaveText('3개');
    await expect(page.locator('#qb-preview img')).toHaveCount(3, { timeout: 10_000 });

    await page.click('#qb-generate');
    await expect(page.locator('#qb-result')).toBeVisible({ timeout: 60_000 });
    const { name, buffer } = await captureDownload(page, () => page.click('#qb-download'));
    expect(name).toMatch(/^QR-코드-\d{8}\.zip$/);

    const zip = await JSZip.loadAsync(buffer);
    const files = Object.keys(zip.files).sort();
    expect(files).toEqual(['PDF 합치기.png', '견적서.png', '홈페이지.png']);
    const first = zip.file(files[0] ?? '');
    expect(first).not.toBeNull();
    const bytes = await first?.async('uint8array');
    expect(bytes?.subarray(0, 8)).toEqual(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));
  });

  test('CSV의 내용과 파일 이름을 읽는다', async ({ page }) => {
    await page.goto('/tools/qr-batch/');
    await page.setInputFiles('#qb-file', {
      name: 'qrs.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('내용,파일명\nhttps://a.com,첫 번째\nhttps://b.com,두 번째'),
    });
    await expect(page.locator('#qb-count')).toHaveText('2개');
    await expect(page.locator('#qb-import-note')).toContainText('2개 항목');
    await expect(page.locator('.qb-row')).toHaveCount(2);
  });

  test('항목을 추가하고 삭제한다', async ({ page }) => {
    await page.goto('/tools/qr-batch/');
    await expect(page.locator('.qb-row')).toHaveCount(3);
    await page.click('#qb-add');
    await expect(page.locator('.qb-row')).toHaveCount(4);
    await page.locator('.qb-remove').last().click();
    await expect(page.locator('.qb-row')).toHaveCount(3);
  });

  test('내용이 너무 길면 안내한다', async ({ page }) => {
    await page.goto('/tools/qr-batch/');
    await page.locator('.qb-row [data-field="content"]').first().fill('가'.repeat(1200));
    await page.click('#qb-generate');
    await expect(page.locator('#qb-error')).toBeVisible();
    await expect(page.locator('#qb-error')).toContainText('너무 깁니다');
  });
});
