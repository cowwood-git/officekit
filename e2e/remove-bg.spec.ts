import { readFile } from 'node:fs/promises';
import { type ConsoleMessage, expect, test } from '@playwright/test';
import sharp from 'sharp';
import { captureDownload } from './fixtures';

/** 배포되는 기본 CSP(빌드된 dist/_headers 의 첫 Content-Security-Policy)를 그대로 적용한다 */
async function strictCsp(): Promise<string> {
  const headers = await readFile('dist/_headers', 'utf8');
  const line = headers
    .split('\n')
    .find((item) => item.trim().startsWith('Content-Security-Policy:'));
  if (!line) throw new Error('CSP를 찾지 못했습니다.');
  return line.trim().replace('Content-Security-Policy:', '').trim();
}

/** 밝은 단색 배경 위에 진한 물체(병 모양) 하나 */
async function subjectOnPlainBackground(): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
    <rect width="640" height="480" fill="#eef1f4"/>
    <rect x="270" y="90" width="100" height="40" rx="8" fill="#1d4ed8"/>
    <rect x="230" y="130" width="180" height="290" rx="40" fill="#b91c1c"/>
    <ellipse cx="320" cy="270" rx="60" ry="80" fill="#fde68a"/>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
}

test.describe('누끼 따기', () => {
  test('엄격한 CSP 에서 배경을 투명하게 지우고 PNG 로 저장한다', async ({ page }) => {
    const csp = await strictCsp();
    await page.route('**/tools/remove-background/', async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), 'content-security-policy': csp },
      });
    });
    const violations: string[] = [];
    const external: string[] = [];
    const threadWarnings: string[] = [];
    const onConsole = (message: ConsoleMessage) => {
      const text = message.text();
      // 한 스레드로만 도는 환경에서 onnxruntime 이 남기던 경고가 다시 나오지 않아야 한다.
      if (/numThreads|multi-threading/.test(text)) threadWarnings.push(text);
      if (
        /Content Security Policy/i.test(text) &&
        !/google|doubleclick|cloudflareinsights/.test(text)
      )
        violations.push(text);
    };
    page.on('console', onConsole);
    // 엔진은 워커 안에서 돌고, 워커의 콘솔은 따로 전달된다.
    page.on('worker', (worker) => worker.on('console', onConsole));
    page.on('request', (request) => {
      // 모델·엔진은 이 사이트에서만 받는다(외부 CDN 금지).
      if (/staticimgly|jsdelivr|unpkg/.test(request.url())) external.push(request.url());
      // 엔진은 /bg/ort-*/ 에서만 받는다(번들 안의 같은 wasm 을 또 받으면 24MB 를 두 번 받는다).
      if (/\/_astro\/ort-/.test(request.url())) external.push(request.url());
    });

    await page.goto('/tools/remove-background/');
    await page.setInputFiles('#rb-input', {
      name: 'bottle.jpg',
      mimeType: 'image/jpeg',
      buffer: await subjectOnPlainBackground(),
    });
    await expect(page.locator('#rb-size-note')).toContainText('MB');
    const started = Date.now();
    await page.click('#rb-run');
    await expect(page.locator('#rb-result')).toBeVisible({ timeout: 200_000 });
    console.log(
      `누끼 처리 ${((Date.now() - started) / 1000).toFixed(1)}초 (${await page.locator('#rb-result').getAttribute('data-device')})`,
    );
    await expect(page.locator('#rb-error')).toBeHidden();

    const { buffer, name: filename } = await captureDownload(page, () =>
      page.click('#rb-download'),
    );
    expect(filename).toBe('bottle-누끼.png');
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([640, 480]);
    const alpha = (x: number, y: number) =>
      data[(y * info.width + x) * info.channels + 3] ?? Number.NaN;
    const background: Array<[number, number]> = [
      [5, 5],
      [634, 5],
      [5, 474],
      [634, 474],
      [100, 240],
    ];
    for (const [x, y] of background) expect(alpha(x, y), `배경 ${x},${y}`).toBeLessThan(30);
    const subject: Array<[number, number]> = [
      [320, 270],
      [260, 380],
      [320, 105],
    ];
    for (const [x, y] of subject) expect(alpha(x, y), `물체 ${x},${y}`).toBeGreaterThan(220);

    // 흰 배경 + JPG
    await page.check('input[name="rb-bg"][value="white"]');
    await page.selectOption('#rb-format', 'jpg');
    await expect(page.locator('#rb-download')).toContainText('JPG');
    const jpg = await captureDownload(page, () => page.click('#rb-download'));
    expect(jpg.name).toBe('bottle-누끼.jpg');
    const white = await sharp(jpg.buffer).raw().toBuffer({ resolveWithObject: true });
    const rgb = (x: number, y: number) => {
      const at = (y * white.info.width + x) * white.info.channels;
      return Array.from(white.data.subarray(at, at + 3));
    };
    for (const [x, y] of background)
      for (const value of rgb(x, y)) expect(value).toBeGreaterThan(245);
    // 물체 색은 그대로 남는다(노란 타원).
    expect(rgb(320, 270)[2]).toBeLessThan(200);

    expect(violations).toEqual([]);
    expect(external).toEqual([]);
    expect(threadWarnings).toEqual([]);
  });

  test('증명사진: 원래 배경을 지우면 고른 배경색이 보인다', async ({ page }) => {
    await page.goto('/tools/id-photo/');
    await page.setInputFiles('#ip-input', {
      name: 'person.jpg',
      mimeType: 'image/jpeg',
      buffer: await subjectOnPlainBackground(),
    });
    await page.uncheck('#ip-guide');
    // 미리보기에서 원래 배경색(#eef1f4)에 가까운 픽셀 비율
    const backgroundShare = () =>
      page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>('#ip-preview');
        const data = canvas?.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (!data) return -1;
        let hit = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (
            Math.abs((data[i] ?? 0) - 238) < 6 &&
            Math.abs((data[i + 1] ?? 0) - 241) < 6 &&
            Math.abs((data[i + 2] ?? 0) - 244) < 6
          )
            hit += 1;
        }
        return hit / (data.length / 4);
      });
    const before = await backgroundShare();
    expect(before).toBeGreaterThan(0.05);

    await page.check('#ip-cutout');
    await expect(page.locator('#ip-status')).toContainText('배경을 지웠습니다', {
      timeout: 200_000,
    });
    await expect(page.locator('#ip-error')).toBeHidden();
    expect(await backgroundShare()).toBeLessThan(before / 10);

    // 끄면 원본으로 돌아간다.
    await page.uncheck('#ip-cutout');
    expect(await backgroundShare()).toBeCloseTo(before, 2);
  });
});
