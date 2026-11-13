import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';

test.describe('파일 해시', () => {
  test('SHA-256 해시를 계산하고 비교한다', async ({ page }) => {
    const content = 'officekit';
    const expected = createHash('sha256').update(content).digest('hex');
    await page.goto('/tools/file-hash/');
    await page.setInputFiles('#fh-input', {
      name: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(content),
    });
    await expect(page.locator('#fh-file')).toContainText('hello.txt');
    await page.click('#fh-run');
    await expect(page.locator('#fh-result')).toBeVisible();
    await expect(page.locator('#fh-hash')).toHaveText(expected);

    await page.fill('#fh-compare', expected.toUpperCase());
    await expect(page.locator('#fh-match')).toContainText('일치합니다');

    await page.fill('#fh-compare', 'deadbeef');
    await expect(page.locator('#fh-match')).toContainText('일치하지 않습니다');
  });

  test('알고리즘을 바꾸면 다시 계산한다', async ({ page }) => {
    await page.goto('/tools/file-hash/');
    await page.setInputFiles('#fh-input', {
      name: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('officekit'),
    });
    await page.selectOption('#fh-algo', 'SHA-512');
    await page.click('#fh-run');
    await expect(page.locator('#fh-result-title')).toHaveText('SHA-512 해시');
    await expect(page.locator('#fh-hash')).toHaveText(/^[0-9a-f]{128}$/);
  });

  test('다른 파일을 누르면 초기화된다', async ({ page }) => {
    await page.goto('/tools/file-hash/');
    await page.setInputFiles('#fh-input', {
      name: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('officekit'),
    });
    await page.click('#fh-run');
    await expect(page.locator('#fh-result')).toBeVisible();
    await page.click('#fh-reset');
    await expect(page.locator('#fh-panel')).toBeHidden();
    await expect(page.locator('#fh-result')).toBeHidden();
  });
});
