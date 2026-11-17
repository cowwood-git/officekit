import type { FormTemplate } from '@/lib/doc/types';

/**
 * 양식별 지연 로더. 페이지는 slug만 넘기고, 필요한 템플릿만 그때 내려받는다.
 * 새 양식을 추가하면 여기에 한 줄을 더한다.
 */
const LOADERS: Record<string, () => Promise<FormTemplate>> = {
  'leave-request': () => import('./leave-request').then((module) => module.leaveRequest),
  resignation: () => import('./resignation').then((module) => module.resignation),
  'incident-report': () => import('./incident-report').then((module) => module.incidentReport),
  'statement-of-circumstances': () =>
    import('./statement-of-circumstances').then((module) => module.statementOfCircumstances),
  'resignation-certificate': () =>
    import('./resignation-certificate').then((module) => module.resignationCertificate),
  'overtime-request': () => import('./overtime-request').then((module) => module.overtimeRequest),
  'meeting-minutes': () => import('./meeting-minutes').then((module) => module.meetingMinutes),
  'expense-report': () => import('./expense-report').then((module) => module.expenseReport),
  'approval-request': () => import('./approval-request').then((module) => module.approvalRequest),
  'purchase-order': () => import('./purchase-order').then((module) => module.purchaseOrder),
  'delivery-confirmation': () =>
    import('./delivery-confirmation').then((module) => module.deliveryConfirmation),
  'travel-request': () => import('./travel-request').then((module) => module.travelRequest),
  'travel-report': () => import('./travel-report').then((module) => module.travelReport),
  'travel-expense': () => import('./travel-expense').then((module) => module.travelExpense),
  'weekly-report': () => import('./weekly-report').then((module) => module.weeklyReport),
  handover: () => import('./handover').then((module) => module.handover),
  'employment-certificate': () =>
    import('./employment-certificate').then((module) => module.employmentCertificate),
  delegation: () => import('./delegation').then((module) => module.delegation),
  certificate: () => import('./certificate').then((module) => module.certificate),
  award: () => import('./award').then((module) => module.award),
  'blank-table': () => import('./blank-table').then((module) => module.blankTable),
  checklist: () => import('./checklist').then((module) => module.checklist),
  quote: () => import('./quote').then((module) => module.quote),
  statement: () => import('./statement').then((module) => module.statement),
  'career-certificate': () =>
    import('./career-certificate').then((module) => module.careerCertificate),
  payslip: () => import('./payslip').then((module) => module.payslip),
  'supplies-request': () => import('./supplies-request').then((module) => module.suppliesRequest),
  draft: () => import('./draft').then((module) => module.draft),
  'privacy-consent': () => import('./privacy-consent').then((module) => module.privacyConsent),
  'monthly-report': () => import('./monthly-report').then((module) => module.monthlyReport),
  'expense-request': () => import('./expense-request').then((module) => module.expenseRequest),
  'quote-comparison': () => import('./quote-comparison').then((module) => module.quoteComparison),
  'visit-report': () => import('./visit-report').then((module) => module.visitReport),
  'sales-daily': () => import('./sales-daily').then((module) => module.salesDaily),
  'return-request': () => import('./return-request').then((module) => module.returnRequest),
  'delivery-note': () => import('./delivery-note').then((module) => module.deliveryNote),
  'price-list': () => import('./price-list').then((module) => module.priceList),
  'vendor-registration': () =>
    import('./vendor-registration').then((module) => module.vendorRegistration),
  'goods-receipt': () => import('./goods-receipt').then((module) => module.goodsReceipt),
  receipt: () => import('./receipt').then((module) => module.receipt),
  'payment-confirmation': () =>
    import('./payment-confirmation').then((module) => module.paymentConfirmation),
  'corporate-card-report': () =>
    import('./corporate-card-report').then((module) => module.corporateCardReport),
  'leave-plan': () => import('./leave-plan').then((module) => module.leavePlan),
  'training-request': () => import('./training-request').then((module) => module.trainingRequest),
  'business-card-request': () =>
    import('./business-card-request').then((module) => module.businessCardRequest),
  nda: () => import('./nda').then((module) => module.nda),
  'project-kickoff': () => import('./project-kickoff').then((module) => module.projectKickoff),
  'result-report': () => import('./result-report').then((module) => module.resultReport),
  'work-log': () => import('./work-log').then((module) => module.workLog),
  rnr: () => import('./rnr').then((module) => module.rnr),
  'work-daily': () => import('./work-daily').then((module) => module.workDaily),
  'safety-check': () => import('./safety-check').then((module) => module.safetyCheck),
  'facility-check': () => import('./facility-check').then((module) => module.facilityCheck),
  'visitor-log': () => import('./visitor-log').then((module) => module.visitorLog),
  'proposal-cover': () => import('./proposal-cover').then((module) => module.proposalCover),
  'claim-log': () => import('./claim-log').then((module) => module.claimLog),
  'delay-notice': () => import('./delay-notice').then((module) => module.delayNotice),
  'contract-amendment': () =>
    import('./contract-amendment').then((module) => module.contractAmendment),
  'inventory-count': () => import('./inventory-count').then((module) => module.inventoryCount),
  'supplies-ledger': () => import('./supplies-ledger').then((module) => module.suppliesLedger),
  'asset-ledger': () => import('./asset-ledger').then((module) => module.assetLedger),
  attendance: () => import('./attendance').then((module) => module.attendance),
  notice: () => import('./notice').then((module) => module.notice),
  'room-booking': () => import('./room-booking').then((module) => module.roomBooking),
  'onboarding-checklist': () =>
    import('./onboarding-checklist').then((module) => module.onboardingChecklist),
  'fact-confirmation': () =>
    import('./fact-confirmation').then((module) => module.factConfirmation),
  'idea-proposal': () => import('./idea-proposal').then((module) => module.ideaProposal),
  'official-letter': () => import('./official-letter').then((module) => module.officialLetter),
  'press-release': () => import('./press-release').then((module) => module.pressRelease),
  'sign-in-sheet': () => import('./sign-in-sheet').then((module) => module.signInSheet),
  'delivery-confirm': () => import('./delivery-confirm').then((module) => module.deliveryConfirm),
  'outstanding-balance': () =>
    import('./outstanding-balance').then((module) => module.outstandingBalance),
  'budget-plan': () => import('./budget-plan').then((module) => module.budgetPlan),
  'residence-confirmation': () =>
    import('./residence-confirmation').then((module) => module.residenceConfirmation),
  'service-contract': () => import('./service-contract').then((module) => module.serviceContract),
  'supply-contract': () => import('./supply-contract').then((module) => module.supplyContract),
  'employment-contract': () =>
    import('./employment-contract').then((module) => module.employmentContract),
  'generic-application': () =>
    import('./generic-application').then((module) => module.genericApplication),
  agreement: () => import('./agreement').then((module) => module.agreement),
  memorandum: () => import('./memorandum').then((module) => module.memorandum),
  'loan-note': () => import('./loan-note').then((module) => module.loanNote),
  appreciation: () => import('./appreciation').then((module) => module.appreciation),
  appointment: () => import('./appointment').then((module) => module.appointment),
  syllabus: () => import('./syllabus').then((module) => module.syllabus),
  evaluation: () => import('./evaluation').then((module) => module.evaluation),
  recruitment: () => import('./recruitment').then((module) => module.recruitment),
  'job-application': () => import('./job-application').then((module) => module.jobApplication),
  'interview-evaluation': () =>
    import('./interview-evaluation').then((module) => module.interviewEvaluation),
  'offer-notice': () => import('./offer-notice').then((module) => module.offerNotice),
  rfq: () => import('./rfq').then((module) => module.rfq),
  inspection: () => import('./inspection').then((module) => module.inspection),
  'defect-request': () => import('./defect-request').then((module) => module.defectRequest),
  'vendor-evaluation': () =>
    import('./vendor-evaluation').then((module) => module.vendorEvaluation),
};

export async function loadForm(slug: string): Promise<FormTemplate | null> {
  const loader = LOADERS[slug];
  if (!loader) return null;
  try {
    return await loader();
  } catch {
    return null;
  }
}
