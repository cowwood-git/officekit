import type { FormBlock, FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, itemAmount, parseAmount } from '@/lib/quote';

const supplierFields: FormField[] = [
  {
    id: 'supplierCompany',
    label: '상호',
    type: 'text',
    group: '공급자',
    required: true,
    placeholder: '옷깃 주식회사',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'supplierBiz',
    label: '사업자번호',
    type: 'text',
    group: '공급자',
    placeholder: '000-00-00000',
    maxLength: 20,
  },
  {
    id: 'supplierCeo',
    label: '대표자',
    type: 'text',
    group: '공급자',
    placeholder: '박대표',
    maxLength: 30,
  },
  {
    id: 'supplierAddress',
    label: '주소',
    type: 'text',
    group: '공급자',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'supplierContact',
    label: '연락처',
    type: 'text',
    group: '공급자',
    placeholder: '02-123-4567',
    maxLength: 40,
  },
];

const buyerFields: FormField[] = [
  {
    id: 'buyerCompany',
    label: '상호',
    type: 'text',
    group: '공급받는자',
    required: true,
    placeholder: '거래처 주식회사',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'buyerBiz',
    label: '사업자번호',
    type: 'text',
    group: '공급받는자',
    placeholder: '000-00-00000',
    maxLength: 20,
  },
  {
    id: 'buyerCeo',
    label: '대표자',
    type: 'text',
    group: '공급받는자',
    placeholder: '김대표',
    maxLength: 30,
  },
  {
    id: 'buyerAddress',
    label: '주소',
    type: 'text',
    group: '공급받는자',
    placeholder: '부산시 해운대구 센텀중앙로 90',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'buyerContact',
    label: '연락처',
    type: 'text',
    group: '공급받는자',
    placeholder: '051-123-4567',
    maxLength: 40,
  },
];

const items: RepeatGroup = {
  id: 'items',
  label: '품목',
  group: '품목',
  help: '품목·수량·단가를 적으면 공급가액과 세액이 자동 계산됩니다.',
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
      placeholder: '예: 사무용품',
      maxLength: 60,
      width: 2.4,
    },
    { id: 'spec', label: '규격', type: 'text', placeholder: 'A4', maxLength: 30, width: 1 },
    { id: 'quantity', label: '수량', type: 'number', placeholder: '1', width: 0.8 },
    { id: 'unitPrice', label: '단가', type: 'money', placeholder: '0', width: 1.2 },
    { id: 'amount', label: '공급가액', type: 'computed', align: 'right', width: 1.4 },
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
  { id: 'docNo', label: '문서 번호', type: 'text', group: '문서', placeholder: 'TI-20261118-001' },
  { id: 'date', label: '작성일', type: 'date', group: '문서', defaultToday: true, required: true },
  {
    id: 'issueType',
    label: '구분',
    type: 'select',
    group: '문서',
    options: ['영수', '청구'],
    defaultValue: '영수',
  },
  ...supplierFields,
  ...buyerFields,
  { id: 'supplyLabel', label: '공급가액', type: 'computed', group: '품목' },
  { id: 'taxLabel', label: '세액', type: 'computed', group: '품목' },
  { id: 'totalLabel', label: '합계', type: 'computed', group: '품목' },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '거래 조건·특약 사항',
    maxLength: 200,
    rows: 3,
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

const itemRows = (rows: FormRows): readonly (readonly string[])[] =>
  toItems(rows).map((row) => [
    row.name,
    '',
    row.quantity ? String(row.quantity) : '',
    row.unitPrice ? formatWon(row.unitPrice) : '',
    formatWon(itemAmount(row)),
  ]);

const blocks: FormBlock[] = [
  { kind: 'paragraph', text: '세금계산서', align: 'center', size: 14, bold: true, after: 0.5 },
  {
    kind: 'paragraph',
    text: 'TAX INVOICE',
    align: 'center',
    size: 7,
    bold: true,
    color: '#0B6B5B',
    after: 4,
  },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '문서번호', field: 'docNo' },
      { label: '작성일', field: 'date' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '구분', field: 'issueType' }] },
  { kind: 'section', title: '공급자' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '상호', field: 'supplierCompany' },
      { label: '사업자번호', field: 'supplierBiz' },
    ],
  },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '대표자', field: 'supplierCeo' },
      { label: '연락처', field: 'supplierContact' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '주소', field: 'supplierAddress' }] },
  { kind: 'section', title: '공급받는자' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '상호', field: 'buyerCompany' },
      { label: '사업자번호', field: 'buyerBiz' },
    ],
  },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '대표자', field: 'buyerCeo' },
      { label: '연락처', field: 'buyerContact' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '주소', field: 'buyerAddress' }] },
  { kind: 'section', title: '품목' },
  {
    kind: 'table',
    columns: [
      { label: '품목', width: 50 },
      { label: '규격', width: 16 },
      { label: '수량', width: 14, align: 'right' },
      { label: '단가', width: 22, align: 'right' },
      { label: '공급가액', width: 26, align: 'right' },
    ],
    rows: (_values, rows) => itemRows(rows),
    minRows: 2,
  },
  {
    kind: 'totals',
    rows: [
      { label: '공급가액', field: 'supplyLabel' },
      { label: '세액', field: 'taxLabel' },
      { label: '합계', field: 'totalLabel', strong: true },
    ],
    width: 74,
  },
  {
    kind: 'paragraph',
    field: 'note',
    size: 7,
    color: '#5B6472',
    before: 2,
    after: 0,
  },
];

export const taxInvoice: FormTemplate = {
  slug: 'tax-invoice',
  title: '세금계산서',
  family: 'finance',
  category: 'money',
  description:
    '공급자·공급받는자·품목·공급가액·세액을 정리해 A4 안에 실제 세금계산서 크기(128×182mm)로 인쇄하는 양식입니다.',
  keywords: [
    '세금계산서',
    '세금계산서 양식',
    '세금계산서 PDF',
    '부가세 계산서',
    '거래명세서 세금계산서',
  ],
  updated: '2026-11-18',
  docPrefix: 'TI',
  companyParty: 'supplier',
  sheet: { width: 128, height: 182, scale: 0.76 },
  showFooter: false,
  lead: '공급자와 공급받는자, 품목별 공급가액·세액을 한 장에 정리하는 세금계산서입니다. A4에 실제 전표 크기로 중앙 배치해 인쇄할 수 있습니다.',
  useCases: [
    '종이 세금계산서 서식을 A4에 인쇄할 때',
    '거래 내역과 부가세를 한 장으로 확인할 때',
    '공급자·공급받는자 정보를 함께 남길 때',
    '세금계산서 발급 전 내용을 검토할 때',
  ],
  howTo: [
    '작성일과 문서 번호, 영수·청구 구분을 확인합니다.',
    '공급자와 공급받는자의 사업자 정보를 적습니다.',
    '품목·수량·단가를 입력하면 공급가액과 세액이 계산됩니다.',
    'PDF로 내려받아 A4에 실제 크기로 인쇄합니다.',
  ],
  notes: [
    '실제 세금계산서 발급은 홈택스 전자세금계산서가 원칙입니다. 이 양식은 종이 서식 작성·검토용입니다.',
    '사업자번호와 공급가액·세액을 발급 전에 반드시 확인하세요.',
    'A4에 128×182mm 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '한글(HWPX)은 A4 기본 여백으로 만들어집니다. 실제 전표 크기로 인쇄하려면 PDF를 사용하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  groups: [items],
  blocks,
  compute: (_values, rows) => {
    const supply = toItems(rows).reduce((sum, row) => sum + itemAmount(row), 0);
    const tax = Math.round(supply * 0.1);
    return {
      supplyLabel: formatWon(supply),
      taxLabel: formatWon(tax),
      totalLabel: formatWon(supply + tax),
    };
  },
  validate: (_values, rows) =>
    toItems(rows).length === 0 ? ['품목을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'TI-20261118-001',
    date: '2026-11-18',
    issueType: '영수',
    supplierCompany: '옷깃 주식회사',
    supplierBiz: '123-45-67891',
    supplierCeo: '박대표',
    supplierAddress: '서울시 강남구 테헤란로 1',
    supplierContact: '02-123-4567',
    buyerCompany: '거래처 주식회사',
    buyerBiz: '220-81-62517',
    buyerCeo: '김대표',
    buyerAddress: '부산시 해운대구 센텀중앙로 90',
    buyerContact: '051-123-4567',
    note: '납품 후 14일 이내 입금',
  },
  sampleRows: {
    items: [
      { name: '사무용품', spec: 'A4', quantity: '10', unitPrice: '30000' },
      { name: '토너 카트리지', spec: '흑백', quantity: '2', unitPrice: '80000' },
    ],
  },
  faq: [
    {
      q: '이 PDF로 세금계산서를 발급할 수 있나요?',
      a: '아니요. 이 양식은 종이 서식 작성·검토용입니다. 실제 발급은 홈택스 전자세금계산서를 이용하세요.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: 'A4 한 장 안에 128×182mm 크기로 중앙 배치됩니다. 인쇄 배율을 100%로 두고 여백 없이 인쇄하세요.',
    },
    {
      q: '세액은 어떻게 계산되나요?',
      a: '공급가액의 10%로 계산합니다. 실제 세율·면세 여부는 거래 조건과 세법을 확인하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성은 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다.',
    },
  ],
  sources: [
    { label: '국세청 — 전자세금계산서 안내', href: 'https://www.hometax.go.kr/' },
    { label: '국가법령정보센터 — 부가가치세법', href: 'https://www.law.go.kr/' },
  ],
  related: [
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: '거래명세표 양식', href: '/forms/transaction-statement/' },
    { label: '입금전표 양식', href: '/forms/deposit-slip/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
