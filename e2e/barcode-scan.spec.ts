import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { decodeBarcodePng } from './barcode-decode';
import { captureDownload } from './fixtures';

const scan = async (
  page: import('@playwright/test').Page,
  format: string,
  value: string,
): Promise<string> => {
  await page.selectOption('#bc-format', format);
  await page.fill('#bc-value', value);
  await expect(page.locator('#bc-png')).toBeEnabled();
  const { buffer } = await captureDownload(page, () => page.click('#bc-png'));
  return (await decodeBarcodePng(buffer)).text;
};

test.describe('바코드 스캔 자동화', () => {
  test('Code 128·EAN-13·UPC-A·ITF-14를 디코더로 읽는다', async ({ page }) => {
    await page.goto('/tools/barcode-generator/');
    expect(await scan(page, 'CODE128', 'OK-2026-001')).toBe('OK-2026-001');
    expect(await scan(page, 'EAN13', '400638133393')).toBe('4006381333931');
    expect(await scan(page, 'UPC', '03600029145')).toBe('036000291452');
    expect(await scan(page, 'EAN8', '9638507')).toBe('96385074');
    expect(await scan(page, 'CODE39', 'ASSET-001')).toBe('ASSET-001');
    expect(await scan(page, 'ITF14', '1001234500001')).toBe('10012345000017');
  });

  test('GS1-128 AI 데이터를 FNC1과 함께 읽는다', async ({ page }) => {
    await page.goto('/tools/barcode-generator/');
    const text = await scan(page, 'GS1-128', '(01)12345678901231|(10)LOT-001');
    expect(text).toContain('0112345678901231');
    expect(text).toContain('10LOT-001');
  });

  test('ITF-14 Bearer bar를 켜도 스캔된다', async ({ page }) => {
    await page.goto('/tools/barcode-generator/');
    await page.selectOption('#bc-format', 'ITF14');
    await page.fill('#bc-value', '1001234500001');
    await expect(page.locator('#bc-bearer-wrap')).toBeVisible();
    await page.check('#bc-bearer');
    await expect(page.locator('#bc-png')).toBeEnabled();
    const { buffer } = await captureDownload(page, () => page.click('#bc-png'));
    expect((await decodeBarcodePng(buffer)).text).toBe('10012345000017');
  });
});

test.describe('바코드 배치 스캔 자동화', () => {
  test('GS1-128 CSV 배치 PNG도 디코더로 읽는다', async ({ page }) => {
    await page.goto('/tools/barcode-generator/');
    await page.check('#bc-mode-batch');
    await page.setInputFiles('#bc-file', {
      name: 'gs1.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('바코드,상품명,가격\n(01)12345678901231|(10)LOT-001,GS1 상품,1000'),
    });
    await page.selectOption('#bc-batch-format', 'GS1-128');
    await expect(page.locator('#bc-batch-note')).toContainText('1개 코드가 모두');
    const { buffer } = await captureDownload(page, () => page.click('#bc-batch-zip'));
    const zip = await JSZip.loadAsync(buffer);
    const file = zip.file('011234567890123110LOT-001.png');
    expect(file).not.toBeNull();
    const png = await file?.async('nodebuffer');
    expect(png).toBeDefined();
    const decoded = await decodeBarcodePng(png as Buffer);
    expect(decoded.text).toContain('0112345678901231');
    expect(decoded.text).toContain('10LOT-001');
  });
});
