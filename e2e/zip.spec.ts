import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { captureDownload } from './fixtures';

test.describe('ZIP 열기·만들기', () => {
  test('파일을 ZIP으로 만들고 다시 읽는다', async ({ page }) => {
    await page.goto('/tools/zip/');
    await page.check('#zip-mode-create');
    await expect(page.locator('#zip-create-panel')).toBeVisible();
    await expect(page.locator('#zip-create')).toBeDisabled();

    await page.setInputFiles('#zip-create-input', [
      { name: 'hello.txt', mimeType: 'text/plain', buffer: Buffer.from('hello zip') },
      { name: 'note.md', mimeType: 'text/markdown', buffer: Buffer.from('# note') },
    ]);
    await expect(page.locator('#zip-create-note')).toContainText('2개');
    await expect(page.locator('#zip-create')).toBeEnabled();

    const { name, buffer } = await captureDownload(page, () => page.click('#zip-create'));
    expect(name).toMatch(/^압축-\d{8}\.zip$/);
    const zip = await JSZip.loadAsync(buffer);
    expect(Object.keys(zip.files).sort()).toEqual(['hello.txt', 'note.md']);
    expect(await zip.file('hello.txt')?.async('string')).toBe('hello zip');
  });

  test('ZIP을 열어 목록·미리보기·선택 추출을 한다', async ({ page }) => {
    const source = new JSZip();
    source.file('hello.txt', 'hello from zip');
    source.file('folder/note.md', '# note');
    const sourceBuffer = await source.generateAsync({ type: 'nodebuffer' });

    await page.goto('/tools/zip/');
    await page.setInputFiles('#zip-open-input', {
      name: 'sample.zip',
      mimeType: 'application/zip',
      buffer: sourceBuffer,
    });
    await expect(page.locator('#zip-open-info')).toBeVisible();
    await expect(page.locator('.zip-entry')).toHaveCount(2);
    await expect(page.locator('#zip-stat-files')).toHaveText('2개');

    const helloRow = page.locator('.zip-entry').filter({ hasText: 'hello.txt' });
    await helloRow.locator('.zip-entry-preview').click();
    await expect(page.locator('#zip-preview-body pre')).toContainText('hello from zip');

    await page.click('#zip-select-none');
    await expect(page.locator('#zip-extract')).toBeDisabled();
    await page.click('#zip-select-all');
    await expect(page.locator('#zip-extract')).toBeEnabled();

    const { name, buffer } = await captureDownload(page, () => page.click('#zip-extract'));
    expect(name).toMatch(/^sample-선택-\d{8}\.zip$/);
    const output = await JSZip.loadAsync(buffer);
    const outputNames = Object.keys(output.files)
      .filter((file) => !output.files[file]?.dir)
      .sort();
    expect(outputNames).toEqual(['folder/note.md', 'hello.txt']);
  });

  test('다른 ZIP을 누르면 처음 상태로 돌아간다', async ({ page }) => {
    const source = new JSZip();
    source.file('a.txt', 'a');
    const sourceBuffer = await source.generateAsync({ type: 'nodebuffer' });
    await page.goto('/tools/zip/');
    await page.setInputFiles('#zip-open-input', {
      name: 'a.zip',
      mimeType: 'application/zip',
      buffer: sourceBuffer,
    });
    await expect(page.locator('#zip-open-info')).toBeVisible();
    await page.click('#zip-open-reset');
    await expect(page.locator('#zip-open-info')).toBeHidden();
    await expect(page.locator('#zip-open-drop')).toBeVisible();
  });
});
