import { expect, test } from '@playwright/test';

test.describe('문서번호 접두사', () => {
  test('추천 접두사를 바꾸면 문서번호와 저장값에 반영된다', async ({ page }) => {
    await page.goto('/forms/delivery-confirm/');
    const prefix = page.locator('[data-doc-prefix]');
    const docNo = page.locator('[data-field="docNo"]');

    await expect(prefix).toHaveValue('DV');
    await expect(docNo).toHaveValue(/^DV-\d{8}-001$/);

    await prefix.fill('인사');
    await expect(prefix).toHaveValue('인사');
    await expect(docNo).toHaveValue(/^인사-\d{8}-001$/);

    await page.reload();
    await expect(prefix).toHaveValue('인사');
    await expect(docNo).toHaveValue(/^인사-\d{8}-001$/);
  });

  test('날짜를 바꾸면 접두사는 유지하고 날짜만 갱신한다', async ({ page }) => {
    await page.goto('/forms/delivery-confirm/');
    const prefix = page.locator('[data-doc-prefix]');
    await prefix.fill('HR');
    await page.locator('[data-field="date"]').fill('2026-12-01');
    await expect(page.locator('[data-field="docNo"]')).toHaveValue('HR-20261201-001');
  });

  test('직접 고친 문서번호는 접두사 변경으로 덮어쓰지 않는다', async ({ page }) => {
    await page.goto('/forms/delivery-confirm/');
    const docNo = page.locator('[data-field="docNo"]');
    await docNo.fill('CUSTOM-001');
    await page.locator('[data-doc-prefix]').fill('ZZ');
    await expect(docNo).toHaveValue('CUSTOM-001');
  });

  test('접두사를 비우면 추천값으로 돌아온다', async ({ page }) => {
    await page.goto('/forms/delivery-confirm/');
    const prefix = page.locator('[data-doc-prefix]');
    await prefix.fill('인사');
    await prefix.fill('');
    await prefix.blur();
    await expect(prefix).toHaveValue('DV');
    await expect(page.locator('[data-field="docNo"]')).toHaveValue(/^DV-\d{8}-001$/);
  });

  test('한글 IME 조합 중에도 접두사가 지워지지 않는다', async ({ page }) => {
    await page.goto('/forms/delivery-confirm/');
    const prefix = page.locator('[data-doc-prefix]');
    const docNo = page.locator('[data-field="docNo"]');

    await prefix.evaluate((el) => {
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      (el as HTMLInputElement).value = '인';
      el.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          data: '인',
          inputType: 'insertCompositionText',
          isComposing: true,
        }),
      );
    });
    await expect(prefix).toHaveValue('인');

    await prefix.evaluate((el) => {
      (el as HTMLInputElement).value = '인사';
      el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '인사' }));
    });
    await expect(prefix).toHaveValue('인사');
    await expect(docNo).toHaveValue(/^인사-\d{8}-001$/);
  });

  test('기존 자동 번호는 접두사만 바꾸고 날짜·일련번호는 유지한다', async ({ page }) => {
    await page.goto('/forms/leave-request/');
    const prefix = page.locator('[data-doc-prefix]');
    const docNo = page.locator('[data-field="docNo"]');

    await docNo.fill('LP-20261114-001');
    await prefix.fill('한글이야정');
    await expect(docNo).toHaveValue('한글이야정-20261114-001');
  });

  test('저장된 접두사와 기존 번호를 불러오면 접두사를 맞춘다', async ({ page }) => {
    await page.goto('/forms/leave-request/');
    const prefix = page.locator('[data-doc-prefix]');
    const docNo = page.locator('[data-field="docNo"]');

    await prefix.fill('한글이야정');
    await docNo.fill('L-20261114-001');
    await page.waitForTimeout(900);
    await page.reload();
    await expect(prefix).toHaveValue('한글이야정');
    await expect(docNo).toHaveValue('한글이야정-20261114-001');
  });
});
