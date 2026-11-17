import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { captureDownload } from './fixtures';

interface Case {
  slug: string;
  heading: string;
  preview: string[];
  validation?: {
    fields?: string[];
    select?: { field: string; value: string };
    message: string;
  };
}

const cases: Case[] = [
  {
    slug: 'job-description',
    heading: '직무기술서',
    preview: ['직무기술서', '문서 자동화 개발자', '문서 엔진 개발', '문서 생성 성공률'],
    validation: { fields: ['duty'], message: '주요 책임을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'career-description',
    heading: '경력기술서',
    preview: ['경력기술서', '김지원', '업무 양식 엔진', '1쪽 출력 안정화'],
    validation: { fields: ['project'], message: '주요 프로젝트를 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'interview-questions',
    heading: '면접 질문지',
    preview: ['면접 질문지', 'PDF 생성에서 가장 어려웠던 문제는?', '김면접'],
    validation: { fields: ['question'], message: '질문을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'reference-check',
    heading: '레퍼런스 체크',
    preview: ['레퍼런스 체크', '김지원', '이전 팀장', '추천'],
    validation: {
      select: { field: 'consent', value: '동의하지 않음' },
      message: '지원자 동의 없이 레퍼런스 체크를 진행할 수 없습니다.',
    },
  },
  {
    slug: 'vehicle-log',
    heading: '법인차량 운행일지',
    preview: ['법인차량 운행일지', '12가 3456', '거래처 방문', '141km'],
    validation: { fields: ['purpose'], message: '운행 기록을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'asset-disposal',
    heading: '자산 폐기·불용 신청서',
    preview: ['자산 폐기·불용 신청서', 'AS-2021-001', '노트북', '5개'],
    validation: {
      fields: ['assetNo', 'name'],
      message: '대상 자산을 한 줄 이상 입력하세요.',
    },
  },
  {
    slug: 'asset-transfer',
    heading: '자산 이동 신청서',
    preview: ['자산 이동 신청서', 'AS-2024-010', '모니터', '3개'],
    validation: { fields: ['assetNo', 'name'], message: '이동할 자산을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'document-distribution',
    heading: '문서 배포·회수 대장',
    preview: ['문서 배포·회수 대장', '개인정보 처리방침', 'v2.1', '3명'],
    validation: {
      fields: ['department', 'name'],
      message: '배포 대상을 한 줄 이상 입력하세요.',
    },
  },
];

const clearRows = async (page: Parameters<typeof captureDownload>[0], fields: string[]) => {
  for (const field of fields) {
    const inputs = page.locator(`[data-row-field="${field}"]`);
    const count = await inputs.count();
    for (let index = 0; index < count; index += 1) await inputs.nth(index).fill('');
  }
};

for (const item of cases) {
  test.describe(item.heading, () => {
    test('예시와 PDF를 확인한다', async ({ page }) => {
      await page.goto(`/forms/${item.slug}/`);
      await expect(page.getByRole('heading', { name: `${item.heading} 양식` })).toBeVisible();
      await page.getByRole('button', { name: '예시 채우기' }).click();

      const preview = page.locator('[data-preview-stage] svg');
      for (const text of item.preview) await expect(preview).toContainText(text);

      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'PDF 만들기' }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain(item.heading);
      const path = await download.path();
      expect(path).toBeTruthy();
      if (!path) return;
      const pdf = await PDFDocument.load(await readFile(path));
      expect(pdf.getPageCount()).toBe(1);
    });

    test('한글 파일은 글자 개체로 만든다', async ({ page }) => {
      test.setTimeout(180_000);
      await page.goto(`/forms/${item.slug}/`);
      await page.getByRole('button', { name: '예시 채우기' }).click();
      await page.waitForTimeout(150);
      await page.locator('summary', { hasText: '한글 파일' }).click();
      const file = await captureDownload(page, () =>
        page.getByRole('menuitem', { name: /HWPX로 저장/ }).click(),
      );
      expect(file.name).toMatch(new RegExp(`${item.heading}.*\\.hwpx$`));
      const zip = await JSZip.loadAsync(file.buffer);
      const section = await zip.file('Contents/section0.xml')?.async('string');
      expect(section).toContain(item.preview[1] ?? item.preview[0] ?? '');
      expect(section).not.toContain('<hp:pic ');
    });

    const validation = item.validation;
    if (validation) {
      test('필수 항목이 비면 PDF를 만들지 않는다', async ({ page }) => {
        await page.goto(`/forms/${item.slug}/`);
        await page.getByRole('button', { name: '예시 채우기' }).click();
        if (validation.select) {
          await page
            .locator(`[data-field="${validation.select.field}"]`)
            .selectOption(validation.select.value);
        }
        if (validation.fields) await clearRows(page, validation.fields);
        await page.getByRole('button', { name: 'PDF 만들기' }).click();
        await expect(page.locator('[data-form-error]')).toContainText(validation.message);
      });
    }
  });
}
