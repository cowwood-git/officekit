import { formatKoreanAmount } from '@/lib/doc/format';
import type { FormBlock, FormField, FormTemplate } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const approvalDefault = JSON.stringify([
  { label: '담당', enabled: true },
  { label: '팀장', enabled: false },
  { label: '부서장', enabled: true },
  { label: '본부장', enabled: false },
  { label: '대표', enabled: true },
]);

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'A-20261115-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '작성일',
    type: 'date',
    group: '문서',
    defaultToday: true,
    required: true,
  },
  {
    id: 'name',
    label: '성명',
    type: 'text',
    group: '기안자',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '기안자',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'position',
    label: '직위',
    type: 'text',
    group: '기안자',
    placeholder: '대리',
    maxLength: 30,
  },
  {
    id: 'title',
    label: '건명',
    type: 'text',
    group: '품의 정보',
    placeholder: '예: 11월 팀 워크숍 운영비 품의',
    required: true,
    maxLength: 80,
    span: 3,
  },
  {
    id: 'category',
    label: '구분',
    type: 'select',
    group: '품의 정보',
    options: ['지출', '구매', '계약', '기타'],
    defaultValue: '지출',
  },
  {
    id: 'amount',
    label: '금액',
    type: 'text',
    group: '품의 정보',
    placeholder: '예: 1,200,000',
    required: true,
    maxLength: 20,
  },
  {
    id: 'executeDate',
    label: '집행 예정일',
    type: 'date',
    group: '품의 정보',
  },
  {
    id: 'counterparty',
    label: '거래처',
    type: 'text',
    group: '품의 정보',
    placeholder: '예: 옷깃컨벤션',
    maxLength: 60,
  },
  {
    id: 'budgetAccount',
    label: '예산 과목',
    type: 'text',
    group: '품의 정보',
    placeholder: '예: 교육훈련비',
    maxLength: 40,
  },
  {
    id: 'purpose',
    label: '품의 내용',
    type: 'textarea',
    group: '내용',
    placeholder: '무엇을, 왜, 어떻게 집행할지 적습니다.',
    required: true,
    rows: 5,
    maxLength: 800,
    span: 3,
  },
  {
    id: 'expectedEffect',
    label: '기대 효과',
    type: 'textarea',
    group: '내용',
    placeholder: '이번 품의로 얻고자 하는 결과',
    rows: 2,
    maxLength: 300,
    span: 3,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '내용',
    placeholder: '첨부 자료, 특이 사항',
    rows: 2,
    maxLength: 300,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['담당', '팀장', '부서장', '본부장', '대표'],
    defaultValue: approvalDefault,
    required: true,
    maxSelected: 5,
    editable: true,
    help: '최대 5개까지 선택할 수 있고, 이름을 직접 고칠 수 있습니다. 선택한 순서대로 문서에 표시됩니다.',
    span: 3,
  },
];

const headerBlock: FormBlock = {
  kind: 'header',
  variant: 'editorial',
  title: '품의서',
  docNoField: 'docNo',
  dateField: 'date',
  logo: true,
};

const signatureBlock: FormBlock = {
  kind: 'signature',
  roles: ['담당', '부서장', '대표'],
  rolesField: 'approvalRoles',
  bottom: true,
};

const blocks: FormBlock[] = [
  headerBlock,
  { kind: 'section', title: '기안자' },
  {
    kind: 'kv',
    columns: 3,
    rows: [
      { label: '성명', field: 'name' },
      { label: '부서', field: 'department' },
      { label: '직위', field: 'position' },
    ],
  },
  { kind: 'section', title: '품의 정보' },
  {
    kind: 'kv',
    columns: 1,
    rows: [{ label: '건명', field: 'title' }],
  },
  {
    kind: 'kv',
    columns: 3,
    rows: [
      { label: '구분', field: 'category' },
      { label: '금액', field: 'amountLabel' },
      { label: '집행 예정일', field: 'executeDate' },
    ],
  },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '거래처', field: 'counterparty' },
      { label: '예산 과목', field: 'budgetAccount' },
    ],
  },
  {
    kind: 'kv',
    columns: 1,
    rows: [{ label: '일금', field: 'amountKorean' }],
  },
  { kind: 'section', title: '품의 내용' },
  { kind: 'text', field: 'purpose', minLines: 5 },
  { kind: 'section', title: '기대 효과·비고' },
  { kind: 'text', label: '기대 효과', field: 'expectedEffect', minLines: 2 },
  { kind: 'text', label: '비고', field: 'note', minLines: 2 },
  signatureBlock,
];

export const approvalRequest: FormTemplate = {
  slug: 'approval-request',
  title: '품의서',
  family: 'finance',
  category: 'money',
  description:
    '지출·구매·계약을 사전에 결재받는 품의서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 입력한 내용은 서버로 전송되지 않습니다.',
  keywords: ['품의서 양식', '품의서 PDF', '품의서 만들기', '지출 품의서', '구매 품의서'],
  updated: '2026-11-15',
  docPrefix: 'A',
  lead: '지출·구매·계약을 사전에 결재받는 품의서입니다. 건명·금액·집행 예정일과 사유를 한 장에 정리하고, 결재선은 1~5명까지 이름을 직접 고칠 수 있습니다.',
  useCases: [
    '팀 워크숍·행사 비용을 미리 결재받을 때',
    '물품 구매나 용역 계약을 올릴 때',
    '예산 집행 전에 사유와 금액을 남길 때',
    '인쇄해서 결재란에 서명을 받을 때',
  ],
  howTo: [
    '문서 번호와 작성일, 기안자 정보를 확인합니다.',
    '건명·구분·금액·집행 예정일·거래처·예산 과목을 입력합니다.',
    '품의 내용과 기대 효과를 적고, 금액과 일금 표기를 확인합니다.',
    '결재선을 1~5명까지 선택한 뒤 PDF로 내려받습니다.',
  ],
  notes: [
    '이 문서는 참고용입니다. 실제 품의·결재 절차는 회사의 내부 규정과 예산 기준을 따르세요.',
    '금액은 부가세 포함·별도 여부를 비고나 품의 내용에 함께 적는 것이 좋습니다.',
    '견적서·거래명세서 같은 첨부 자료는 PDF 합치기로 이 문서 뒤에 붙일 수 있습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  blocks,
  sample: {
    docNo: 'A-20261115-001',
    date: '2026-11-15',
    name: '김옷깃',
    department: '경영지원팀',
    position: '대리',
    title: '11월 팀 워크숍 운영비 품의',
    category: '지출',
    amount: '1200000',
    executeDate: '2026-11-28',
    counterparty: '옷깃컨벤션',
    budgetAccount: '교육훈련비',
    purpose:
      '11월 28일 팀 워크숍 운영을 위해 장소 대관·식사·교통비를 집행하고자 합니다. 예상 인원은 12명이며, 견적서 기준 금액은 부가세 포함 1,200,000원입니다.',
    expectedEffect: '연말 목표를 공유하고 팀원 간 협업 방식을 정리합니다.',
    note: '견적서 1부, 참석자 명단 1부 첨부 예정',
  },
  compute: (values) => {
    const amount = parseAmount(values.amount ?? '');
    return {
      amountLabel: amount > 0 ? formatWon(amount) : '',
      amountKorean: amount > 0 ? formatKoreanAmount(amount) : '',
    };
  },
  validate: (values) => {
    const amount = parseAmount(values.amount ?? '');
    return amount > 0 ? [] : ['금액은 1원 이상이어야 합니다.'];
  },
  faq: [
    {
      q: '품의서와 지출결의서는 무엇이 다른가요?',
      a: '품의서는 지출·구매·계약을 하기 전에 사전 승인을 받는 문서이고, 지출결의서는 실제 지출이 발생한 뒤 내역과 증빙을 정리하는 문서입니다.',
    },
    {
      q: '금액은 부가세 포함으로 적어야 하나요?',
      a: '회사의 회계 기준에 맞춰 적되, 부가세 포함·별도 여부를 품의 내용이나 비고에 함께 적으면 혼동을 줄일 수 있습니다.',
    },
    {
      q: '결재선은 어떻게 바꾸나요?',
      a: '최대 5명까지 체크할 수 있고, 각 줄의 이름을 직접 고칠 수 있습니다. 체크한 순서대로 문서 서명란에 표시됩니다.',
    },
    {
      q: '견적서를 첨부할 수 있나요?',
      a: '이 양식은 품의서 한 장을 만듭니다. 견적서·거래명세서는 PDF 합치기로 이 문서 뒤에 붙이거나, 인쇄 후 함께 첨부하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다.',
    },
  ],
  sources: [
    {
      label: '행정안전부 — 문서 관리 안내',
      href: 'https://www.mois.go.kr/',
    },
    {
      label: '국세청 — 증빙서류 안내',
      href: 'https://www.nts.go.kr/',
    },
  ],
  related: [
    { label: '지출결의서', href: '/forms/expense-report/' },
    { label: '발주서', href: '/forms/purchase-order/' },
    { label: 'PDF 합치기', href: '/tools/pdf-merge/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
