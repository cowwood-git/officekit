import { expect, test } from '@playwright/test';
import { fixture } from './fixtures';

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
});
