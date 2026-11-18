import type { FormBlock, FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, itemAmount, parseAmount } from '@/lib/quote';

const partyFields = (prefix: 'supplier' | 'buyer', label: string): FormField[] => [
  {
    id: `${prefix}Company`,
    label: '상호',
    type: 'text',
    group: label,
    required: true,
    placeholder: prefix === 'supplier' ? '옷깃' : '거래처',
    maxLength: 60,
  },
  {
    id: `${prefix}Biz`,
    label: '사업자번호',
    type: 'text',
    group: label,
    placeholder: '000-00-00000',
    maxLength: 20,
  },
  {
    id: `${prefix}Ceo`,
    label: '대표자',
    type: 'text',
    group: label,
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: `${prefix}Address`,
    label: '주소',
    type: 'text',
    group: label,
    placeholder: '주소',
    maxLength: 120,
    span: 2,
  },
];

const items: RepeatGroup = {
  id: 'items',
  label: '품목',
  group: '품목',
  help: '품목·수량·단가를 적으면 금액과 합계가 계산됩니다.',
  minRows: 1,
  maxRows: 12,
  addLabel: '+ 품목 추가',
  required: true,
  summaryField: 'totalLabel',
  summaryLabel: '합계',
  columns: [
    {
      id: 'name',
      label: '품목',
      type: 'text',
      required: true,
      placeholder: '품목명',
      maxLength: 60,
      width: 2.6,
    },
    { id: 'quantity', label: '수량', type: 'number', placeholder: '1', width: 0.9 },
    { id: 'unitPrice', label: '단가', type: 'money', placeholder: '0', width: 1.4 },
    { id: 'amount', label: '금액', type: 'computed', align: 'right', width: 1.4 },
  ],
  computeRow: (row) => {
    const amount = itemAmount({
      name: row.name ?? '',
      quantity: Number(row.quantity ?? 0),
      unitPrice: parseAmount(row.unitPrice ?? ''),
    });
    return { amount: amount > 0 ? formatWon(amount) : '' };
  },
};

const fields: FormField[] = [
  { id: 'docNo', label: '문서 번호', type: 'text', group: '문서', placeholder: 'TS-20261118-001' },
  { id: 'date', label: '거래일', type: 'date', group: '문서', defaultToday: true, required: true },
  ...partyFields('supplier', '공급자'),
  ...partyFields('buyer', '공급받는자'),
  { id: 'supplyLabel', label: '공급가액', type: 'computed', group: '품목' },
  { id: 'taxLabel', label: '세액', type: 'computed', group: '품목' },
  { id: 'totalLabel', label: '합계', type: 'computed', group: '품목' },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '납품·입금 조건',
    maxLength: 200,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['공급자', '공급받는자'],
    defaultValue: JSON.stringify([
      { label: '공급자', enabled: true },
      { label: '공급받는자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    span: 3,
  },
];

const toItems = (rows: FormRows) =>
  (rows.items ?? [])
    .filter((row) => (row.name ?? '').trim())
    .map((row) => ({
      name: (row.name ?? '').trim(),
      quantity: Number(row.quantity ?? 0),
      unitPrice: parseAmount(row.unitPrice ?? ''),
    }));

const blocks: FormBlock[] = [
  { kind: 'paragraph', text: '거래명세표', align: 'center', size: 12, bold: true, after: 1 },
  {
    kind: 'paragraph',
    text: 'TRANSACTION STATEMENT',
    align: 'center',
    size: 6.5,
    bold: true,
    color: '#0B6B5B',
    after: 3,
  },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '문서번호', field: 'docNo' },
      { label: '거래일', field: 'date' },
    ],
  },
  { kind: 'section', title: '공급자' },
  {
    kind: 'kv',
    columns: 1,
    rows: [
      { label: '상호', field: 'supplierCompany' },
      { label: '사업자번호', field: 'supplierBiz' },
      { label: '대표자', field: 'supplierCeo' },
      { label: '주소', field: 'supplierAddress' },
    ],
  },
  { kind: 'section', title: '공급받는자' },
  {
    kind: 'kv',
    columns: 1,
    rows: [
      { label: '상호', field: 'buyerCompany' },
      { label: '사업자번호', field: 'buyerBiz' },
      { label: '대표자', field: 'buyerCeo' },
      { label: '주소', field: 'buyerAddress' },
    ],
  },
  { kind: 'section', title: '품목' },
  {
    kind: 'table',
    columns: [
      { label: '품목', width: 34 },
      { label: '수량', width: 10, align: 'right' },
      { label: '단가', width: 17, align: 'right' },
      { label: '금액', width: 24, align: 'right' },
    ],
    rows: (_v, rows) =>
      toItems(rows).map((row) => [
        row.name,
        row.quantity ? String(row.quantity) : '',
        row.unitPrice ? formatWon(row.unitPrice) : '',
        formatWon(itemAmount(row)),
      ]),
    minRows: 2,
  },
  {
    kind: 'totals',
    rows: [
      { label: '공급가액', field: 'supplyLabel' },
      { label: '세액', field: 'taxLabel' },
      { label: '합계', field: 'totalLabel', strong: true },
    ],
    width: 60,
  },
  {
    kind: 'paragraph',
    field: 'note',
    size: 6.5,
    color: '#5B6472',
    before: 2,
    after: 2,
  },
  { kind: 'signature', roles: ['공급자', '공급받는자'], rolesField: 'approvalRoles' },
];

export const transactionStatement: FormTemplate = {
  slug: 'transaction-statement',
  title: '거래명세표',
  family: 'finance',
  category: 'money',
  description:
    '공급자·공급받는자·품목·금액을 A4 안에 실제 거래명세표 크기(85×187mm)로 인쇄하는 양식입니다.',
  keywords: ['거래명세표', '거래명세표 양식', '거래명세표 PDF', '거래 내역서', '납품명세표'],
  updated: '2026-11-18',
  docPrefix: 'TS',
  companyParty: 'supplier',
  sheet: { width: 85, height: 187, scale: 0.68 },
  showFooter: false,
  lead: '거래한 품목과 금액을 좁은 전표 형식으로 정리하는 거래명세표입니다. A4에 실제 전표 크기로 중앙 배치됩니다.',
  useCases: [
    '거래명세표를 A4에 인쇄할 때',
    '납품 품목과 금액을 확인할 때',
    '공급자·공급받는자가 함께 확인할 때',
    '간단한 거래 내역을 남길 때',
  ],
  howTo: [
    '거래일과 공급자·공급받는자 정보를 적습니다.',
    '품목·수량·단가를 입력합니다.',
    '합계와 확인란을 확인합니다.',
    'PDF로 내려받아 A4에 100% 크기로 인쇄합니다.',
  ],
  notes: [
    'A4에 85×187mm 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '한글(HWPX)은 A4 기본 여백으로 만들어집니다. 실제 전표 크기로 인쇄하려면 PDF를 사용하세요.',
    '품목이 많으면 A4 한 장을 넘을 수 있으니 미리보기를 확인하세요.',
    '세금계산서가 필요한 거래는 세금계산서를 별도로 발급하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  groups: [items],
  blocks,
  compute: (_v, rows) => {
    const supply = toItems(rows).reduce((sum, row) => sum + itemAmount(row), 0);
    const tax = Math.round(supply * 0.1);
    return {
      supplyLabel: formatWon(supply),
      taxLabel: formatWon(tax),
      totalLabel: formatWon(supply + tax),
    };
  },
  validate: (_v, rows) => (toItems(rows).length === 0 ? ['품목을 한 줄 이상 입력하세요.'] : []),
  sample: {
    docNo: 'TS-20261118-001',
    date: '2026-11-18',
    supplierCompany: '옷깃 주식회사',
    supplierBiz: '123-45-67891',
    supplierCeo: '박대표',
    supplierAddress: '서울시 강남구 테헤란로 1',
    buyerCompany: '거래처 주식회사',
    buyerBiz: '220-81-62517',
    buyerCeo: '김대표',
    buyerAddress: '부산시 해운대구 센텀중앙로 90',
    note: '납품 후 14일 이내 입금',
  },
  sampleRows: {
    items: [
      { name: '사무용품', quantity: '10', unitPrice: '30000' },
      { name: '토너', quantity: '2', unitPrice: '80000' },
    ],
  },
  faq: [
    {
      q: '거래명세표와 거래명세서는 무엇이 다른가요?',
      a: '거래명세표는 좁은 전표 형식, 거래명세서는 A4 문서 형식이 일반적입니다. 제출처가 요구하는 형식을 확인하세요.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '85×187mm 크기로 A4 중앙에 배치됩니다. 인쇄 배율을 100%로 두세요.',
    },
    {
      q: '세금계산서 대신 쓸 수 있나요?',
      a: '아니요. 세금계산서가 필요한 거래는 세금계산서를 별도로 발급해야 합니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성은 브라우저 안에서 이루어집니다.',
    },
  ],
  sources: [{ label: '국세청 — 전자세금계산서 안내', href: 'https://www.hometax.go.kr/' }],
  related: [
    { label: '세금계산서 양식', href: '/forms/tax-invoice/' },
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: '입금전표 양식', href: '/forms/deposit-slip/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
