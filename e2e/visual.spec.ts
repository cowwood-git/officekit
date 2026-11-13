import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';

async function prepare(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
}

test.describe('시각 회귀', () => {
  test('홈 (데스크톱)', async ({ page }) => {
    await prepare(page, '/');
    await expect(page).toHaveScreenshot(`home-desktop.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('PDF 합치기 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/pdf-merge/');
    await expect(page).toHaveScreenshot(`pdf-merge-desktop.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('이미지 압축 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/image-compress/');
    await expect(page).toHaveScreenshot(`image-compress-desktop.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('이미지 OCR (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/image-ocr/');
    await expect(page).toHaveScreenshot(`image-ocr-desktop.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('날짜·영업일 계산기 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/date-calc/');
    await page.fill('#dc-start', '2026-02-13');
    await page.fill('#dc-end', '2026-02-19');
    await page.fill('#dc-base', '2026-02-13');
    await page.fill('#dc-amount', '1');
    await page.selectOption('#dc-unit', 'business');
    await expect(page.locator('#dc-result')).toContainText('2026년 2월 19일');
    await expect(page).toHaveScreenshot('date-calc-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('QR·바코드 읽기 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/qr-reader/');
    await page.setInputFiles(
      '#qrr-input',
      join(process.cwd(), 'e2e', '.fixtures', 'qr-sample.png'),
    );
    await expect(page.locator('#qrr-result-text')).toHaveText('https://officekit.kr', {
      timeout: 20_000,
    });
    await expect(page).toHaveScreenshot('qr-reader-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('PDF 워터마크 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/pdf-watermark/');
    await page.setInputFiles('#pw-input', join(process.cwd(), 'e2e', '.fixtures', 'pages.pdf'));
    await expect(page.locator('#pw-preview-label')).toContainText('전체 5쪽');
    await expect(page).toHaveScreenshot('pdf-watermark-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('PDF 페이지 번호 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/pdf-page-number/');
    await page.setInputFiles('#pn-input', join(process.cwd(), 'e2e', '.fixtures', 'pages.pdf'));
    await expect(page.locator('#pn-preview-label')).toContainText('전체 5쪽');
    await page.selectOption('#pn-format', 'fraction');
    await expect(page).toHaveScreenshot('pdf-page-number-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('텍스트 정리 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/text-cleanup/');
    await page.fill('#tc-input', '  사과  \n\n 바나나 \n 사과 \n');
    await page.check('#tc-dedupe');
    await expect(page.locator('#tc-output')).toHaveValue('사과\n바나나');
    await expect(page).toHaveScreenshot('text-cleanup-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('퍼센트·부가세 계산기 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/percent-calc/');
    await page.fill('#pcv-of-value', '1000000');
    await page.fill('#pcv-of-percent', '15');
    await page.fill('#pcv-ratio-part', '25000');
    await page.fill('#pcv-ratio-whole', '200000');
    await page.fill('#pcv-change-from', '100000');
    await page.fill('#pcv-change-to', '120000');
    await page.fill('#pcv-vat-amount', '1000000');
    await expect(page.locator('#pcv-vat-total')).toHaveText('1,100,000원');
    await page.locator('#pcv-vat-amount').blur();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('percent-calc-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('PDF 모아찍기 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/pdf-nup/');
    await page.setInputFiles('#nu-input', join(process.cwd(), 'e2e', '.fixtures', 'pages.pdf'));
    await expect(page.locator('#nu-preview-label')).toContainText('1 / 3장');
    await expect(page).toHaveScreenshot('pdf-nup-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('이미지 합치기 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/image-merge/');
    await page.setInputFiles('#im-input', [
      join(process.cwd(), 'e2e', '.fixtures', 'big.jpg'),
      join(process.cwd(), 'e2e', '.fixtures', 'wide.png'),
    ]);
    await expect(page.locator('#im-info')).toContainText('2장');
    await expect(page).toHaveScreenshot('image-merge-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('CSV 정리 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/csv-clean/');
    await page.setInputFiles('#cc-input', join(process.cwd(), 'e2e', '.fixtures', 'messy.csv'));
    await expect(page.locator('#cc-stat-output')).toHaveText('3');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('csv-clean-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('PDF 여백 자르기 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/pdf-crop/');
    await page.setInputFiles('#pc-input', join(process.cwd(), 'e2e', '.fixtures', 'pages.pdf'));
    await expect(page.locator('#pc-preview-label')).toContainText('189.9×277.0mm');
    await expect(page).toHaveScreenshot('pdf-crop-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('이미지 정보·EXIF (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/image-info/');
    await page.setInputFiles('#ii-input', join(process.cwd(), 'e2e', '.fixtures', 'exif.jpg'));
    await expect(page.locator('#ii-exif')).toContainText('TestCam');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('image-info-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('CSV → HTML·Markdown (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/csv-table/');
    await page.setInputFiles('#ct-input', join(process.cwd(), 'e2e', '.fixtures', 'messy.csv'));
    await expect(page.locator('#ct-preview')).toContainText('김오피스');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('csv-table-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('PDF 머리글·바닥글 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/pdf-header-footer/');
    await page.setInputFiles('#hf-input', join(process.cwd(), 'e2e', '.fixtures', 'pages.pdf'));
    await expect(page.locator('#hf-preview-label')).toContainText('전체 5쪽');
    await expect(page).toHaveScreenshot('pdf-header-footer-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('PDF 이미지 추출 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/pdf-image-extract/');
    await page.setInputFiles('#ie-input', join(process.cwd(), 'e2e', '.fixtures', 'scanned.pdf'));
    await expect(page.locator('#ie-panel')).toBeVisible({ timeout: 20_000 });
    await page.click('#ie-extract');
    await expect(page.locator('#ie-result')).toBeVisible({ timeout: 30_000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('pdf-image-extract-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('CSV → SQL (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/csv-sql/');
    await page.setInputFiles('#cs-input', join(process.cwd(), 'e2e', '.fixtures', 'messy.csv'));
    await expect(page.locator('#cs-code')).toHaveValue(/CREATE TABLE/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('csv-sql-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('CSV → PDF 표 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/csv-pdf/');
    await page.setInputFiles('#cp-input', join(process.cwd(), 'e2e', '.fixtures', 'messy.csv'));
    await expect(page.locator('#cp-page-info')).toContainText('1 / 1페이지');
    await expect(page).toHaveScreenshot('csv-pdf-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('JSON 비교 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/json-tools/');
    await page.selectOption('#jt-operation', 'diff');
    await page.fill('#jt-input-a', '{"a":1,"b":{"c":2}}');
    await page.fill('#jt-input-b', '{"a":2,"b":{"c":2,"d":3}}');
    await expect(page.locator('#jt-output')).toHaveValue(/~ a: 1 → 2/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('json-tools-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('PDF 서명·도장 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/pdf-sign/');
    await page.setInputFiles('#ps-input', join(process.cwd(), 'e2e', '.fixtures', 'pages.pdf'));
    await expect(page.locator('#ps-panel')).toBeVisible({ timeout: 20_000 });
    await page.click('#ps-source-tabs button[data-source="upload"]');
    await page.setInputFiles(
      '#ps-signature-input',
      join(process.cwd(), 'e2e', '.fixtures', 'signature.png'),
    );
    await expect(page.locator('#ps-apply')).toBeEnabled({ timeout: 20_000 });
    await expect(page).toHaveScreenshot('pdf-sign-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('CSV 피벗 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/csv-pivot/');
    await page.setInputFiles('#cpv-input', join(process.cwd(), 'e2e', '.fixtures', 'pivot.csv'));
    await expect(page.locator('#cpv-preview')).toContainText('부산');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('csv-pivot-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('CSV 조인 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/csv-join/');
    await page.setInputFiles(
      '#cj-left-input',
      join(process.cwd(), 'e2e', '.fixtures', 'join-left.csv'),
    );
    await page.setInputFiles(
      '#cj-right-input',
      join(process.cwd(), 'e2e', '.fixtures', 'join-right.csv'),
    );
    await expect(page.locator('#cj-preview')).toContainText('a@officekit.kr');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('csv-join-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('이미지 테두리·둥근 모서리 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/image-frame/');
    await page.setInputFiles('#ifr-input', join(process.cwd(), 'e2e', '.fixtures', 'big.jpg'));
    await expect(page.locator('#ifr-panel')).toBeVisible();
    await page.fill('#ifr-radius', '40');
    await page.fill('#ifr-border', '10');
    await page.fill('#ifr-border-color', '#0b6b5b');
    await page.fill('#ifr-padding', '24');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('image-frame-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('PDF 양식 채우기 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/pdf-form-fill/');
    await page.setInputFiles('#pf-input', join(process.cwd(), 'e2e', '.fixtures', 'form.pdf'));
    await expect(page.locator('#pf-field-count')).toContainText('7 / 7개 필드');
    await page.fill('#pf-field-0', '김오피스');
    await page.fill('#pf-field-1', '개발팀');
    await page.check('#pf-field-2');
    await page.selectOption('#pf-field-3', 'male');
    await page.selectOption('#pf-field-4', 'dev');
    await page.selectOption('#pf-field-5', ['design', 'data']);
    await page.fill('#pf-field-6', '첫째 줄\n둘째 줄');
    await page.locator('#pf-fields').evaluate((element) => {
      element.scrollTop = 0;
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('pdf-form-fill-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('PDF 가리기 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/pdf-redact/');
    await page.setInputFiles('#rd-input', join(process.cwd(), 'e2e', '.fixtures', 'pages.pdf'));
    await expect(page.locator('#rd-panel')).toBeVisible({ timeout: 20_000 });
    const overlay = page.locator('#rd-overlay');
    const box = await overlay.boundingBox();
    if (!box) throw new Error('미리보기를 찾지 못했습니다.');
    await page.mouse.move(box.x + box.width * 0.08, box.y + box.height * 0.06);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.2, {
      steps: 5,
    });
    await page.mouse.up();
    await expect(page.locator('#rd-preview-label')).toContainText('가리기 1개');
    await expect(page).toHaveScreenshot('pdf-redact-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('이미지 콜라주 (데스크톱)', async ({ page }) => {
    await prepare(page, '/tools/image-collage/');
    await page.setInputFiles('#ic-input', [
      join(process.cwd(), 'e2e', '.fixtures', 'big.jpg'),
      join(process.cwd(), 'e2e', '.fixtures', 'wide.png'),
      join(process.cwd(), 'e2e', '.fixtures', 'ocr-en.png'),
      join(process.cwd(), 'e2e', '.fixtures', 'scan.png'),
    ]);
    await expect(page.locator('#ic-info')).toContainText('4장');
    await page.fill('#ic-gap', '16');
    await page.fill('#ic-radius', '24');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('image-collage-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('검색 다이얼로그', async ({ page }) => {
    await prepare(page, '/');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
    await page.locator('#search-input').fill('pdf');
    await expect(page.locator('#search-results li')).toHaveCount(8);
    await expect(page).toHaveScreenshot(`search-dialog.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('오프라인 안내 (모바일)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await prepare(page, '/offline/');
    await expect(page).toHaveScreenshot(`offline-mobile.png`, {
      maxDiffPixelRatio: 0.02,
    });
    await context.close();
  });
});
