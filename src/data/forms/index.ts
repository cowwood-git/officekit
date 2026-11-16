import type { FormTemplate } from '@/lib/doc/types';
import { approvalRequest } from './approval-request';
import { award } from './award';
import { blankTable } from './blank-table';
import { careerCertificate } from './career-certificate';
import { certificate } from './certificate';
import { checklist } from './checklist';
import { delegation } from './delegation';
import { deliveryConfirmation } from './delivery-confirmation';
import { draft } from './draft';
import { employmentCertificate } from './employment-certificate';
import { expenseReport } from './expense-report';
import { expenseRequest } from './expense-request';
import { handover } from './handover';
import { incidentReport } from './incident-report';
import { leaveRequest } from './leave-request';
import { meetingMinutes } from './meeting-minutes';
import { monthlyReport } from './monthly-report';
import { overtimeRequest } from './overtime-request';
import { payslip } from './payslip';
import { privacyConsent } from './privacy-consent';
import { purchaseOrder } from './purchase-order';
import { quote } from './quote';
import { quoteComparison } from './quote-comparison';
import { resignation } from './resignation';
import { resignationCertificate } from './resignation-certificate';
import { salesDaily } from './sales-daily';
import { statement } from './statement';
import { statementOfCircumstances } from './statement-of-circumstances';
import { suppliesRequest } from './supplies-request';
import { travelExpense } from './travel-expense';
import { travelReport } from './travel-report';
import { travelRequest } from './travel-request';
import { visitReport } from './visit-report';
import { weeklyReport } from './weekly-report';

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
