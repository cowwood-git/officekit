import { formatKoreanAmount } from '@/lib/doc/format';
import type { FormField, FormTemplate } from '@/lib/doc/types';
import { annualRateFrom, MAX_INTEREST_RATE } from '@/lib/labor-limits';
import { formatWon, parseAmount } from '@/lib/quote';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'LN-20261117-001',
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
    id: 'lender',
    label: '대여자',
    type: 'text',
    group: '당사자',
    required: true,
    placeholder: '예: 김대여',
    maxLength: 40,
  },
  {
    id: 'lenderContact',
    label: '대여자 연락처',
    type: 'text',
    group: '당사자',
    placeholder: '010-1234-5678',
    maxLength: 40,
  },
  {
    id: 'borrower',
    label: '차용자',
    type: 'text',
    group: '당사자',
    required: true,
    placeholder: '예: 이차용',
    maxLength: 40,
  },
  {
    id: 'borrowerContact',
    label: '차용자 연락처',
    type: 'text',
    group: '당사자',
    placeholder: '010-2222-3333',
    maxLength: 40,
  },
  {
    id: 'loanDate',
    label: '차용일',
    type: 'date',
    group: '차용 내용',
    required: true,
  },
  {
    id: 'dueDate',
    label: '상환일',
    type: 'date',
    group: '차용 내용',
    required: true,
  },
  {
    id: 'amount',
    label: '차용 금액',
    type: 'text',
    group: '차용 내용',
    required: true,
    placeholder: '5,000,000',
    maxLength: 20,
  },
  {
    id: 'amountLabel',
    label: '금액 표시',
    type: 'computed',
    group: '차용 내용',
    help: '입력한 금액을 원 단위로 표시합니다.',
  },
  {
    id: 'amountKorean',
    label: '일금',
    type: 'computed',
    group: '차용 내용',
    help: '차용 금액을 한글로 표시합니다.',
    span: 2,
  },
  {
    id: 'interest',
    label: '이자',
    type: 'text',
    group: '차용 내용',
    placeholder: '예: 연 5%, 없음',
    help: '이자제한법상 최고이자율은 연 20%입니다. 월 이율로 적으면 12를 곱해 비교합니다.',
    maxLength: 60,
  },
  {
    id: 'repayment',
    label: '상환 방법',
    type: 'text',
    group: '차용 내용',
    placeholder: '예: 만기 일시 상환, 계좌 이체',
    maxLength: 80,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '차용 목적, 담보, 특약 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명 당사자',
    type: 'roles',
    group: '서명',
    options: ['대여자', '차용자'],
    defaultValue: JSON.stringify([
      { label: '대여자', enabled: true },
      { label: '차용자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '서명란에 표시할 당사자 이름입니다.',
    span: 3,
  },
];

export const loanNote: FormTemplate = {
  slug: 'loan-note',
  title: '차용증',
  family: 'admin',
  category: 'money',
  description:
    '금전을 빌리고 갚는 조건을 문서로 남기는 차용증을 브라우저에서 작성하고 A4 PDF로 저장합니다. 금액·일금·상환일·이자를 정리합니다.',
  keywords: ['차용증', '차용증 양식', '금전 차용증', '개인 차용증', '차용증 PDF', '차용증 작성'],
  updated: '2026-11-17',
  docPrefix: 'LN',
  lead: '금전을 빌릴 때 금액과 상환일, 이자, 상환 방법을 남기는 차용증입니다. 금액과 일금을 자동으로 표시하고 양 당사자 서명란을 제공합니다.',
  useCases: [
    '지인·가족 간 금전 거래를 기록할 때',
    '개인 간 차용 조건을 문서로 남길 때',
    '상환일과 이자를 명확히 정할 때',
    '분쟁 예방을 위해 증빙을 만들 때',
  ],
  howTo: [
    '문서 번호와 작성일, 대여자·차용자 정보를 확인합니다.',
    '차용일과 상환일, 차용 금액을 입력합니다.',
    '이자와 상환 방법을 적습니다.',
    'PDF로 내려받아 양 당사자가 서명·날인합니다.',
  ],
  notes: [
    '개인 간 금전대차의 최고이자율은 연 20%입니다(이자제한법 제2조, 2021년 7월 7일 시행). 넘는 부분은 무효이며, 원금 10만 원 미만에는 적용되지 않습니다.',
    '이자를 정했지만 이율을 적지 않으면 연 5%(민법 제379조)가 적용됩니다. 큰 금액은 법률 검토를 권장합니다.',
    '금액은 실제 송금 내역과 일치해야 하며, 계좌 이체 영수증을 함께 보관하세요.',
    '차용 목적·담보·특약은 비고에 구체적으로 적습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '차용증',
      docNoField: 'docNo',
      dateField: 'date',
    },
    {
      kind: 'paragraph',
      text: '아래 금액을 차용하고, 다음과 같이 상환할 것을 확인합니다.',
      align: 'center',
      before: 2,
      after: 2,
    },
    { kind: 'section', title: '당사자' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '대여자', field: 'lender' },
        { label: '차용자', field: 'borrower' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '대여자 연락처', field: 'lenderContact' },
        { label: '차용자 연락처', field: 'borrowerContact' },
      ],
    },
    { kind: 'section', title: '차용 내용' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '차용일', field: 'loanDate' },
        { label: '상환일', field: 'dueDate' },
      ],
    },
    {
      kind: 'totals',
      rows: [
        { label: '차용 금액', field: 'amountLabel', strong: true },
        { label: '일금', field: 'amountKorean' },
      ],
      width: 90,
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '이자', field: 'interest' },
        { label: '상환 방법', field: 'repayment' },
      ],
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'notice',
      text: '본 양식은 참고용입니다. 이자율·세무 처리는 관련 법령과 전문가 검토를 확인하세요.',
    },
    {
      kind: 'signature',
      roles: ['대여자', '차용자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values) => {
    const amount = parseAmount(values.amount ?? '');
    return {
      amountLabel: amount > 0 ? formatWon(amount) : '',
      amountKorean: amount > 0 ? formatKoreanAmount(amount) : '',
    };
  },
  validate: (values) => {
    const errors: string[] = [];
    if (values.loanDate && values.dueDate && values.dueDate < values.loanDate) {
      errors.push('상환일은 차용일보다 빠를 수 없습니다.');
    }
    if (values.amount?.trim() && parseAmount(values.amount) <= 0) {
      errors.push('차용 금액은 1원 이상이어야 합니다.');
    }
    return errors;
  },
  warn: (values) => {
    const rate = annualRateFrom(values.interest);
    if (rate === null || rate <= MAX_INTEREST_RATE) return [];
    return [
      `이자가 연 ${Number(rate.toFixed(2))}%로 이자제한법의 최고이자율(연 ${MAX_INTEREST_RATE}%)을 넘습니다. 넘는 부분은 무효이고, 이미 받은 초과 이자는 원금에 충당됩니다.`,
    ];
  },
  sample: {
    docNo: 'LN-20261117-001',
    date: '2026-11-17',
    lender: '김대여',
    lenderContact: '010-1234-5678',
    borrower: '이차용',
    borrowerContact: '010-2222-3333',
    loanDate: '2026-11-18',
    dueDate: '2027-11-18',
    amount: '5000000',
    interest: '연 5%',
    repayment: '만기 일시 상환, 계좌 이체',
    note: '차용 목적: 사무실 보증금. 별도 담보는 없습니다.',
  },
  faq: [
    {
      q: '차용증과 금전소비대차계약서는 무엇이 다른가요?',
      a: '차용증은 금액과 상환 조건을 간단히 확인하는 문서이고, 금전소비대차계약서는 이자·담보·위약금 등을 더 자세히 정한 계약서입니다.',
    },
    {
      q: '이자율은 얼마까지 가능한가요?',
      a: '연 20%까지입니다(이자제한법 제2조제1항의 최고이자율에 관한 규정). 넘는 부분의 약정은 무효이고, 이미 지급한 초과 이자는 원금에 충당됩니다. 이자란에 연 20%를 넘는 이율을 적으면 입력란 위에 안내가 나타납니다.',
    },
    {
      q: '차용증만 있으면 돈을 돌려받을 수 있나요?',
      a: '차용증은 빌린 사실을 증명하는 자료가 됩니다. 송금 내역과 함께 보관하고, 큰 금액은 법률 전문가와 상담하세요.',
    },
    {
      q: '상환일을 미리 정하지 않아도 되나요?',
      a: '정하지 않으면 언제 갚아야 하는지 분쟁이 생기기 쉽습니다. 가능하면 상환일과 방법을 명확히 적으세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국가법령정보센터 — 이자제한법',
      href: 'https://www.law.go.kr/',
    },
    {
      label: '법무부 — 금전 거래 안내',
      href: 'https://www.moj.go.kr/',
    },
  ],
  related: [
    { label: '합의서 양식', href: '/forms/agreement/' },
    { label: '각서 양식', href: '/forms/memorandum/' },
    { label: '차용증 PDF 서명', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
