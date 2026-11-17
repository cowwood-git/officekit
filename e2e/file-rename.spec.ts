import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { captureDownload } from './fixtures';

const files = [
  { name: 'IMG_0001.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('a') },
  { name: 'IMG_0002.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('b') },
  { name: '회의 기록.pdf', mimeType: 'application/pdf', buffer: Buffer.from('c') },
];

test.describe('파일 이름 일괄 변경', () => {
  test('파일을 넣으면 방식별 결과를 바로 보여 준다', async ({ page }) => {
    await page.goto('/tools/file-rename/');
    await page.locator('#fr-input').setInputFiles(files);
    await expect(page.locator('#fr-panel')).toBeVisible();
    await expect(page.locator('#fr-example-before')).toHaveText('IMG_0001.jpg');

    await page.getByRole('button', { name: 'IMG_ 지우기' }).click();
    await expect(page.locator('#fr-example-after')).toHaveText('0001.jpg');
    await expect(page.locator('#fr-example-note')).toContainText('3개 중 2개');

    await page.locator('.fr-mode', { hasText: '앞·뒤에 붙이기' }).click();
    await page.locator('#fr-affix-text').fill('2026_');
    await expect(page.locator('#fr-example-after')).toHaveText('2026_IMG_0001.jpg');
    await page.locator('#fr-affix-position').selectOption('after');
    await page.locator('#fr-affix-text').fill('_최종');
    await expect(page.locator('#fr-example-after')).toHaveText('IMG_0001_최종.jpg');

    await page.locator('.fr-mode', { hasText: '순번 붙이기' }).click();
    await page.locator('#fr-number-base').fill('여행');
    await expect(page.locator('#fr-example-after')).toHaveText('여행_01.jpg');
    await page.locator('#fr-number-base').fill('');
    await expect(page.locator('#fr-example-after')).toHaveText('IMG_0001_01.jpg');

    await page.locator('.fr-mode', { hasText: '직접 만들기' }).click();
    await page.locator('#fr-template').fill('{date}_{name}');
    await expect(page.locator('#fr-example-after')).toHaveText(/^\d{8}_IMG_0001\.jpg$/);
  });

  test('바뀐 이름으로 ZIP을 만들어 내려받는다', async ({ page }) => {
    await page.goto('/tools/file-rename/');
    await page.locator('#fr-input').setInputFiles(files);
    await page.getByRole('button', { name: 'IMG_ 지우기' }).click();

    await page.getByRole('button', { name: '새 이름으로 ZIP 만들기' }).click();
    await expect(page.locator('#fr-result')).toBeVisible();
    const file = await captureDownload(page, () =>
      page.getByRole('link', { name: /ZIP 내려받기/ }).click(),
    );
    expect(file.name).toMatch(/^renamed-\d{8}\.zip$/);
    const zip = await JSZip.loadAsync(file.buffer);
    expect(Object.keys(zip.files).sort()).toEqual(['0001.jpg', '0002.jpg', '회의 기록.pdf'].sort());
    await expect(page.locator('#fr-result-note')).toContainText('3개 중 2개');
  });

  test('처음부터를 누르면 파일과 설정을 비운다', async ({ page }) => {
    await page.goto('/tools/file-rename/');
    await page.locator('#fr-input').setInputFiles(files);
    await page.getByRole('button', { name: '공백을 밑줄로' }).click();
    await expect(page.locator('#fr-example-after')).toHaveText('IMG_0001.jpg');

    await page.getByRole('button', { name: '처음부터' }).click();
    await expect(page.locator('#fr-panel')).toBeHidden();
    await expect(page.locator('#fr-drop')).toBeVisible();
    await expect(page.locator('#fr-find')).toHaveValue('');
  });
});
