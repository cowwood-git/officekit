import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { fixture } from './fixtures';

const SAMPLES = join(process.cwd(), 'e2e', 'samples');

test.describe('HWPX 뷰어', () => {
  test('본문 문단과 표를 표시한다', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/tools/hwpx-viewer/');
    await page.setInputFiles('#hv-input', join(SAMPLES, 'memo.hwpx'));
    await expect(page.locator('#hv-panel')).toBeVisible();
    await expect(page.locator('#hv-stat-total')).toHaveText('1');
    await expect(page.locator('#hv-stat-format')).toHaveText('HWPX');
    await expect(page.locator('#hv-content .hwp-svg-page svg')).toHaveCount(1);
    await expect(page.locator('#hv-page-label')).toHaveText('1 / 1');
    expect(errors).toEqual([]);
  });

  test('병합된 셀이 있는 표를 그린다', async ({ page }) => {
    await page.goto('/tools/hwpx-viewer/');
    await page.setInputFiles('#hv-input', join(SAMPLES, 'tables.hwpx'));
    await expect(page.locator('#hv-panel')).toBeVisible();
    await expect(page.locator('#hv-content .hwp-svg-page svg')).toHaveCount(1);
    await expect(page.locator('#hv-stat-total')).toHaveText('2');
    await expect(page.locator('#hv-page-label')).toHaveText('1 / 2');
    await page.click('#hv-next');
    await expect(page.locator('#hv-page-label')).toHaveText('2 / 2');
  });

  test('페이지 나누기를 쪽 카드로 표시한다', async ({ page }) => {
    await page.goto('/tools/hwpx-viewer/');
    await page.setInputFiles('#hv-input', join(SAMPLES, 'pages.hwpx'));
    await expect(page.locator('#hv-panel')).toBeVisible();
    await expect(page.locator('#hv-stat-total')).toHaveText('6');
    await expect(page.locator('#hv-page-label')).toHaveText('1 / 6');
    await expect(page.locator('#hv-content .hwp-svg-page:visible')).toHaveCount(1);
    await page.click('#hv-next');
    await expect(page.locator('#hv-page-label')).toHaveText('2 / 6');
    await page.selectOption('#hv-layout', 'spread');
    await expect(page.locator('#hv-page-label')).toHaveText('1–2 / 6');
    await expect(page.locator('#hv-content .hwp-svg-page:visible')).toHaveCount(2);
  });

  test('HWP를 HWPX로 자동 변환해 표시한다', async ({ page }) => {
    await page.goto('/tools/hwpx-viewer/');
    await page.setInputFiles('#hv-input', join(SAMPLES, 'sample.hwp'));
    await expect(page.locator('#hv-panel')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#hv-file-info')).toContainText('HWP → HWPX');
    await expect(page.locator('#hv-stat-total')).toHaveText('1');
    await expect(page.locator('#hv-content .hwp-svg-page svg')).toHaveCount(1);
    const download = page.locator('#hv-hwpx-download');
    await expect(download).toBeVisible();
    await expect(download).toHaveAttribute('download', 'sample.hwpx');
  });

  test('한글 문서가 아닌 파일은 안내한다', async ({ page }) => {
    await page.goto('/tools/hwpx-viewer/');
    await page.setInputFiles('#hv-input', {
      name: '문서.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('not a hwpx'),
    });
    await expect(page.locator('#hv-error')).toContainText('HWP·HWPX 파일만');
  });
});

test.describe('DOC·DOCX 뷰어', () => {
  test('구형 .doc을 텍스트·표로 표시한다', async ({ page }) => {
    await page.goto('/tools/docx-viewer/');
    await page.setInputFiles('#docx-input', join(SAMPLES, 'table.doc'));
    await expect(page.locator('#docx-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#docx-content')).toContainText('C11');
    await expect(page.locator('#docx-content table')).toBeVisible();
    await expect(page.locator('#docx-file-info')).toContainText('구형 DOC');
    await expect(page.locator('#docx-warnings')).toBeVisible();
  });

  test('긴 DOC을 A4 페이지로 나눠 넘긴다', async ({ page }) => {
    await page.goto('/tools/docx-viewer/');
    await page.setInputFiles('#docx-input', join(SAMPLES, 'long.doc'));
    await expect(page.locator('#docx-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#docx-page-label')).toHaveText('1 / 6');
    await expect(page.locator('.docx-page:visible')).toHaveCount(1);
    await page.click('#docx-next');
    await expect(page.locator('#docx-page-label')).toHaveText('2 / 6');
    await page.selectOption('#docx-layout', 'spread');
    await expect(page.locator('#docx-page-label')).toHaveText('1–2 / 6');
    await expect(page.locator('.docx-page:visible')).toHaveCount(2);
  });
});

test.describe('PPTX 뷰어', () => {
  test('슬라이드를 읽고 이동한다', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/tools/pptx-viewer/');
    await page.setInputFiles('#pv-input', join(SAMPLES, 'sample.pptx'));
    await expect(page.locator('#pv-panel')).toBeVisible();
    await expect(page.locator('#pv-slide-count')).toHaveText('5');
    await expect(page.locator('#pv-page')).toHaveText('1 / 5');
    await expect(page.locator('#pv-viewer')).toContainText('Q3 Business Review');

    await page.click('#pv-next');
    await expect(page.locator('#pv-page')).toHaveText('2 / 5');
    await expect(page.locator('#pv-viewer')).toContainText('Agenda');

    await page.selectOption('#pv-zoom', '150');
    await expect(page.locator('#pv-page')).toHaveText('2 / 5');
    expect(errors).toEqual([]);
  });

  test('두 장 보기로 슬라이드를 나란히 본다', async ({ page }) => {
    await page.goto('/tools/pptx-viewer/');
    await page.setInputFiles('#pv-input', join(SAMPLES, 'sample.pptx'));
    await expect(page.locator('#pv-panel')).toBeVisible();
    await page.selectOption('#pv-layout', 'spread');
    await expect(page.locator('#pv-page')).toHaveText('1–2 / 5');
    await expect(page.locator('#pv-spread .pv-spread-cell')).toHaveCount(2);
    await expect(page.locator('#pv-spread')).toBeVisible();
    await page.click('#pv-next');
    await expect(page.locator('#pv-page')).toHaveText('3–4 / 5');
  });

  test('구형 .ppt를 SVG로 표시한다', async ({ page }) => {
    await page.goto('/tools/pptx-viewer/');
    await page.setInputFiles('#pv-input', join(SAMPLES, 'legacy.ppt'));
    await expect(page.locator('#pv-panel')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#pv-slide-count')).toHaveText('2');
    await expect(page.locator('#pv-page')).toHaveText('1 / 2');
    await expect(page.locator('#pv-viewer .pv-svg-slide svg')).toHaveCount(2);
    await expect(page.locator('#pv-viewer .pv-svg-slide:visible')).toHaveCount(1);
    await expect(page.locator('#pv-viewer')).toContainText('Legacy PPT title');
    await page.click('#pv-next');
    await expect(page.locator('#pv-page')).toHaveText('2 / 2');
    await expect(page.locator('#pv-viewer')).toContainText('Second legacy slide');
    await page.selectOption('#pv-layout', 'spread');
    await expect(page.locator('#pv-page')).toHaveText('1–2 / 2');
    await expect(page.locator('#pv-viewer .pv-svg-slide:visible')).toHaveCount(2);
  });

  test('PPTX가 아닌 파일은 안내한다', async ({ page }) => {
    await page.goto('/tools/pptx-viewer/');
    await page.setInputFiles('#pv-input', {
      name: '발표.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('not a pptx'),
    });
    await expect(page.locator('#pv-error')).toContainText('PPT·PPTX 파일만');
  });
});

test.describe('PDF 뷰어', () => {
  test('한 쪽씩 보여 주고 넘긴다', async ({ page }) => {
    await page.goto('/tools/pdf-viewer/');
    await page.setInputFiles('#pv-input', fixture('pages.pdf'));
    await expect(page.locator('#pv-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#pv-pages .pv-page:visible')).toHaveCount(1);
    await expect(page.locator('#pv-page')).toHaveValue('1');
    await page.click('#pv-next');
    await expect(page.locator('#pv-page')).toHaveValue('2');
    await expect(page.locator('#pv-pages .pv-page:visible')).toHaveCount(1);
    await page.click('#pv-prev');
    await expect(page.locator('#pv-page')).toHaveValue('1');
  });
});
