import type { FormTemplate } from '@/lib/doc/types';

/**
 * 양식 페이지 출처 아래에 붙는 안내 문구.
 * 모든 양식에 "취업규칙"을 말하던 한 줄을 문서 성격별로 나눴다.
 */

/** 근로기준법상 기재 사항·한도가 정해진 노무 문서. */
const LABOR = new Set([
  'payslip',
  'wage-ledger',
  'employee-register',
  'employment-contract',
  'overtime-agreement',
  'overtime-request',
  'leave-ledger',
  'leave-request',
  'leave-plan',
  'parental-leave',
  'leave-of-absence',
  'resignation',
  'attendance',
  'attendance-correction',
  'attendance-summary',
  'offer-notice',
]);

/** 세금계산서·영수증·전표처럼 세무 증빙과 맞닿은 서식. */
const TAX = new Set([
  'tax-invoice',
  'tax-exempt-invoice',
  'standard-receipt',
  'receipt',
  'transaction-statement',
  'transaction-spec',
  'statement',
  'deposit-slip',
  'withdrawal-slip',
  'payment-confirmation',
]);

/** 당사자 사이에 권리·의무가 생기는 계약·법률 문서. */
const LEGAL = new Set([
  'agreement',
  'loan-note',
  'nda',
  'service-contract',
  'supply-contract',
  'contract-amendment',
  'contract-renewal',
  'contract-termination',
  'personal-guarantee',
  'seal-delegation',
  'delegation',
  'content-certified-mail',
  'memorandum',
  'fact-confirmation',
  'privacy-consent',
]);

/** 회사·기관이 사실을 확인해 주는 증명서. */
const CERTIFICATE = new Set([
  'employment-certificate',
  'career-certificate',
  'resignation-certificate',
  'residence-confirmation',
]);

export type DisclaimerKind = 'labor' | 'tax' | 'legal' | 'certificate' | 'kids' | 'general';

export function disclaimerKind(form: Pick<FormTemplate, 'slug' | 'category'>): DisclaimerKind {
  if (LABOR.has(form.slug)) return 'labor';
  if (TAX.has(form.slug)) return 'tax';
  if (LEGAL.has(form.slug)) return 'legal';
  if (CERTIFICATE.has(form.slug)) return 'certificate';
  if (form.category === 'kids') return 'kids';
  return 'general';
}

const TEXT: Record<DisclaimerKind, string> = {
  labor:
    '이 양식은 참고용입니다. 근로기준법 등 노동 관계 법령과 회사의 취업규칙·단체협약을 함께 확인하고, 임금·근로시간 판단이 어려우면 고용노동부 고객상담센터(1350)나 노무사와 상담하세요.',
  tax: '이 양식은 참고용 종이 서식입니다. 전자세금계산서·현금영수증·카드매출전표 등 법정 증빙은 홈택스나 결제 단말기에서 발급한 원본이 우선하며, 세무 처리는 세무 전문가와 확인하세요.',
  legal:
    '이 양식은 참고용입니다. 당사자 사정에 맞게 조항을 고쳐 쓰고, 금액이 크거나 분쟁 가능성이 있으면 서명 전에 변호사 등 법률 전문가의 검토를 받으세요.',
  certificate:
    '이 양식은 참고용입니다. 제출처가 정한 서식이 있으면 그 서식을 우선하고, 발급 내용은 인사·행정 기록과 일치하는지 확인하세요.',
  kids: '학습용 공책 서식입니다. 인쇄 배율을 100%로 두면 실제 공책과 같은 크기로 나옵니다.',
  general: '이 양식은 참고용입니다. 회사 규정과 제출처의 요구 사항에 맞게 고쳐 쓰세요.',
};

export function formDisclaimer(form: Pick<FormTemplate, 'slug' | 'category'>): string {
  return TEXT[disclaimerKind(form)];
}
