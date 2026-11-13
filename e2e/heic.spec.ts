import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { captureDownload, fixture } from './fixtures';

/** 배포되는 기본 CSP(빌드된 dist/_headers 의 첫 Content-Security-Policy)를 그대로 적용한다 */
async function strictCsp(): Promise<string> {
  const headers = await readFile('dist/_headers', 'utf8');
  const line = headers
    .split('\n')
    .find((item) => item.trim().startsWith('Content-Security-Policy:'));
  if (!line) throw new Error('CSP를 찾지 못했습니다.');
  return line.trim().replace('Content-Security-Policy:', '').trim();
}

test.describe('HEIC 변환', () => {
  test.skip(!existsSync(fixture('sample.heic')), 'HEIC 예제를 만들 수 없는 환경');

  test('엄격한 CSP(unsafe-eval 없이)에서 HEIC → JPG', async ({ page }) => {
    const csp = await strictCsp();
    expect(csp).not.toContain("'unsafe-eval'");
    await page.route('**/tools/heic-to-jpg/', async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), 'content-security-policy': csp },
      });
    });
    const violations: string[] = [];
    page.on('console', (message) => {
      // 이 도구가 쓰는 워커·wasm 이 CSP 에 막히는지만 본다(광고·통계 출처는 따로 관리).
      const text = message.text();
      if (
        /Content Security Policy/i.test(text) &&
        !/google|doubleclick|cloudflareinsights/.test(text)
      )
        violations.push(text);
    });

    await page.goto('/tools/heic-to-jpg/');
    await page.setInputFiles('#heic-input', fixture('sample.heic'));
    await page.click('#heic-convert');
    await expect(page.locator('#heic-result')).toBeVisible({ timeout: 60_000 });
    const { buffer } = await captureDownload(page, () => page.click('#heic-download'));
    const meta = await sharp(buffer).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBeGreaterThan(100);
    expect(violations).toEqual([]);
  });
});
