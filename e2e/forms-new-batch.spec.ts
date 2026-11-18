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
  {
    slug: 'employee-register',
    heading: '근로자 명부',
    preview: ['근로자 명부', '김옷깃', '2021001', '4명'],
    validation: { fields: ['name'], message: '근로자를 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'wage-ledger',
    heading: '임금대장',
    preview: ['임금대장', '김옷깃', '3,380,000원', '10,250,000원'],
    validation: { fields: ['name'], message: '임금 내역을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'leave-ledger',
    heading: '연차 사용대장',
    preview: ['연차 사용대장', '김옷깃', '48일', '23.5일'],
    validation: { fields: ['name'], message: '연차 내역을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'attendance-summary',
    heading: '월별 출퇴근 집계표',
    preview: ['월별 출퇴근 집계표', '김옷깃', '79일', '24시간'],
    validation: { fields: ['name'], message: '직원별 집계를 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'shipping-label',
    heading: '물류 라벨',
    preview: ['거래처 주식회사', '부산시 해운대구 센텀중앙로 90', 'PO-20261118-001'],
    validation: { fields: ['recipient'], message: '받는 곳을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'name-badge',
    heading: '명찰',
    preview: ['김옷깃', '경영지원팀 · 팀장', '2026 문서 혁신 워크숍'],
    validation: { fields: ['name'], message: '명찰 대상을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'invitation',
    heading: '초대장',
    preview: ['2026 옷깃 고객 감사행사', '그랜드홀', '12월 10일까지'],
  },
  {
    slug: 'ticket',
    heading: '티켓',
    preview: ['2026 옷깃 컨퍼런스', 'A-12', '001'],
    validation: { fields: ['seat'], message: '티켓을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'commission',
    heading: '위촉장',
    preview: ['위촉장', '김옷깃', '문서 자동화 자문위원'],
  },
  {
    slug: 'merit-plaque',
    heading: '공로패',
    preview: ['공로패', '김옷깃', '10년 동안 회사의 문서 관리 체계'],
  },
  {
    slug: 'citation',
    heading: '표창장',
    preview: ['표창장', '이개발', '문서 엔진 성능 개선'],
  },
  {
    slug: 'completion-confirmation',
    heading: '수료 확인서',
    preview: ['수료 확인서', '김수료', '데이터 분석 실무'],
  },
  {
    slug: 'document-submission',
    heading: '서류 제출 확인서',
    preview: ['서류 제출 확인서', '○○구청', '사업자등록 신청서'],
    validation: { fields: ['name'], message: '제출 서류를 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'seal-delegation',
    heading: '인감 위임장',
    preview: ['인감 위임장', '옷깃 주식회사', '법인 등기 신청'],
  },
  {
    slug: 'content-certified-mail',
    heading: '내용증명 준비서',
    preview: ['내용증명 준비서', '김발신', '대금 지급 촉구'],
  },
  {
    slug: 'personal-guarantee',
    heading: '신원보증서',
    preview: ['신원보증서', '김보증', '김근로'],
  },
  {
    slug: 'contract-renewal',
    heading: '계약 갱신 합의서',
    preview: ['계약 갱신 합의서', '사무실 임대차 계약', '3,300,000원'],
  },
  {
    slug: 'contract-termination',
    heading: '계약 해지 합의서',
    preview: ['계약 해지 합의서', '홈페이지 유지보수 계약', '2026년 12월 31일'],
  },
  {
    slug: 'delivery-schedule',
    heading: '납품 일정표',
    preview: ['납품 일정표', 'A4 용지', '거래처 주식회사'],
    validation: { fields: ['item'], message: '납품 일정을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'vendor-contact-change',
    heading: '거래처 담당자 변경 통지서',
    preview: ['거래처 담당자 변경 통지서', '이담당', '물품 공급 계약'],
  },
  {
    slug: 'tax-invoice',
    heading: '세금계산서',
    preview: ['세 금 계 산 서', '옷깃 주식회사', '사무용품', '506,000원'],
    validation: { fields: ['name'], message: '품목을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'transaction-statement',
    heading: '거래명세표',
    preview: ['거 래 명 세 표', '옷깃 주식회사', '사무용품', '506,000원'],
    validation: { fields: ['name'], message: '품목을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'transaction-spec',
    heading: '거래명세서(표준)',
    preview: ['거 래 명 세 서', '옷깃 주식회사', '사무용품', '506,000원'],
    validation: { fields: ['name'], message: '품목을 한 줄 이상 입력하세요.' },
  },
  {
    slug: 'deposit-slip',
    heading: '입금전표',
    preview: ['입 금 전 표', '외상매출금', '330,000원'],
  },
  {
    slug: 'lined-note',
    heading: '줄 노트',
    preview: ['No.', 'NTE-20261118-001'],
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
      expect(file.name).toMatch(
        new RegExp(`${item.heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\\.hwpx$`),
      );
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
