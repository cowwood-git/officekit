import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';
import { countPageImages } from './pdf-image-count';
import { extractPdfText } from './pdf-text';

async function dragBox(
  page: import('@playwright/test').Page,
  from: [number, number],
  to: [number, number],
) {
  await page.waitForFunction(
    () => !document.querySelector('[data-tool-body]')?.classList.contains('is-loading'),
  );
  const overlay = page.locator('#rd-overlay');
  const box = await overlay.boundingBox();
  if (!box) throw new Error('미리보기를 찾지 못했습니다.');
  await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], {
    steps: 5,
  });
  await page.mouse.up();
}

test.describe('PDF 가리기', () => {
  test('가린 페이지의 텍스트를 제거하고 나머지는 유지한다', async ({ page }) => {
    await page.goto('/tools/pdf-redact/');
    await page.setInputFiles('#rd-input', fixture('pages.pdf'));
    await expect(page.locator('#rd-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#rd-preview-label')).toContainText('1 / 5쪽');

    await dragBox(page, [0.08, 0.06], [0.62, 0.2]);
    await expect(page.locator('#rd-preview-label')).toContainText('가리기 1개');

    await page.click('#rd-apply');
    await expect(page.locator('#rd-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#rd-result-pages')).toHaveText('1 / 5쪽');
    await expect(page.locator('#rd-result-boxes')).toHaveText('1개');

    const { buffer, name } = await captureDownload(page, () => page.click('#rd-download'));
    expect(name).toBe('pages-redacted.pdf');
    const output = await PDFDocument.load(buffer);
    expect(output.getPageCount()).toBe(5);

    const texts = await extractPdfText(buffer);
    expect(texts[0]).not.toContain('PAGE A');
    expect(texts[1]).toContain('PAGE B');
    expect(texts[4]).toContain('PAGE E');
    expect(await countPageImages(buffer, 1)).toBe(1);
    expect(await countPageImages(buffer, 2)).toBe(0);
    expect(buffer.byteLength).toBeGreaterThan(3000);
  });

  test('상자 취소와 페이지 비우기를 지원한다', async ({ page }) => {
    await page.goto('/tools/pdf-redact/');
    await page.setInputFiles('#rd-input', fixture('pages.pdf'));
    await expect(page.locator('#rd-panel')).toBeVisible({ timeout: 20_000 });

    await dragBox(page, [0.1, 0.1], [0.4, 0.3]);
    await expect(page.locator('#rd-preview-label')).toContainText('가리기 1개');
    await page.click('#rd-undo');
    await expect(page.locator('#rd-preview-label')).toContainText('가리기 0개');

    await dragBox(page, [0.1, 0.1], [0.4, 0.3]);
    await page.click('#rd-clear-page');
    await expect(page.locator('#rd-preview-label')).toContainText('가리기 0개');
  });

  test('여러 페이지를 가리면 각 페이지가 이미지가 된다', async ({ page }) => {
    await page.goto('/tools/pdf-redact/');
    await page.setInputFiles('#rd-input', fixture('pages.pdf'));
    await expect(page.locator('#rd-panel')).toBeVisible({ timeout: 20_000 });

    await dragBox(page, [0.1, 0.1], [0.5, 0.3]);
    await page.click('#rd-next');
    await expect(page.locator('#rd-preview-label')).toContainText('2 / 5쪽');
    await dragBox(page, [0.1, 0.1], [0.5, 0.3]);

    await page.click('#rd-apply');
    await expect(page.locator('#rd-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#rd-result-pages')).toHaveText('2 / 5쪽');
    const { buffer } = await captureDownload(page, () => page.click('#rd-download'));
    expect(await countPageImages(buffer, 1)).toBe(1);
    expect(await countPageImages(buffer, 2)).toBe(1);
    expect(await countPageImages(buffer, 3)).toBe(0);
    const texts = await extractPdfText(buffer);
    expect(texts[0]).not.toContain('PAGE A');
    expect(texts[1]).not.toContain('PAGE B');
    expect(texts[2]).toContain('PAGE C');
  });

  test('영역 없이 저장하면 막는다', async ({ page }) => {
    await page.goto('/tools/pdf-redact/');
    await page.setInputFiles('#rd-input', fixture('pages.pdf'));
    await expect(page.locator('#rd-panel')).toBeVisible({ timeout: 20_000 });
    await page.click('#rd-apply');
    await expect(page.locator('#rd-error')).toContainText('하나 이상');
  });
});
