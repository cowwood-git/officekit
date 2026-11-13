import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { captureDownload, fixture } from './fixtures';

test.describe('표·문서·텍스트 도구', () => {
  test('CSV·XLSX 뷰어: 시트 전환과 페이지 이동', async ({ page }) => {
    await page.goto('/tools/sheet-viewer/');
    await page.setInputFiles('#sv-input', fixture('sample.xlsx'));
    await expect(page.locator('#sv-file-info')).toContainText('시트 2개');
    await expect(page.locator('#sv-table tbody tr')).toHaveCount(50);
    await expect(page.locator('#sv-page-info')).toContainText('1–50 / 120행');

    await page.click('#sv-next');
    await expect(page.locator('#sv-page-info')).toContainText('51–100 / 120행');

    await page.getByRole('tab', { name: '요약' }).click();
    await expect(page.locator('#sv-table tbody tr')).toHaveCount(2);
    await expect(page.locator('#sv-table tbody')).toContainText('김오피스');
  });

  test('CSV ↔ JSON: 양방향 변환', async ({ page }) => {
    await page.goto('/tools/csv-json/');
    await page.fill('#cj-source', '이름,부서\n김오피스,개발');
    await page.click('#cj-convert');
    await expect(page.locator('#cj-output')).toHaveValue(/"이름": "김오피스"/);

    await page.click('button[data-mode="json2csv"]');
    await page.fill('#cj-source', '[{"name":"김오피스","dept":"개발"}]');
    await page.click('#cj-convert');
    await expect(page.locator('#cj-output')).toHaveValue(/name,dept/);
    await expect(page.locator('#cj-meta')).toContainText('1행 · 2열');
  });

  test('DOCX 뷰어: 제목·표 렌더링', async ({ page }) => {
    await page.goto('/tools/docx-viewer/');
    await page.setInputFiles('#docx-input', fixture('sample.docx'));
    await expect(page.locator('#docx-content h1')).toHaveText('계약서 개요');
    await expect(page.locator('#docx-content strong')).toHaveText('오피스킷');
    await expect(page.locator('#docx-content table tr')).toHaveCount(2);
    await expect(page.locator('#docx-meta')).toContainText('단어');
  });

  test('글자수 세기와 QR 생성', async ({ page }) => {
    await page.goto('/tools/text-counter/');
    await page.fill('#text-input', '가나 다');
    await expect(page.locator('[data-stat="chars"]')).toHaveText('4');
    await expect(page.locator('[data-stat="words"]')).toHaveText('2');

    await page.goto('/tools/qr-generate/');
    await page.fill('#qr-text', 'https://officekit.kr');
    await expect(page.locator('#qr-canvas')).toBeVisible();
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement | null;
          return canvas?.toDataURL().startsWith('data:image/png') ?? false;
        }),
      )
      .toBe(true);

    const { buffer } = await captureDownload(page, () => page.click('#qr-download-png'));
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(512);
  });
});
