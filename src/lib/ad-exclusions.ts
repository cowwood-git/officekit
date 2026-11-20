/**
 * 광고 스크립트를 싣지 않는 민감 페이지. 기능·색인은 그대로이고 광고만 빠진다.
 *
 * 광고 스크립트는 같은 페이지에서 실행되므로 입력칸에 있는 값에 닿을 수 있다.
 * 비밀번호·급여·계좌·신분·징계처럼 새면 피해가 큰 값이 입력칸에 그대로 있는 페이지만 고른다.
 * 근거: docs/research/full-review-2026-11-20/REPORT.md §1.1
 *
 * 유아·어린이 학습 공책(/kids/ 섹션, 공책·공책 묶음 페이지)도 싣지 않는다. 아이 대상 콘텐츠는
 * AdSense 아동 대상 정책(맞춤 광고 불가)에 걸리므로, 섹션 전체를 광고 없이 둔다.
 */
import { KIDS_BUNDLE_SLUGS, KIDS_FORM_SLUGS } from '@/data/form-sections';

export const NO_AD_TOOLS: ReadonlySet<string> = new Set([
  'password-generator',
  'pdf-protect',
  'pdf-unlock',
]);

export const NO_AD_FORMS: ReadonlySet<string> = new Set([
  // 급여·인사
  'payslip',
  'wage-ledger',
  'employee-register',
  'employment-contract',
  'job-application',
  // 카드·계좌
  'corporate-card-report',
  'payment-confirmation',
  'return-request',
  'vendor-registration',
  // 신분·보증·금전
  'personal-guarantee',
  'seal-delegation',
  'loan-note',
  'residence-confirmation',
  'privacy-consent',
  // 징계·사실관계
  'incident-report',
  'statement-of-circumstances',
  'fact-confirmation',
  'memorandum',
  // 채용·평가
  'interview-evaluation',
  'reference-check',
  'offer-notice',
  // 휴직·퇴직
  'parental-leave',
  'leave-of-absence',
  'resignation',
  // 증명서
  'resignation-certificate',
  'employment-certificate',
  'career-certificate',
  'delegation',
  // 분쟁·계약
  'content-certified-mail',
  'agreement',
  'nda',
  'contract-termination',
  // 근태
  'overtime-agreement',
  'attendance-correction',
  'overtime-request',
  'leave-ledger',
]);

/** `/tools/<slug>/…`·`/forms/<slug>/` 경로가 제외 목록에 있거나 유아 섹션이면 false. */
export function adsAllowed(path: string): boolean {
  const [, section, slug, child] = path.split('/');
  if (section === 'kids') return false;
  if (section === 'tools') return !NO_AD_TOOLS.has(slug ?? '');
  if (section === 'forms' && slug === 'bundles') return !KIDS_BUNDLE_SLUGS.has(child ?? '');
  if (section === 'forms') return !NO_AD_FORMS.has(slug ?? '') && !KIDS_FORM_SLUGS.has(slug ?? '');
  return true;
}
