import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';
import { orderInputs } from '../src/lib/input-order';

/**
 * 입력 화면 구역 순서는 문서(PDF)의 위→아래 순서와 같아야 한다.
 * 반복 표는 대괄호로 표시한다. 양식을 추가하면 여기에도 순서를 적는다.
 */
const EXPECTED: Record<string, readonly string[]> = {
  'leave-request': ['기본 정보', '신청자', '휴가 정보', '내용', '결재선'],
  resignation: ['기본 정보', '사직자', '재직 정보', '사직 사유', '인수인계', '결재선'],
  'incident-report': ['기본 정보', '작성자', '사건 개요', '경위와 원인', '재발 방지', '결재선'],
  'statement-of-circumstances': ['기본 정보', '작성자', '사건 개요', '경위', '첨부', '결재선'],
  'resignation-certificate': ['발급 정보', '퇴직자', '퇴직 정보', '발급 회사'],
  'overtime-request': ['기본 정보', '신청자', '초과근무 정보', '업무 내용', '결재선'],
  'career-certificate': ['발급 정보', '인적 사항', '[경력 사항]', '발급 회사'],
  payslip: ['기본 정보', '사원 정보', '[지급 내역]', '[공제 내역]', '급여 합계', '발급 회사'],
  'supplies-request': ['기본 정보', '신청자', '신청 정보', '[신청 품목]', '비고', '결재선'],
  draft: ['기본 정보', '기안자', '문서 정보', '내용', '결재선'],
  'privacy-consent': ['기본 정보', '처리자 정보', '수집·이용 내역', '동의자'],
  'monthly-report': [
    '기본 정보',
    '작성자',
    '보고 기간',
    '[이달 업무]',
    '이달 요약',
    '이슈와 계획',
    '결재선',
  ],
  'expense-request': ['기본 정보', '신청자', '지출 정보', '내용', '결재선'],
  'quote-comparison': [
    '기본 정보',
    '비교 정보',
    '비교 업체',
    '[비교 품목]',
    '비교 합계',
    '의견',
    '결재선',
  ],
  'visit-report': ['기본 정보', '작성자', '방문 정보', '내용', '후속 조치', '결재선'],
  'sales-daily': ['기본 정보', '작성자', '활동 정보', '[활동 내역]', '요약', '결재선'],
  'return-request': [
    '기본 정보',
    '신청인',
    '주문 정보',
    '요청 정보',
    '[요청 품목]',
    '내용',
    '환불',
    '기타',
    '확인',
  ],
  'delivery-note': ['문서', '공급자', '납품처', '납품 정보', '[납품 품목]', '비고', '확인'],
  'price-list': ['문서', '공급자', '적용 조건', '[품목별 단가]', '조건', '확인'],
  'vendor-registration': ['문서', '신청 업체', '담당자', '거래 조건', '[거래 품목]', '확인'],
  'goods-receipt': ['문서', '공급자', '인수 정보', '[인수 품목]', '확인'],
  receipt: ['문서', '영수 정보', '영수 내역', '비고', '확인'],
  'payment-confirmation': ['문서', '입금 정보', '입금 금액', '확인', '비고'],
  'corporate-card-report': ['문서', '사용 정보', '[사용 내역]', '집계', '비고', '결재선'],
  'leave-plan': ['문서', '신청자', '연차 정보', '[사용 계획]', '비고', '결재선'],
  'training-request': ['문서', '신청자', '교육 정보', '교육 비용', '내용', '비고', '결재선'],
  'business-card-request': [
    '문서',
    '신청 정보',
    '명함 정보',
    '[명함 신청 명단]',
    '배송·비고',
    '결재선',
  ],
  nda: ['문서', '공개자', '수신자', '계약 내용', '서명'],
  'project-kickoff': ['문서', '프로젝트 개요', '내용', '[일정·산출물]', '리스크', '결재선'],
  'result-report': ['문서', '개요', '내용', '[성과 지표]', '평가', '결재선'],
  'work-log': ['문서', '작성자', '근무 정보', '[업무 내역]', '요약', '결재선'],
  rnr: ['문서', '부서 정보', '[업무 분장]', '비고', '결재선'],
  'meeting-minutes': ['기본 정보', '회의 정보', '참석', '회의 내용', '결재선'],
  'approval-request': ['문서', '기안자', '품의 정보', '내용', '결재선'],
  'expense-report': ['문서', '지출자', '지출 정보', '[지출 내역]', '사유', '결재선'],
  'purchase-order': [
    '문서',
    '발주자',
    '공급자',
    '발주 조건',
    '[품목]',
    '납기·결제 조건',
    '비고',
    '결재선',
  ],
  'delivery-confirmation': ['문서', '공급자', '공급받는자', '납품 정보', '[납품 품목]', '비고'],
  'travel-request': ['문서', '출장자', '출장 정보', '출장 목적', '[예상 경비]', '결재선'],
  'travel-report': ['문서', '출장자', '출장 정보', '[주요 일정]', '내용', '결재선'],
  'travel-expense': ['문서', '출장자', '출장 정보', '[지출 내역]', '정산', '결재선'],
  'weekly-report': ['문서', '작성자', '보고 기간', '[이번 주 업무]', '내용', '결재선'],
  handover: ['문서', '인수인계자', '인수자', '인수인계 정보', '내용', '서명'],
  'employment-certificate': ['발급 정보', '재직자', '재직 정보', '발급 회사'],
  delegation: ['문서', '위임인', '수임인', '위임 내용', '서명'],
  quote: ['문서', '공급자', '공급받는자', '조건', '[품목]', '비고'],
  statement: ['문서', '공급자', '공급받는자', '조건', '[품목]', '비고'],
  certificate: ['문서', '수료자', '교육 정보', '발급 기관'],
  award: ['문서', '수상자', '수상 정보', '수여 기관'],
  'blank-table': ['문서', '작성 정보', '표 설정', '[표 내용]', '내용', '서명'],
  checklist: ['문서', '점검 정보', '[점검 항목]', '내용', '서명'],
  'work-daily': [
    '문서',
    '작업 정보',
    '작업 내용',
    '[투입 인력]',
    '안전 조치',
    '특이사항',
    '결재선',
  ],
  'safety-check': ['문서', '점검 정보', '[점검 항목]', '지적 사항', '조치 계획', '결재선'],
  'facility-check': ['문서', '시설 정보', '[점검 항목]', '비고', '결재선'],
  'visitor-log': ['문서', '방문 정보', '[방문 기록]', '안내 사항', '확인'],
  'proposal-cover': ['문서', '제안 정보', '제안 요약', '서명'],
  'claim-log': ['문서', '접수 정보', '[클레임 내역]', '비고', '결재선'],
  'delay-notice': ['문서', '납품 정보', '[지연 품목]', '지연 사유', '후속 조치', '결재선'],
  'contract-amendment': ['문서', '계약 정보', '변경 내용', '변경 사유', '기타', '서명'],
  'inventory-count': ['문서', '조사 정보', '[재고 항목]', '비고', '결재선'],
  'supplies-ledger': ['문서', '관리 정보', '[비품 목록]', '비고', '결재선'],
  'asset-ledger': ['문서', '관리 정보', '[자산 목록]', '비고', '결재선'],
  attendance: ['문서', '교육 정보', '[출석 명단]', '비고', '결재선'],
  notice: ['문서', '공고 정보', '공고 내용', '문의·첨부', '결재선'],
  'room-booking': ['문서', '예약 정보', '사용 목적', '비고', '결재선'],
  'onboarding-checklist': ['문서', '대상자 정보', '[온보딩 항목]', '추가 안내', '결재선'],
  'fact-confirmation': ['문서', '신청인', '확인 내용', '용도', '확인 기관', '비고', '서명'],
  'idea-proposal': [
    '문서',
    '제안 정보',
    '현재 상황',
    '제안 내용',
    '기대 효과',
    '실행 계획',
    '결재선',
  ],
  'official-letter': ['문서', '문서 정보', '제목', '본문', '붙임', '서명'],
  'press-release': ['문서', '보도 정보', '본문', '인용문', '회사 소개'],
  'sign-in-sheet': ['문서', '회의 정보', '[참석 명단]', '안내', '확인'],
  'delivery-confirm': ['문서', '배송 정보', '배송 결과', '[배송 품목]', '비고', '확인'],
  'outstanding-balance': ['문서', '거래처 정보', '[미수금 내역]', '비고', '결재선'],
  'budget-plan': ['문서', '예산 정보', '[예산 항목]', '집행 원칙', '결재선'],
  'residence-confirmation': ['문서', '대상자', '용도', '확인 기관', '비고', '서명'],
};

const sectionsOf = (slug: string): string[] => {
  const form = FORMS.find((item) => item.slug === slug);
  if (!form) throw new Error(`${slug} 양식이 없습니다.`);
  return orderInputs(form.fields, form.groups ?? []).map((entry) =>
    entry.kind === 'fields' ? entry.name : `[${entry.group.label}]`,
  );
};

describe('양식 입력 순서 전수 검사', () => {
  it('모든 입력 구역이 문서 순서대로 놓인다', () => {
    expect(Object.keys(EXPECTED).sort()).toEqual(FORMS.map((form) => form.slug).sort());
    for (const form of FORMS) {
      expect(sectionsOf(form.slug), form.slug).toEqual(EXPECTED[form.slug]);
    }
  });

  it('모든 반복 표가 입력 구역 사이에 놓인다', () => {
    for (const form of FORMS) {
      const sectionNames = new Set(
        orderInputs(form.fields, form.groups ?? [])
          .filter((entry) => entry.kind === 'fields')
          .map((entry) => entry.name),
      );
      const repeatLabels = new Set((form.groups ?? []).map((group) => group.label));
      for (const group of form.groups ?? []) {
        expect(group.group, `${form.slug} ${group.id}의 위치`).toBeTruthy();
        expect(
          group.group && (sectionNames.has(group.group) || repeatLabels.has(group.group)),
          `${form.slug} ${group.id}의 위치 "${group.group}"`,
        ).toBe(true);
      }
    }
  });

  it('결재 입력 구역의 이름은 결재선이다', () => {
    for (const form of FORMS) {
      for (const field of form.fields) {
        expect(field.group, `${form.slug} ${field.id}`).not.toBe('결재');
      }
    }
  });
});
