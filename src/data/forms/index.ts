import type { FormTemplate } from '@/lib/doc/types';
import { agreement } from './agreement';
import { appointment } from './appointment';
import { appreciation } from './appreciation';
import { approvalRequest } from './approval-request';
import { assetDisposal } from './asset-disposal';
import { assetLedger } from './asset-ledger';
import { assetTransfer } from './asset-transfer';
import { attendance } from './attendance';
import { attendanceCorrection } from './attendance-correction';
import { attendanceSummary } from './attendance-summary';
import { award } from './award';
import { blankTable } from './blank-table';
import { budgetPlan } from './budget-plan';
import { businessCardRequest } from './business-card-request';
import { careerCertificate } from './career-certificate';
import { careerDescription } from './career-description';
import { certificate } from './certificate';
import { checklist } from './checklist';
import { citation } from './citation';
import { claimLog } from './claim-log';
import { collaborationRequest } from './collaboration-request';
import { commission } from './commission';
import { completionConfirmation } from './completion-confirmation';
import { contentCertifiedMail } from './content-certified-mail';
import { contractAmendment } from './contract-amendment';
import { contractRenewal } from './contract-renewal';
import { contractTermination } from './contract-termination';
import { corporateCardReport } from './corporate-card-report';
import { dataRequest } from './data-request';
import { defectRequest } from './defect-request';
import { delayNotice } from './delay-notice';
import { delegation } from './delegation';
import { deliveryConfirm } from './delivery-confirm';
import { deliveryConfirmation } from './delivery-confirmation';
import { deliveryNote } from './delivery-note';
import { deliverySchedule } from './delivery-schedule';
import { depositSlip } from './deposit-slip';
import { documentDistribution } from './document-distribution';
import { documentSubmission } from './document-submission';
import { draft } from './draft';
import { employeeRegister } from './employee-register';
import { employmentCertificate } from './employment-certificate';
import { employmentContract } from './employment-contract';
import { evaluation } from './evaluation';
import { expenseReport } from './expense-report';
import { expenseRequest } from './expense-request';
import { facilityCheck } from './facility-check';
import { factConfirmation } from './fact-confirmation';
import { genericApplication } from './generic-application';
import { goodsReceipt } from './goods-receipt';
import { handover } from './handover';
import { ideaProposal } from './idea-proposal';
import { incidentReport } from './incident-report';
import { inspection } from './inspection';
import { interviewEvaluation } from './interview-evaluation';
import { interviewQuestions } from './interview-questions';
import { inventoryCount } from './inventory-count';
import { invitation } from './invitation';
import { jobApplication } from './job-application';
import { jobDescription } from './job-description';
import { leaveLedger } from './leave-ledger';
import { leaveOfAbsence } from './leave-of-absence';
import { leavePlan } from './leave-plan';
import { leaveRequest } from './leave-request';
import { loanNote } from './loan-note';
import { meetingMinutes } from './meeting-minutes';
import { meetingNotice } from './meeting-notice';
import { memorandum } from './memorandum';
import { meritPlaque } from './merit-plaque';
import { monthlyReport } from './monthly-report';
import { nameBadge } from './name-badge';
import { nda } from './nda';
import { notice } from './notice';
import { offerNotice } from './offer-notice';
import { officialLetter } from './official-letter';
import { onboardingChecklist } from './onboarding-checklist';
import { outstandingBalance } from './outstanding-balance';
import { overtimeAgreement } from './overtime-agreement';
import { overtimeRequest } from './overtime-request';
import { parentalLeave } from './parental-leave';
import { paymentConfirmation } from './payment-confirmation';
import { payslip } from './payslip';
import { personalGuarantee } from './personal-guarantee';
import { pressRelease } from './press-release';
import { priceList } from './price-list';
import { privacyConsent } from './privacy-consent';
import { projectKickoff } from './project-kickoff';
import { proposalCover } from './proposal-cover';
import { purchaseOrder } from './purchase-order';
import { quote } from './quote';
import { quoteComparison } from './quote-comparison';
import { receipt } from './receipt';
import { recruitment } from './recruitment';
import { referenceCheck } from './reference-check';
import { residenceConfirmation } from './residence-confirmation';
import { resignation } from './resignation';
import { resignationCertificate } from './resignation-certificate';
import { resultReport } from './result-report';
import { returnRequest } from './return-request';
import { reviewRequest } from './review-request';
import { rfq } from './rfq';
import { rnr } from './rnr';
import { roomBooking } from './room-booking';
import { safetyCheck } from './safety-check';
import { salesDaily } from './sales-daily';
import { sealDelegation } from './seal-delegation';
import { serviceContract } from './service-contract';
import { shippingLabel } from './shipping-label';
import { signInSheet } from './sign-in-sheet';
import { statement } from './statement';
import { statementOfCircumstances } from './statement-of-circumstances';
import { suppliesLedger } from './supplies-ledger';
import { suppliesRequest } from './supplies-request';
import { supplyContract } from './supply-contract';
import { syllabus } from './syllabus';
import { taxInvoice } from './tax-invoice';
import { ticket } from './ticket';
import { trainingRequest } from './training-request';
import { transactionSpec } from './transaction-spec';
import { transactionStatement } from './transaction-statement';
import { travelExpense } from './travel-expense';
import { travelReport } from './travel-report';
import { travelRequest } from './travel-request';
import { vehicleLog } from './vehicle-log';
import { vendorContactChange } from './vendor-contact-change';
import { vendorEvaluation } from './vendor-evaluation';
import { vendorRegistration } from './vendor-registration';
import { visitReport } from './visit-report';
import { visitorLog } from './visitor-log';
import { wageLedger } from './wage-ledger';
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
  serviceContract,
  supplyContract,
  employmentContract,
  genericApplication,
  agreement,
  memorandum,
  loanNote,
  appreciation,
  appointment,
  syllabus,
  evaluation,
  recruitment,
  jobApplication,
  interviewEvaluation,
  offerNotice,
  rfq,
  inspection,
  defectRequest,
  vendorEvaluation,
  parentalLeave,
  leaveOfAbsence,
  overtimeAgreement,
  attendanceCorrection,
  jobDescription,
  careerDescription,
  employeeRegister,
  wageLedger,
  leaveLedger,
  attendanceSummary,
  interviewQuestions,
  referenceCheck,
  vehicleLog,
  assetDisposal,
  assetTransfer,
  documentDistribution,
  collaborationRequest,
  dataRequest,
  reviewRequest,
  meetingNotice,
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
  taxInvoice,
  transactionStatement,
  transactionSpec,
  depositSlip,
  certificate,
  award,
  blankTable,
  checklist,
  shippingLabel,
  nameBadge,
  invitation,
  ticket,
  commission,
  meritPlaque,
  citation,
  completionConfirmation,
  documentSubmission,
  sealDelegation,
  contentCertifiedMail,
  personalGuarantee,
  contractRenewal,
  contractTermination,
  deliverySchedule,
  vendorContactChange,
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
