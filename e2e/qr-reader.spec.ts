import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { captureDownload, fixture } from './fixtures';

test.describe('QR·바코드 읽기', () => {
  test('이미지에서 QR을 인식해 링크를 연다', async ({ page }) => {
    await page.goto('/tools/qr-reader/');

    await page.setInputFiles('#qrr-input', fixture('qr-sample.png'));
    await page.click('#qrr-scan');
    await expect(page.locator('#qrr-result')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#qrr-result-text')).toHaveText('https://officekit.kr');
    await expect(page.locator('#qrr-format')).toHaveText('QR 코드');

    const openLink = page.locator('#qrr-open');
    await expect(openLink).toBeVisible();
    await expect(openLink).toHaveAttribute('href', 'https://officekit.kr');
    await expect(openLink).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(page.locator('#qrr-preview')).toBeVisible();

    await expect(page.locator('#qrr-recent li')).toHaveCount(1);
    await expect(page.locator('#qrr-recent')).toContainText('https://officekit.kr');
  });

  test('링크가 아닌 텍스트는 링크 열기를 숨긴다', async ({ page }) => {
    await page.goto('/tools/qr-reader/');

    await page.setInputFiles('#qrr-input', fixture('qr-text.png'));
    await page.click('#qrr-scan');
    await expect(page.locator('#qrr-result-text')).toHaveText('OFFICEKIT-2026');
    await expect(page.locator('#qrr-open')).toBeHidden();
  });

  test('코드가 없는 이미지는 안내 메시지를 보여준다', async ({ page }) => {
    await page.goto('/tools/qr-reader/');

    await page.setInputFiles('#qrr-input', fixture('wide.png'));
    await page.click('#qrr-scan');
    await expect(page.locator('#qrr-error')).toContainText('코드를 찾지 못했습니다', {
      timeout: 20_000,
    });
    await expect(page.locator('#qrr-result')).toBeHidden();
  });

  test('결과 지우기가 상태를 초기화한다', async ({ page }) => {
    await page.goto('/tools/qr-reader/');

    await page.setInputFiles('#qrr-input', fixture('qr-sample.png'));
    await page.click('#qrr-scan');
    await expect(page.locator('#qrr-result')).toBeVisible({ timeout: 20_000 });
    await page.click('#qrr-clear');
    await expect(page.locator('#qrr-result')).toBeHidden();
    await expect(page.locator('#qrr-recent')).toContainText('아직 인식한 코드가 없습니다');
    await expect(page.locator('#qrr-preview')).toBeHidden();
  });

  test('BarcodeDetector 가 없는 브라우저: zxing-wasm 으로 QR·바코드를 읽는다', async ({
    page,
  }, testInfo) => {
    // Windows Chrome·Firefox·Safari 처럼 기본 감지기가 없는 환경을 흉내 낸다.
    await page.addInitScript(() => {
      // biome-ignore lint/suspicious/noExplicitAny: 테스트에서 전역 기능을 지운다
      delete (window as any).BarcodeDetector;
    });

    await page.goto('/tools/barcode-generator/');
    await page.selectOption('#bc-format', 'EAN13');
    await page.fill('#bc-value', '400638133393');
    await expect(page.locator('#bc-png')).toBeEnabled();
    const { buffer } = await captureDownload(page, () => page.click('#bc-png'));
    const barcode = testInfo.outputPath('ean13.png');
    await writeFile(barcode, buffer);

    await page.goto('/tools/qr-reader/');
    expect(await page.evaluate(() => 'BarcodeDetector' in window)).toBe(false);
    await page.setInputFiles('#qrr-input', fixture('qr-sample.png'));
    await page.click('#qrr-scan');
    await expect(page.locator('#qrr-result-text')).toHaveText('https://officekit.kr', {
      timeout: 20_000,
    });
    await expect(page.locator('#qrr-format')).toHaveText('QR 코드');

    await page.setInputFiles('#qrr-input', barcode);
    await page.click('#qrr-scan');
    await expect(page.locator('#qrr-result-text')).toHaveText('4006381333931', {
      timeout: 20_000,
    });
    await expect(page.locator('#qrr-format')).toHaveText('EAN-13');
  });
});
