import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.describe('휴가신청서 양식', () => {
  test('예시를 채우면 계산값과 미리보기가 바로 바뀐다', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/forms/leave-request/');
    await expect(page.getByRole('heading', { name: '휴가신청서 양식' })).toBeVisible();

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-field="name"]')).toHaveValue('김옷깃');
    await expect(page.locator('[data-computed="days"]')).toHaveText('2일');
    await expect(page.locator('[data-computed="period"]')).toContainText(
      '2026. 11. 17. ~ 2026. 11. 18.',
    );

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('휴가신청서');
    await expect(preview).toContainText('김옷깃');
    await expect(preview).toContainText('신청인');
    expect(errors).toEqual([]);
  });

  test('PDF를 내려받으면 A4 한 장짜리 파일이 만들어진다', async ({ page }) => {
    await page.goto('/forms/leave-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('휴가신청서');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (!path) return;
    const bytes = await readFile(path);
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('빈 양식으로 바꾸면 값은 지우고 라벨과 서명란만 남긴다', async ({ page }) => {
    await page.goto('/forms/leave-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.getByRole('button', { name: '빈 양식' }).click();

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('성명');
    await expect(preview).toContainText('(서명)');
    await expect(preview).not.toContainText('김옷깃');
    await expect(page.getByRole('button', { name: '빈 양식 PDF' })).toBeVisible();
  });

  test('입력값은 이 브라우저에 저장되고 새로고침해도 남는다', async ({ page }) => {
    await page.goto('/forms/leave-request/');
    await page.fill('[data-field="name"]', '이옷깃');
    await expect(page.locator('[data-save-note]')).toContainText('저장됨');

    await page.reload();
    await expect(page.locator('[data-field="name"]')).toHaveValue('이옷깃');
    await expect(page.locator('[data-save-note]')).toContainText('불러왔습니다');
  });

  test('작성일을 바꾸면 문서 번호가 따라 바뀌고, 직접 고치면 유지된다', async ({ page }) => {
    await page.goto('/forms/leave-request/');
    await page.fill('[data-field="date"]', '2026-12-01');
    await expect(page.locator('[data-field="docNo"]')).toHaveValue('LV-20261201-001');

    await page.fill('[data-field="docNo"]', 'LV-CUSTOM-01');
    await page.fill('[data-field="date"]', '2026-12-02');
    await expect(page.locator('[data-field="docNo"]')).toHaveValue('LV-CUSTOM-01');
  });

  test('결재선 이름을 직접 고치고 개수를 1~5개로 바꾼다', async ({ page }) => {
    await page.goto('/forms/leave-request/');
    const rows = page.locator('[data-role-row]');
    await expect(rows).toHaveCount(5);

    await rows.nth(2).locator('[data-role-label]').fill('본부장');
    await rows.nth(1).locator('[data-role-enabled]').check();

    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview).toContainText('본부장');
    await expect(preview).toContainText('팀장');
    const four = await preview.evaluate(
      (element) => (element.textContent?.match(/\(서명\)/g) ?? []).length,
    );
    expect(four).toBe(4);

    for (let index = 0; index < 5; index += 1) {
      await rows.nth(index).locator('[data-role-enabled]').check();
    }
    await expect
      .poll(async () =>
        preview.evaluate((element) => (element.textContent?.match(/\(서명\)/g) ?? []).length),
      )
      .toBe(5);
  });

  test('입력한 내용이 있으면 예시 채우기 전에 확인한다', async ({ page }) => {
    await page.goto('/forms/leave-request/');
    await page.fill('[data-field="name"]', '이옷깃');

    await page.getByRole('button', { name: '예시 채우기' }).click();
    const dialog = page.locator('[data-confirm-dialog]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('지금 입력한 내용이 예시로 바뀝니다');

    await page.getByRole('button', { name: '취소' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-field="name"]')).toHaveValue('이옷깃');

    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.getByRole('button', { name: '계속' }).click();
    await expect(page.locator('[data-field="name"]')).toHaveValue('김옷깃');
  });

  test('입력한 내용이 있으면 초기화 전에 확인한다', async ({ page }) => {
    await page.goto('/forms/leave-request/');
    await page.fill('[data-field="name"]', '이옷깃');

    await page.getByRole('button', { name: '초기화' }).click();
    const dialog = page.locator('[data-confirm-dialog]');
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: '취소' }).click();
    await expect(page.locator('[data-field="name"]')).toHaveValue('이옷깃');

    await page.getByRole('button', { name: '초기화' }).click();
    await page.getByRole('button', { name: '계속' }).click();
    await expect(page.locator('[data-field="name"]')).toHaveValue('');
  });

  test('필수 항목이 비어 있으면 PDF를 만들지 않고 알려 준다', async ({ page }) => {
    await page.goto('/forms/leave-request/');
    await page.fill('[data-field="name"]', '');
    await page.fill('[data-field="date"]', '');
    await page.fill('[data-field="from"]', '');
    await page.fill('[data-field="to"]', '');
    await page.selectOption('[data-field="kind"]', '');
    await page.fill('[data-field="reason"]', '');

    await page.getByRole('button', { name: 'PDF 만들기' }).click();
    const error = page.locator('[data-form-error]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('성명');
  });
});

test.describe('휴가신청서 양식 · 모바일', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('PDF 버튼이 화면 아래에 고정되어 스크롤해도 보인다', async ({ page }) => {
    await page.goto('/forms/leave-request/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const toolbar = page.locator('.form-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(page.getByRole('button', { name: 'PDF 만들기' })).toBeVisible();
    await expect(toolbar).toHaveCSS('position', 'fixed');
  });
});
