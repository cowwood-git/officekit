import { formatKoreanAmount } from '@/lib/doc/format';
import type { FormBlock, FormField, FormTemplate } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const fields: FormField[] = [
  { id: 'docNo', label: '문서 번호', type: 'text', group: '문서', placeholder: 'DP-20261118-001' },
  { id: 'date', label: '거래일', type: 'date', group: '문서', defaultToday: true, required: true },
  {
    id: 'account',
    label: '계정과목',
    type: 'text',
    group: '입금 정보',
    placeholder: '예: 외상매출금',
    required: true,
    maxLength: 40,
  },
  {
    id: 'amount',
    label: '금액',
    type: 'text',
    group: '입금 정보',
    placeholder: '330000',
    required: true,
    maxLength: 20,
  },
  { id: 'amountLabel', label: '금액 표시', type: 'computed', group: '입금 정보' },
  {
    id: 'depositor',
    label: '입금처',
    type: 'text',
    group: '입금 정보',
    placeholder: '거래처 주식회사',
    maxLength: 60,
  },
  {
    id: 'bank',
    label: '입금 계좌',
    type: 'text',
    group: '입금 정보',
    placeholder: '예: 국민은행 123-456-789',
    maxLength: 80,
  },
  {
    id: 'description',
    label: '적요',
    type: 'textarea',
    group: '내용',
    placeholder: '입금 내용과 거래 조건',
    maxLength: 300,
    rows: 3,
    span: 3,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '증빙·승인 관련 메모',
    maxLength: 200,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명',
    type: 'roles',
    group: '서명',
    options: ['작성자', '확인자', '승인자'],
    defaultValue: JSON.stringify([
      { label: '작성자', enabled: true },
      { label: '확인자', enabled: true },
      { label: '승인자', enabled: true },
    ]),
    required: true,
    maxSelected: 3,
    editable: true,
    span: 3,
  },
];

const blocks: FormBlock[] = [
  { kind: 'paragraph', text: '입금전표', align: 'center', size: 16, bold: true, after: 1 },
  {
    kind: 'paragraph',
    text: 'DEPOSIT SLIP',
    align: 'center',
    size: 6.5,
    bold: true,
    color: '#0B6B5B',
    after: 5,
  },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '문서번호', field: 'docNo' },
      { label: '거래일', field: 'date' },
    ],
  },
  { kind: 'section', title: '입금 정보' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '계정과목', field: 'account' },
      { label: '금액', field: 'amountLabel' },
    ],
  },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '입금처', field: 'depositor' },
      { label: '입금 계좌', field: 'bank' },
    ],
  },
  { kind: 'section', title: '내용' },
  { kind: 'text', field: 'description', minLines: 3 },
  { kind: 'section', title: '금액' },
  {
    kind: 'totals',
    rows: [
      { label: '입금액', field: 'amountLabel', strong: true },
      { label: '일금', field: 'amountKorean' },
    ],
    width: 82,
  },
  { kind: 'section', title: '비고' },
  { kind: 'text', field: 'note', minLines: 2 },
  {
    kind: 'signature',
    roles: ['작성자', '확인자', '승인자'],
    rolesField: 'approvalRoles',
    bottom: true,
  },
];

export const depositSlip: FormTemplate = {
  slug: 'deposit-slip',
  title: '입금전표',
  family: 'finance',
  category: 'money',
  description:
    '입금처·계정과목·금액·적요를 A4 안에 실제 입금전표 크기(106×190mm)로 인쇄하는 양식입니다.',
  keywords: ['입금전표', '입금전표 양식', '입금전표 PDF', '회계 전표', '입금 확인'],
  updated: '2026-11-18',
  docPrefix: 'DP',
  companyParty: 'supplier',
  sheet: { width: 106, height: 190, scale: 0.9 },
  showFooter: false,
  lead: '입금 사실과 계정과목, 적요를 한 장에 남기는 입금전표입니다. A4에 실제 전표 크기로 중앙 배치됩니다.',
  useCases: [
    '입금 내역을 회계 전표로 남길 때',
    '거래처 입금을 확인할 때',
    '계정과목과 적요를 정리할 때',
    '증빙과 승인을 함께 보관할 때',
  ],
  howTo: [
    '거래일과 계정과목을 적습니다.',
    '입금액과 입금처·계좌를 입력합니다.',
    '적요와 비고를 정리합니다.',
    'PDF로 내려받아 A4에 100% 크기로 인쇄합니다.',
  ],
  notes: [
    'A4에 106×190mm 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '한글(HWPX)은 A4 기본 여백으로 만들어집니다. 실제 전표 크기로 인쇄하려면 PDF를 사용하세요.',
    '회사 계정과목 체계에 맞춰 항목을 조정하세요.',
    '입금액과 실제 통장 거래 내역을 대조하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  blocks,
  compute: (values) => {
    const amount = parseAmount(values.amount ?? '');
    return {
      amountLabel: amount > 0 ? formatWon(amount) : '',
      amountKorean: amount > 0 ? formatKoreanAmount(amount) : '',
    };
  },
  validate: (values) => {
    const amount = parseAmount(values.amount ?? '');
    return !values.amount?.trim()
      ? ['금액을 입력하세요.']
      : amount > 0
        ? []
        : ['금액은 1원 이상이어야 합니다.'];
  },
  sample: {
    docNo: 'DP-20261118-001',
    date: '2026-11-18',
    account: '외상매출금',
    amount: '330000',
    depositor: '거래처 주식회사',
    bank: '국민은행 123-456-789',
    description: '11월 사무용품 납품 대금 입금',
    note: '세금계산서 발행 완료',
  },
  faq: [
    {
      q: '입금전표와 입금확인서는 무엇이 다른가요?',
      a: '입금전표는 회계 처리를 위한 내부 전표이고, 입금확인서는 거래처에 입금 사실을 알리는 문서입니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '106×190mm 크기로 A4 중앙에 배치됩니다. 인쇄 배율을 100%로 두세요.',
    },
    {
      q: '계정과목은 어떻게 적나요?',
      a: '회사에서 쓰는 계정과목을 적습니다. 예: 외상매출금, 보통예금, 가지급금.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성은 브라우저 안에서 이루어집니다.',
    },
  ],
  sources: [{ label: '국세청 — 증빙·장부 안내', href: 'https://www.nts.go.kr/' }],
  related: [
    { label: '입금확인서 양식', href: '/forms/payment-confirmation/' },
    { label: '간이영수증 양식', href: '/forms/receipt/' },
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
