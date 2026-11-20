import { expect, test } from '@playwright/test';

test.describe('문서번호 표시 끄기', () => {
  test('체크를 끄면 미리보기에서 문서번호가 빠지고 다음 방문에도 기억한다', async ({ page }) => {
    await page.goto('/forms/expense-report/');
    await page.getByRole('button', { name: '예시 채우기' }).click();

    const preview = page.locator('[data-preview-stage] svg');
    const docNo = await page.locator('[data-field="docNo"]').inputValue();
    await expect(preview).toContainText(docNo);

    const toggle = page.getByRole('checkbox', { name: '문서에 표시' });
    await expect(toggle).toBeChecked();
    await toggle.uncheck();
    await expect(preview).not.toContainText(docNo);
    await expect(preview).toContainText('지출결의서');

    await page.goto('/forms/approval-request/');
    await expect(page.getByRole('checkbox', { name: '문서에 표시' })).not.toBeChecked();

    await page.getByRole('checkbox', { name: '문서에 표시' }).check();
    await page.goto('/forms/expense-report/');
    await expect(page.getByRole('checkbox', { name: '문서에 표시' })).toBeChecked();
  });
});
