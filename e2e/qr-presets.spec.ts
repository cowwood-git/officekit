import { expect, test } from '@playwright/test';

test.describe('QR 프리셋', () => {
  test('WiFi QR 내용을 만든다', async ({ page }) => {
    await page.goto('/tools/qr-generate/');
    await page.selectOption('#qr-preset', 'wifi');
    await page.fill('#qr-wifi-ssid', 'OfficeKit');
    await page.fill('#qr-wifi-password', 'pass123');
    await expect(page.locator('#qr-payload')).toHaveText('WIFI:T:WPA;S:OfficeKit;P:pass123;;');
    await expect(page.locator('#qr-download-png')).toBeEnabled({ timeout: 10_000 });
  });

  test('명함 vCard QR 내용을 만든다', async ({ page }) => {
    await page.goto('/tools/qr-generate/');
    await page.selectOption('#qr-preset', 'vcard');
    await page.fill('#qr-vcard-name', '김오피스');
    await page.fill('#qr-vcard-org', '오피스킷');
    await page.fill('#qr-vcard-phone', '010-1234-5678');
    await page.fill('#qr-vcard-email', 'hello@officekit.kr');

    const payload = page.locator('#qr-payload');
    await expect(payload).toContainText('BEGIN:VCARD');
    await expect(payload).toContainText('FN:김오피스');
    await expect(payload).toContainText('ORG:오피스킷');
    await expect(payload).toContainText('TEL;TYPE=CELL:010-1234-5678');
  });

  test('이메일·전화·SMS 내용을 만든다', async ({ page }) => {
    await page.goto('/tools/qr-generate/');

    await page.selectOption('#qr-preset', 'email');
    await page.fill('#qr-email-to', 'hello@officekit.kr');
    await page.fill('#qr-email-subject', '문의');
    await expect(page.locator('#qr-payload')).toContainText('mailto:hello@officekit.kr?subject=');

    await page.selectOption('#qr-preset', 'phone');
    await page.fill('#qr-phone-number', '010-1234-5678');
    await expect(page.locator('#qr-payload')).toHaveText('tel:01012345678');

    await page.selectOption('#qr-preset', 'sms');
    await page.fill('#qr-sms-number', '010-1234-5678');
    await page.fill('#qr-sms-message', '안녕하세요');
    await expect(page.locator('#qr-payload')).toHaveText('SMSTO:01012345678:안녕하세요');
  });

  test('URL 프리셋은 https를 자동으로 붙인다', async ({ page }) => {
    await page.goto('/tools/qr-generate/');
    await page.selectOption('#qr-preset', 'url');
    await page.fill('#qr-text', 'officekit.kr');
    await expect(page.locator('#qr-payload')).toHaveText('https://officekit.kr');
  });
});
