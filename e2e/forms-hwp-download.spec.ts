import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { captureDownload } from './fixtures';

test.describe('양식 한글 파일 내려받기', () => {
  test('PDF 배치를 옮긴 HWPX·HWP 파일을 만든다', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/forms/leave-request/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await expect(page.locator('[data-preview-stage] svg')).toContainText('휴가신청서');

    await page.locator('summary', { hasText: '한글 파일' }).click();
    await expect(page.getByRole('menu', { name: '한글 파일 형식' })).toBeVisible();

    const hwpx = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(hwpx.name).toBe('2026-11-14_휴가신청서_김옷깃.hwpx');
    expect(hwpx.buffer.subarray(0, 2).toString('latin1')).toBe('PK');

    const zip = await JSZip.loadAsync(hwpx.buffer);
    await expect(zip.file('mimetype')?.async('string')).resolves.toBe('application/hwp+zip');
    const section = await zip.file('Contents/section0.xml')?.async('string');
    expect(section).toContain('휴가신청서');
    expect(section).toContain('김옷깃');
    expect(section).toContain('2026. 11. 17.');
    // 입력 상자·서명란은 실제 표, 글자는 실제 텍스트여야 한다(그림 개체 금지).
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('<hp:t>');
    expect(section).not.toContain('<hp:pic ');
    // PDF를 거치지 않으므로 1.5MB PDF가 아니라 수 KB대다.
    expect(hwpx.buffer.byteLength).toBeLessThan(80_000);
    await expect(page.locator('[data-form-status]')).toContainText('HWPX 파일을 내려받았습니다');

    await page.locator('summary', { hasText: '한글 파일' }).click();
    const hwp = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWP로 저장/ }).click(),
    );
    expect(hwp.name).toBe('2026-11-14_휴가신청서_김옷깃.hwp');
    // HWP 5.0은 OLE 복합 파일이다.
    expect(hwp.buffer.subarray(0, 4).toString('hex')).toBe('d0cf11e0');
    expect(hwp.buffer.byteLength).toBeGreaterThan(2000);
    await expect(page.locator('[data-form-status]')).toContainText('HWP 파일을 내려받았습니다');
  });

  test('빈 양식도 한글 파일로 만들 수 있다', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/forms/travel-expense/');
    await page.getByRole('button', { name: '빈 양식' }).click();
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWP로 저장/ }).click(),
    );
    expect(file.name).toContain('빈양식');
    expect(file.name.endsWith('.hwp')).toBe(true);
    expect(file.buffer.subarray(0, 4).toString('hex')).toBe('d0cf11e0');
  });
});
