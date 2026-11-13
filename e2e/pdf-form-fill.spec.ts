import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { captureDownload, fixture } from './fixtures';

test.describe('PDF 양식 채우기', () => {
  test('텍스트·체크박스·라디오·드롭다운·목록을 채운다', async ({ page }) => {
    await page.goto('/tools/pdf-form-fill/');
    await page.setInputFiles('#pf-input', fixture('form.pdf'));
    await expect(page.locator('#pf-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#pf-field-count')).toContainText('7 / 7개 필드');

    await page.fill('#pf-field-0', '김오피스');
    await page.fill('#pf-field-1', '개발팀');
    await page.check('#pf-field-2');
    await page.selectOption('#pf-field-3', 'male');
    await page.selectOption('#pf-field-4', 'dev');
    await page.selectOption('#pf-field-5', ['design', 'data']);
    await page.fill('#pf-field-6', '첫째 줄\n둘째 줄');

    await page.click('#pf-apply');
    await expect(page.locator('#pf-result')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#pf-result-pages')).toHaveText('1쪽');

    const { buffer, name } = await captureDownload(page, () => page.click('#pf-download'));
    expect(name).toBe('form-filled.pdf');
    const output = await PDFDocument.load(buffer);
    const form = output.getForm();
    expect(form.getTextField('name').getText()).toBe('김오피스');
    expect(form.getTextField('department').getText()).toBe('개발팀');
    expect(form.getCheckBox('agree').isChecked()).toBe(true);
    expect(form.getRadioGroup('gender').getSelected()).toBe('male');
    expect(form.getDropdown('team').getSelected()).toEqual(['dev']);
    expect(form.getOptionList('interests').getSelected()).toEqual(['design', 'data']);
    expect(form.getTextField('memo').getText()).toBe('첫째 줄\n둘째 줄');
  });

  test('양식 평탄화를 적용하면 필드가 사라진다', async ({ page }) => {
    await page.goto('/tools/pdf-form-fill/');
    await page.setInputFiles('#pf-input', fixture('form.pdf'));
    await expect(page.locator('#pf-panel')).toBeVisible({ timeout: 20_000 });

    await page.fill('#pf-field-0', 'Flat User');
    await page.check('#pf-flatten');
    await page.click('#pf-apply');
    await expect(page.locator('#pf-result')).toBeVisible({ timeout: 30_000 });

    const { buffer } = await captureDownload(page, () => page.click('#pf-download'));
    const output = await PDFDocument.load(buffer);
    expect(output.getForm().getFields()).toHaveLength(0);
  });

  test('필드 검색으로 목록을 줄인다', async ({ page }) => {
    await page.goto('/tools/pdf-form-fill/');
    await page.setInputFiles('#pf-input', fixture('form.pdf'));
    await expect(page.locator('#pf-panel')).toBeVisible({ timeout: 20_000 });

    await page.fill('#pf-filter', 'memo');
    await expect(page.locator('#pf-field-count')).toContainText('1 / 7개 필드');
    await expect(page.locator('#pf-fields')).toContainText('memo');
    await expect(page.locator('#pf-fields')).not.toContainText('department');
  });
});
