import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { fixture } from './fixtures';

// 공통 파일 흐름(src/scripts/file-flow.ts): 이어서 하기 · 잘못 넣은 파일 안내 · 붙여넣기

async function pasteFile(page: Page, path: string, name: string, type: string) {
  const bytes = Array.from(readFileSync(path));
  await page.evaluate(
    ({ bytes, name, type }) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([new Uint8Array(bytes)], name, { type }));
      document.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true }),
      );
    },
    { bytes, name, type },
  );
}

test.describe('공통 파일 흐름', () => {
  test('이어서 하기: 합친 PDF를 다시 고르지 않고 PDF 압축으로 넘긴다', async ({ page }) => {
    await page.goto('/tools/pdf-merge/');
    await page.setInputFiles('#pdf-input', [fixture('merge-a.pdf'), fixture('merge-b.pdf')]);
    await page.click('#pdf-merge');
    await expect(page.locator('#pdf-download')).toBeVisible();

    const next = page.locator('[data-flow-next]');
    await expect(next).toBeVisible();
    await expect(next.locator('a')).toHaveCount(3);
    await expect(next).not.toContainText('PDF 합치기');

    await next.getByRole('link', { name: /PDF 압축/ }).click();
    await expect(page).toHaveURL(/\/tools\/pdf-compress\/$/);
    await expect(page.locator('#pc-file-info')).toContainText('5쪽');
    await expect(page.locator('[data-flow-notice]')).toContainText('이어서 불러왔어요');
  });

  test('잘못 넣은 파일: 한글 문서를 PDF 도구에 넣으면 PDF로 바꾸는 도구를 안내한다', async ({
    page,
  }) => {
    await page.goto('/tools/pdf-merge/');
    await page.setInputFiles('#pdf-input', 'e2e/samples/sample.hwp');
    const notice = page.locator('[data-flow-notice]');
    await expect(notice).toContainText('한글 문서');
    const link = notice.getByRole('link', { name: /HWP·HWPX → PDF/ });
    await expect(link).toHaveAttribute('href', '/tools/hwpx-to-pdf/');

    await link.click();
    await expect(page).toHaveURL(/\/tools\/hwpx-to-pdf\/$/);
    await expect(page.locator('[data-flow-notice]')).toContainText('sample.hwp');
  });

  test('붙여넣기: 복사한 PDF를 Ctrl+V로 넣는다', async ({ page }) => {
    await page.goto('/tools/pdf-merge/');
    await pasteFile(page, fixture('merge-a.pdf'), 'merge-a.pdf', 'application/pdf');
    await expect(page.locator('#pdf-summary')).toContainText('1개 파일');
  });

  test('붙여넣기 안내는 이미지를 받는 드롭존에만 붙는다', async ({ page }) => {
    await page.goto('/tools/image-compress/');
    await expect(page.locator('.dropzone-paste')).toContainText('붙여넣을 수 있어요');
    await page.goto('/tools/pdf-merge/');
    await expect(page.locator('.dropzone-paste')).toHaveCount(0);
  });

  test('암호를 건 PDF 결과에는 이어서 하기가 없다', async ({ page }) => {
    await page.goto('/tools/pdf-protect/');
    await expect(page.locator('[data-flow-next]')).toHaveCount(0);
  });
});
