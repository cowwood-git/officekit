import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

const NOTEBOOKS = [
  { slug: 'korean-notebook-8', title: '국어 8칸 노트' },
  { slug: 'korean-notebook-10', title: '국어 10칸 노트' },
  { slug: 'korean-notebook-11', title: '국어 11칸 노트' },
  { slug: 'english-notebook-4', title: '영어 4선 노트' },
  { slug: 'english-notebook-3', title: '영어 3선 노트' },
  { slug: 'music-notebook', title: '음악 오선지 노트' },
  { slug: 'math-notebook-5mm', title: '수학 5mm 모눈 노트' },
  { slug: 'math-notebook-10mm', title: '수학 10mm 모눈 노트' },
  { slug: 'hanja-notebook-8', title: '한자 8칸 노트' },
  { slug: 'hanja-notebook-10', title: '한자 10칸 노트' },
  { slug: 'dictation-notebook', title: '받아쓰기 노트' },
  { slug: 'vocabulary-notebook', title: '영어 단어장' },
] as const;

const loadPdf = async (page: Parameters<typeof captureDownload>[0]) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF 만들기' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  return PDFDocument.load(await readFile(path as string));
};

test.describe('아이들 공책', () => {
  test('공책 12종은 양식관이 아니라 키즈 섹션에 있다', async ({ page }) => {
    await page.goto('/kids/');
    await expect(page.locator('h1')).toHaveText('어린이 학습 공책');
    await expect(page.locator('.kids-page .form-card')).toHaveCount(12);
    await expect(page.locator('.kids-page')).toContainText('국어 10칸 노트');
    await expect(page.locator('.kids-page')).toContainText('받아쓰기 노트');

    await page.goto('/forms/');
    await expect(page.locator('#kids')).toHaveCount(0);
    await expect(page.locator('.kids-callout a')).toHaveAttribute('href', '/kids/');

    await page.goto('/forms/korean-notebook-10/');
    await expect(page.locator('.breadcrumbs')).toContainText('어린이 학습 공책');
  });

  for (const book of NOTEBOOKS.slice(0, 4)) {
    test(`${book.title}은 A4 한 쪽으로 인쇄된다`, async ({ page }) => {
      await page.goto(`/forms/${book.slug}/`);
      await expect(page.getByRole('heading', { name: `${book.title} 양식` })).toBeVisible();
      await page.getByRole('button', { name: '예시 채우기' }).click();
      await expect(page.locator('[data-preview-stage] svg')).toContainText('김옷깃');

      const pdf = await loadPdf(page);
      expect(pdf.getPageCount()).toBe(1);
      const { width, height } = pdf.getPage(0).getSize();
      expect(Math.round(width)).toBe(595);
      expect(Math.round(height)).toBe(842);
    });
  }

  test('받아쓰기 낱말이 연한 회색 정자체로 칸마다 인쇄된다', async ({ page }) => {
    await page.goto('/forms/dictation-notebook/');
    await page.locator('[data-row-field="word"]').nth(0).fill('학교');
    await page.locator('[data-row-field="word"]').nth(1).fill('가방');
    const preview = page.locator('[data-preview-stage] svg');
    await expect(preview.locator('text[fill="#C3CAD2"]', { hasText: '학' }).first()).toBeVisible();
    await expect(preview.locator('text[fill="#C3CAD2"]', { hasText: '교' }).first()).toBeVisible();
    await expect(preview.locator('text[fill="#C3CAD2"]', { hasText: '방' }).first()).toBeVisible();

    const pdf = await loadPdf(page);
    expect(pdf.getPageCount()).toBe(1);
  });

  test('단어장은 단어만 연한 회색, 뜻과 예문은 진한 글씨로 인쇄된다', async ({ page }) => {
    await page.goto('/forms/vocabulary-notebook/');
    await page.locator('[data-row-field="word"]').nth(0).fill('family');
    await page.locator('[data-row-field="meaning"]').nth(0).fill('가족');
    const preview = page.locator('[data-preview-stage] svg');
    await expect(
      preview.locator('text[fill="#C3CAD2"]', { hasText: 'family' }).first(),
    ).toBeVisible();
    await expect(
      preview.locator('text[fill="#14181f"]', { hasText: '가족' }).first(),
    ).toBeVisible();
  });

  test('한글 파일도 표와 글자 개체로 만든다', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/forms/korean-notebook-10/');
    await page.getByRole('button', { name: '예시 채우기' }).click();
    await page.waitForTimeout(150);
    await page.locator('summary', { hasText: '한글 파일' }).click();
    const file = await captureDownload(page, () =>
      page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
    );
    expect(file.name).toMatch(/국어 10칸 노트.*\.hwpx$/);
    const zip = await JSZip.loadAsync(file.buffer);
    const section = await zip.file('Contents/section0.xml')?.async('string');
    const header = await zip.file('Contents/header.xml')?.async('string');
    expect(section).toContain('<hp:tbl ');
    expect(section).toContain('김옷깃');
    expect(section).not.toContain('<hp:pic ');
    expect(header).toContain('face="나눔고딕"');
  });
});
