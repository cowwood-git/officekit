import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const SAMPLES = join(process.cwd(), 'e2e', 'samples');
const FIXTURES = join(process.cwd(), 'e2e', '.fixtures');

async function expectPdf(downloadPath: string | null): Promise<void> {
  expect(downloadPath).toBeTruthy();
  const bytes = readFileSync(downloadPath as string);
  expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  expect(bytes.byteLength).toBeGreaterThan(5000);
}

test.describe('오피스 문서 → PDF', () => {
  test('HWPX를 모든 페이지 PDF로 저장한다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/tools/hwpx-to-pdf/');
    await page.setInputFiles('#hp-input', join(SAMPLES, 'pages.hwpx'));
    await expect(page.locator('#hp-panel')).toBeVisible();
    await expect(page.locator('#hp-page-count')).toHaveText('6쪽');

    await page.click('#hp-convert');
    await expect(page.locator('#hp-result')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#hp-download')).toHaveAttribute('download', 'pages.pdf');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#hp-download'),
    ]);
    expect(download.suggestedFilename()).toBe('pages.pdf');
    await expectPdf(await download.path());
    expect(errors).toEqual([]);
  });

  test('DOCX를 A4 PDF로 저장한다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/tools/docx-to-pdf/');
    await page.setInputFiles('#dp-input', join(FIXTURES, 'sample.docx'));
    await expect(page.locator('#dp-panel')).toBeVisible();
    await expect(page.locator('#dp-page-count')).toHaveText('1쪽');

    await page.click('#dp-convert');
    await expect(page.locator('#dp-result')).toBeVisible({ timeout: 60_000 });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#dp-download'),
    ]);
    expect(download.suggestedFilename()).toBe('sample.pdf');
    await expectPdf(await download.path());
    expect(errors).toEqual([]);
  });

  test('PPTX 슬라이드를 PDF로 저장한다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/tools/pptx-to-pdf/');
    await page.setInputFiles('#tp-input', join(SAMPLES, 'sample.pptx'));
    await expect(page.locator('#tp-panel')).toBeVisible();
    await expect(page.locator('#tp-slide-count')).toHaveText('5장');

    await page.click('#tp-convert');
    await expect(page.locator('#tp-result')).toBeVisible({ timeout: 90_000 });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#tp-download'),
    ]);
    expect(download.suggestedFilename()).toBe('sample.pdf');
    await expectPdf(await download.path());
    expect(errors).toEqual([]);
  });

  test('구형 PPT도 PDF로 저장한다', async ({ page }) => {
    await page.goto('/tools/pptx-to-pdf/');
    await page.setInputFiles('#tp-input', join(SAMPLES, 'legacy.ppt'));
    await expect(page.locator('#tp-panel')).toBeVisible();
    await expect(page.locator('#tp-slide-count')).toHaveText('2장');

    await page.click('#tp-convert');
    await expect(page.locator('#tp-result')).toBeVisible({ timeout: 60_000 });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#tp-download'),
    ]);
    await expectPdf(await download.path());
  });
});
