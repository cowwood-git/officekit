import { expect, test } from '@playwright/test';

test.describe('회사 정보 프리셋', () => {
  test('견적서에서 회사 정보를 저장하고 불러온다', async ({ page }) => {
    await page.goto('/forms/quote/');
    const preset = page.locator('[data-company-preset]');
    await expect(preset).toBeVisible();

    await page.fill('[data-field="supplierCompany"]', '내회사');
    await page.fill('[data-field="supplierBiz"]', '123-45-67891');
    await page.fill('[data-field="supplierCeo"]', '홍길동');
    await page.fill('[data-field="supplierAddress"]', '서울시 강남구 1');
    await page.fill('[data-field="supplierContact"]', '010-1234-5678');
    await page.getByRole('button', { name: '현재 정보 저장' }).click();
    await expect(page.locator('[data-company-status]')).toContainText('저장됨: 내회사');

    await page.fill('[data-field="supplierCompany"]', '다른회사');
    await page.getByRole('button', { name: '불러오기' }).click();
    await expect(page.locator('[data-field="supplierCompany"]')).toHaveValue('내회사');
    await expect(page.locator('[data-field="supplierBiz"]')).toHaveValue('123-45-67891');
    await expect(page.locator('[data-company-status]')).toContainText('불러옴: 내회사');
  });

  test('저장된 회사 정보는 새로고침해도 남고 지울 수 있다', async ({ page }) => {
    await page.goto('/forms/quote/');
    await page.fill('[data-field="supplierCompany"]', '저장회사');
    await page.getByRole('button', { name: '현재 정보 저장' }).click();
    await expect(page.locator('[data-company-status]')).toContainText('저장됨: 저장회사');

    await page.reload();
    await expect(page.locator('[data-company-status]')).toContainText('저장됨: 저장회사');

    await page.getByRole('button', { name: '지우기' }).click();
    await expect(page.locator('[data-confirm-dialog]')).toBeVisible();
    await page.getByRole('button', { name: '계속' }).click();
    await expect(page.locator('[data-company-status]')).toContainText('지웠습니다');

    await page.reload();
    await expect(page.locator('[data-company-status]')).not.toContainText('저장됨');
  });

  test('발주서는 발주자 정보에 프리셋을 적용한다', async ({ page }) => {
    await page.goto('/forms/purchase-order/');
    await page.fill('[data-field="buyerCompany"]', '발주회사');
    await page.fill('[data-field="buyerBiz"]', '220-81-62517');
    await page.getByRole('button', { name: '현재 정보 저장' }).click();
    await expect(page.locator('[data-company-status]')).toContainText('저장됨: 발주회사');

    await page.fill('[data-field="buyerCompany"]', '다른회사');
    await page.getByRole('button', { name: '불러오기' }).click();
    await expect(page.locator('[data-field="buyerCompany"]')).toHaveValue('발주회사');
    await expect(page.locator('[data-field="buyerBiz"]')).toHaveValue('220-81-62517');
  });

  test('재직증명서는 발급 회사 정보에 프리셋을 적용한다', async ({ page }) => {
    await page.goto('/forms/employment-certificate/');
    await page.fill('[data-field="issuerCompany"]', '증명회사');
    await page.fill('[data-field="issuerBiz"]', '123-45-67891');
    await page.fill('[data-field="issuerCeo"]', '박대표');
    await page.getByRole('button', { name: '현재 정보 저장' }).click();
    await expect(page.locator('[data-company-status]')).toContainText('저장됨: 증명회사');

    await page.fill('[data-field="issuerCompany"]', '다른회사');
    await page.getByRole('button', { name: '불러오기' }).click();
    await expect(page.locator('[data-field="issuerCompany"]')).toHaveValue('증명회사');
    await expect(page.locator('[data-field="issuerBiz"]')).toHaveValue('123-45-67891');
  });
});
