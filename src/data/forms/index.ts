import type { FormTemplate } from '@/lib/doc/types';
import { approvalRequest } from './approval-request';
import { assetLedger } from './asset-ledger';
import { attendance } from './attendance';
import { award } from './award';
import { blankTable } from './blank-table';
import { budgetPlan } from './budget-plan';
import { businessCardRequest } from './business-card-request';
import { careerCertificate } from './career-certificate';
import { certificate } from './certificate';
import { checklist } from './checklist';
import { claimLog } from './claim-log';
import { contractAmendment } from './contract-amendment';
import { corporateCardReport } from './corporate-card-report';
import { delayNotice } from './delay-notice';
import { delegation } from './delegation';
import { deliveryConfirm } from './delivery-confirm';
import { deliveryConfirmation } from './delivery-confirmation';
import { deliveryNote } from './delivery-note';
import { draft } from './draft';
import { employmentCertificate } from './employment-certificate';
import { expenseReport } from './expense-report';
import { expenseRequest } from './expense-request';
import { facilityCheck } from './facility-check';
import { factConfirmation } from './fact-confirmation';
import { goodsReceipt } from './goods-receipt';
import { handover } from './handover';
import { ideaProposal } from './idea-proposal';
import { incidentReport } from './incident-report';
import { inventoryCount } from './inventory-count';
import { leavePlan } from './leave-plan';
import { leaveRequest } from './leave-request';
import { meetingMinutes } from './meeting-minutes';
import { monthlyReport } from './monthly-report';
import { nda } from './nda';
import { notice } from './notice';
import { officialLetter } from './official-letter';
import { onboardingChecklist } from './onboarding-checklist';
import { outstandingBalance } from './outstanding-balance';
import { overtimeRequest } from './overtime-request';
import { paymentConfirmation } from './payment-confirmation';
import { payslip } from './payslip';
import { pressRelease } from './press-release';
import { priceList } from './price-list';
import { privacyConsent } from './privacy-consent';
import { projectKickoff } from './project-kickoff';
import { proposalCover } from './proposal-cover';
import { purchaseOrder } from './purchase-order';
import { quote } from './quote';
import { quoteComparison } from './quote-comparison';
import { receipt } from './receipt';
import { residenceConfirmation } from './residence-confirmation';
import { resignation } from './resignation';
import { resignationCertificate } from './resignation-certificate';
import { resultReport } from './result-report';
import { returnRequest } from './return-request';
import { rnr } from './rnr';
import { roomBooking } from './room-booking';
import { safetyCheck } from './safety-check';
import { salesDaily } from './sales-daily';
import { signInSheet } from './sign-in-sheet';
import { statement } from './statement';
import { statementOfCircumstances } from './statement-of-circumstances';
import { suppliesLedger } from './supplies-ledger';
import { suppliesRequest } from './supplies-request';
import { trainingRequest } from './training-request';
import { travelExpense } from './travel-expense';
import { travelReport } from './travel-report';
import { travelRequest } from './travel-request';
import { vendorRegistration } from './vendor-registration';
import { visitReport } from './visit-report';
import { visitorLog } from './visitor-log';
import { weeklyReport } from './weekly-report';
import { workDaily } from './work-daily';
import { workLog } from './work-log';

/** 공개된 양식 목록. 새 양식은 여기에 추가한다. */
export const FORMS: readonly FormTemplate[] = [
  leaveRequest,
  resignation,
  incidentReport,
  statementOfCircumstances,
  resignationCertificate,
  overtimeRequest,
  careerCertificate,
  payslip,
  suppliesRequest,
  draft,
  privacyConsent,
  monthlyReport,
  expenseRequest,
  quoteComparison,
  visitReport,
  salesDaily,
  returnRequest,
  deliveryNote,
  priceList,
  vendorRegistration,
  goodsReceipt,
  receipt,
  paymentConfirmation,
  corporateCardReport,
  leavePlan,
  trainingRequest,
  businessCardRequest,
  nda,
  projectKickoff,
  resultReport,
  workLog,
  rnr,
  workDaily,
  safetyCheck,
  facilityCheck,
  visitorLog,
  proposalCover,
  claimLog,
  delayNotice,
  contractAmendment,
  inventoryCount,
  suppliesLedger,
  assetLedger,
  attendance,
  notice,
  roomBooking,
  onboardingChecklist,
  factConfirmation,
  ideaProposal,
  officialLetter,
  pressRelease,
  signInSheet,
  deliveryConfirm,
  outstandingBalance,
  budgetPlan,
  residenceConfirmation,
  meetingMinutes,
  approvalRequest,
  expenseReport,
  purchaseOrder,
  deliveryConfirmation,
  travelRequest,
  travelReport,
  travelExpense,
  weeklyReport,
  handover,
  employmentCertificate,
  delegation,
  quote,
  statement,
  certificate,
  award,
  blankTable,
  checklist,
];

export const FORM_FAMILIES: Record<FormTemplate['family'], string> = {
  finance: '재무·거래',
  hr: '인사·총무',
  sales: '영업·계약',
  report: '기획·보고',
  operations: '운영·현장',
  admin: '행정·생활',
  certificate: '수료·수상',
  proof: '증명·발급',
  label: '라벨·인쇄',
};

export function getForm(slug: string): FormTemplate | undefined {
  return FORMS.find((form) => form.slug === slug);
}
