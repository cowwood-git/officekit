import { readFile, truncate, writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { captureDownload, fixture, imageDpi, imageSize } from './fixtures';

/**
 * 2026-11-20 전수 리뷰에서 E2E가 하나도 없던 도구 8개.
 * 화면이 뜨는지가 아니라 결과 파일(쪽수·픽셀 크기·dpi·data URI)이 맞는지 본다.
 */

test.describe('PDF 흑백 변환', () => {
  test('쪽수를 유지한 흑백 PDF를 만든다', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/tools/pdf-grayscale/');
    await page.setInputFiles('#pg-input', fixture('pages.pdf'));
    await expect(page.locator('#pg-panel')).toBeVisible({ timeout: 20_000 });
    await page.click('#pg-apply');
    await expect(page.locator('#pg-result')).toBeVisible({ timeout: 90_000 });
    const { buffer, name } = await captureDownload(page, () => page.click('#pg-download'));
    expect(name).toMatch(/\.pdf$/);
    expect((await PDFDocument.load(buffer)).getPageCount()).toBe(5);
  });
});

test.describe('이미지 워터마크', () => {
  test('원본 크기 그대로 워터마크를 넣어 저장한다', async ({ page }) => {
    await page.goto('/tools/image-watermark/');
    await page.setInputFiles('#wm-input', fixture('exif.jpg'));
    await expect(page.locator('#wm-panel')).toBeVisible({ timeout: 20_000 });
    await page.fill('#wm-text', '사내한정');
    await page.click('#wm-apply');
    await expect(page.locator('#wm-result')).toBeVisible({ timeout: 30_000 });
    const { buffer } = await captureDownload(page, () => page.click('#wm-download'));
    expect(imageSize(buffer)).toEqual({ type: 'jpeg', width: 1200, height: 800 });
  });
});

test.describe('이미지 크기 조정', () => {
  test('가로 600px로 줄이면 비율대로 세로가 맞춰진다', async ({ page }) => {
    await page.goto('/tools/image-resize/');
    await page.setInputFiles('#ic-input', fixture('exif.jpg'));
    await expect(page.locator('#ic-panel')).toBeVisible({ timeout: 20_000 });
    await page.selectOption('#ir-mode', 'width');
    await page.fill('#ir-width', '600');
    await page.click('#ic-convert');
    await expect(page.locator('#ic-result')).toBeVisible({ timeout: 30_000 });
    const { buffer } = await captureDownload(page, () => page.click('#ic-download'));
    const size = imageSize(buffer);
    expect(size.width).toBe(600);
    expect(size.height).toBe(400);
  });
});

test.describe('이미지 비교', () => {
  test('같은 이미지는 같다고, 다른 이미지는 차이를 알려 준다', async ({ page }) => {
    await page.goto('/tools/image-compare/');
    await page.setInputFiles('#ic-input-0', fixture('exif.jpg'));
    await page.setInputFiles('#ic-input-1', fixture('exif.jpg'));
    await expect(page.locator('#ic-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#ic-stat')).toContainText('같습니다');

    // 원본 오른쪽 아래에 검은 상자를 덮어 실제로 다른 이미지를 만든다.
    const box = await sharp({
      create: { width: 300, height: 200, channels: 3, background: '#000000' },
    })
      .png()
      .toBuffer();
    const changed = await sharp(fixture('exif.jpg'))
      .composite([{ input: box, left: 850, top: 550 }])
      .jpeg({ quality: 92 })
      .toBuffer();
    await page.setInputFiles('#ic-input-1', {
      name: 'changed.jpg',
      mimeType: 'image/jpeg',
      buffer: changed,
    });
    await expect(page.locator('#ic-stat')).toContainText('다른 픽셀');

    const { buffer, name } = await captureDownload(page, () => page.click('#ic-save'));
    expect(name).toMatch(/^compare.*\.png$/);
    expect(imageSize(buffer).type).toBe('png');
  });
});

test.describe('이미지 색상 추출', () => {
  test('고른 개수만큼 대표 색을 뽑는다', async ({ page }) => {
    await page.goto('/tools/image-colors/');
    await page.setInputFiles('#cx-input', fixture('exif.jpg'));
    await expect(page.locator('#cx-panel')).toBeVisible({ timeout: 20_000 });
    const swatches = page.locator('#cx-swatches > *');
    await expect(swatches.first()).toBeVisible();
    expect(await swatches.count()).toBeLessThanOrEqual(6);

    await page.selectOption('#cx-count', '4');
    await expect.poll(() => swatches.count()).toBeLessThanOrEqual(4);
    expect(await swatches.count()).toBeGreaterThan(0);
  });

  test('50MB를 넘는 이미지는 열기 전에 막는다', async ({ page }, testInfo) => {
    // Playwright는 50MB 넘는 버퍼를 직접 넘기지 못해 희소 파일로 만든다.
    const huge = testInfo.outputPath('huge.png');
    await writeFile(huge, '');
    await truncate(huge, 51 * 1024 * 1024);
    await page.goto('/tools/image-colors/');
    await page.setInputFiles('#cx-input', huge);
    await expect(page.locator('#cx-error')).toContainText('50.0 MB');
    await expect(page.locator('#cx-panel')).toBeHidden();
  });
});

test.describe('이미지 DPI 변경', () => {
  test('픽셀은 그대로 두고 300dpi로 기록한다', async ({ page }) => {
    await page.goto('/tools/image-dpi/');
    await page.setInputFiles('#id-input', fixture('exif.jpg'));
    await expect(page.locator('#id-panel')).toBeVisible({ timeout: 20_000 });
    await page.selectOption('#id-preset', '300');
    await page.click('#id-apply');
    await expect(page.locator('#id-result')).toBeVisible({ timeout: 30_000 });
    const { buffer } = await captureDownload(page, () => page.click('#id-download'));
    expect(imageSize(buffer)).toMatchObject({ width: 1200, height: 800 });
    expect(imageDpi(buffer)).toBe(300);
  });
});

test.describe('이미지 Base64', () => {
  test('인코딩한 data URI를 다시 이미지로 되돌린다', async ({ page }) => {
    const original = await readFile(fixture('wide.png'));
    await page.goto('/tools/image-base64/');
    await page.setInputFiles('#b6-input', fixture('wide.png'));
    const output = page.locator('#b6-output');
    await expect(output).toHaveValue(/^data:image\/png;base64,/, { timeout: 20_000 });
    const uri = await output.inputValue();
    expect(Buffer.from(uri.split(',')[1] ?? '', 'base64').equals(original)).toBe(true);

    await page.fill('#b6-paste', uri);
    await page.click('#b6-decode');
    await expect(page.locator('#b6-decoded')).toBeVisible();
    const { buffer } = await captureDownload(page, () => page.click('#b6-download'));
    expect(imageSize(buffer)).toEqual({ type: 'png', width: 400, height: 200 });
  });
});

test.describe('문서 스캐너', () => {
  test('사진 한 장을 사진 방향의 A4 PDF 한 쪽으로 만든다', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/tools/doc-scanner/');
    await page.setInputFiles('#ds-input', fixture('scan.png'));
    await expect(page.locator('#ds-panel')).toBeVisible({ timeout: 30_000 });
    await page.selectOption('#ds-format', 'pdf');
    await page.click('#ds-save');
    await expect(page.locator('#ds-result')).toBeVisible({ timeout: 90_000 });
    const { buffer, name } = await captureDownload(page, () => page.click('#ds-download'));
    expect(name).toMatch(/\.pdf$/);
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(1);
    // scan.png는 가로(900×500)라 A4도 가로로 놓인다.
    const { width, height } = pdf.getPage(0).getSize();
    expect([Math.round(width), Math.round(height)]).toEqual([842, 595]);
  });
});

test.describe('QR·바코드 읽기 용량 제한', () => {
  test('50MB를 넘는 이미지는 미리보기 전에 막는다', async ({ page }, testInfo) => {
    const huge = testInfo.outputPath('huge-qr.png');
    await writeFile(huge, '');
    await truncate(huge, 51 * 1024 * 1024);
    await page.goto('/tools/qr-reader/');
    await page.setInputFiles('#qrr-input', huge);
    await expect(page.locator('#qrr-error')).toContainText('50.0 MB');
    await expect(page.locator('#qrr-preview')).toBeHidden();
  });
});
