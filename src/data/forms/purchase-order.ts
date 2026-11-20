import type { FormBlock, FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import {
  computeTotals,
  formatWon,
  itemAmount,
  parseAmount,
  type QuoteItem,
  type VatMode,
  vatModeLabel,
} from '@/lib/quote';

type PartyPrefix = 'buyer' | 'supplier';

const approvalDefault = JSON.stringify([
  { label: '담당', enabled: true },
  { label: '팀장', enabled: false },
  { label: '부서장', enabled: true },
  { label: '본부장', enabled: false },
  { label: '대표', enabled: true },
]);

const VAT_OPTIONS = ['부가세 별도', '부가세 포함', '부가세 없음'] as const;

const toVatMode = (value: string | undefined): VatMode => {
  if (value === '부가세 포함') return 'included';
  if (value === '부가세 없음') return 'none';
  return 'excluded';
};

const toItems = (rows: FormRows): QuoteItem[] =>
  (rows.items ?? [])
    .filter((row) => (row.name ?? '').trim())
    .map((row) => ({
      name: (row.name ?? '').trim(),
      quantity: Number(row.quantity ?? 0),
      unitPrice: parseAmount(row.unitPrice ?? ''),
    }));

const rowAmount = (row: Record<string, string>): number =>
  itemAmount({
    name: row.name ?? '',
    quantity: Number(row.quantity ?? 0),
    unitPrice: parseAmount(row.unitPrice ?? ''),
  });

const partyFields = (prefix: PartyPrefix, label: string): FormField[] => [
  {
    id: `${prefix}Company`,
    label: `${label} 상호`,
    type: 'text',
    group: label,
    required: true,
    placeholder: prefix === 'buyer' ? '예: 옷깃' : '예: 거래처',
    maxLength: 60,
    span: 2,
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
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: `${prefix}Contact`,
    label: '연락처',
    type: 'text',
    group: label,
    placeholder: '전화 또는 이메일',
    maxLength: 60,
  },
];

const partyLines = (values: Record<string, string>, prefix: PartyPrefix, role: string): string[] =>
  [
    values[`${prefix}Company`] ?? '',
    values[`${prefix}Biz`] ? `사업자 ${values[`${prefix}Biz`]}` : '',
    values[`${prefix}Ceo`] ? `${role} ${values[`${prefix}Ceo`]}` : '',
    values[`${prefix}Address`] ?? '',
    values[`${prefix}Contact`] ?? '',
  ].filter((line) => line.trim() !== '');

const itemsGroup: RepeatGroup = {
  id: 'items',
  label: '품목',
  group: '발주 조건',
  help: '품목·규격·수량·단가를 입력하면 금액과 합계가 자동으로 계산됩니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 1,
  maxRows: 30,
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
      placeholder: '예: A4 복사용지',
      maxLength: 80,
      width: 3,
    },
    {
      id: 'spec',
      label: '규격',
      type: 'text',
      placeholder: '예: 80g 2,500매',
      maxLength: 60,
      width: 2,
    },
    { id: 'quantity', label: '수량', type: 'number', placeholder: '1', width: 1 },
    { id: 'unitPrice', label: '단가', type: 'money', placeholder: '0', width: 1.5 },
    {
      id: 'amount',
      label: '금액',
      type: 'computed',
      width: 1.5,
      align: 'right',
    },
  ],
  computeRow: (row) => {
    const amount = rowAmount(row);
    return { amount: amount > 0 ? formatWon(amount) : '' };
  },
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'P-20261115-001',
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
  ...partyFields('buyer', '발주자'),
  ...partyFields('supplier', '공급자'),
  {
    id: 'deliveryDate',
    label: '납기일',
    type: 'date',
    group: '발주 조건',
    required: true,
  },
  {
    id: 'deliveryPlace',
    label: '납품 장소',
    type: 'text',
    group: '발주 조건',
    placeholder: '예: 본사 3층 물류창고',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'vatMode',
    label: '부가세',
    type: 'select',
    group: '발주 조건',
    options: VAT_OPTIONS,
    defaultValue: '부가세 별도',
  },
  {
    id: 'terms',
    label: '납기·결제 조건',
    type: 'textarea',
    group: '납기·결제 조건',
    placeholder: '납기: 발주 후 7일 이내\n결제: 납품 후 14일 이내',
    rows: 3,
    maxLength: 500,
    span: 3,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '특약 사항, 납품 방법',
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
    help: '5칸 중 필요한 단계만 켜고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const tableColumns = [
  { label: 'No', width: 12, align: 'center' },
  { label: '품목', width: 60 },
  { label: '규격', width: 30 },
  { label: '수량', width: 14, align: 'right' },
  { label: '단가', width: 30, align: 'right' },
  { label: '금액', width: 28, align: 'right' },
] as const;

const itemRows = (rows: FormRows, limit?: number): readonly (readonly string[])[] => {
  const items = (rows.items ?? []).filter((row) => (row.name ?? '').trim());
  const list = typeof limit === 'number' ? items.slice(0, limit) : items;
  return list.map((row, index) => {
    const quantity = Number(row.quantity ?? 0);
    const unitPrice = parseAmount(row.unitPrice ?? '');
    const amount = itemAmount({
      name: row.name ?? '',
      quantity,
      unitPrice,
    });
    return [
      String(index + 1),
      (row.name ?? '').trim(),
      (row.spec ?? '').trim(),
      quantity > 0 ? String(quantity) : '',
      unitPrice > 0 ? formatWon(unitPrice) : '',
      amount > 0 ? formatWon(amount) : '',
    ];
  });
};

const summaryRows = (rows: FormRows): readonly (readonly string[])[] => {
  const items = (rows.items ?? []).filter((row) => (row.name ?? '').trim());
  const top = itemRows(rows, 3);
  if (items.length > 3) {
    return [...top, ['', `외 ${items.length - 3}건`, '', '', '', '']];
  }
  return top;
};

const headerBlock: FormBlock = {
  kind: 'header',
  variant: 'editorial',
  title: '발주서',
  docNoField: 'docNo',
  dateField: 'date',
  logo: true,
};

const partiesBlock: FormBlock = {
  kind: 'parties',
  left: {
    label: '발주자',
    lines: (values) => partyLines(values, 'buyer', '담당'),
  },
  right: {
    label: '공급자',
    lines: (values) => partyLines(values, 'supplier', '대표'),
  },
};

const conditionBlock: FormBlock = {
  kind: 'kv',
  columns: 3,
  rows: [
    { label: '납기일', field: 'deliveryDate' },
    { label: '납품 장소', field: 'deliveryPlace' },
    { label: '부가세', field: 'vatLabel' },
  ],
};

const totalsBlock: FormBlock = {
  kind: 'totals',
  rows: [
    { label: '공급가액', field: 'supplyLabel' },
    { label: '부가세', field: 'vatAmountLabel' },
    { label: '합계', field: 'totalLabel', strong: true },
  ],
};

const termsBlocks: FormBlock[] = [
  { kind: 'section', title: '납기·결제 조건' },
  { kind: 'text', field: 'terms', minLines: 3 },
  { kind: 'text', label: '비고', field: 'note', minLines: 2 },
];

const signatureBlock: FormBlock = {
  kind: 'signature',
  roles: ['담당', '부서장', '대표'],
  rolesField: 'approvalRoles',
  bottom: true,
};

const bodyBlocks: FormBlock[] = [
  headerBlock,
  partiesBlock,
  conditionBlock,
  { kind: 'section', title: '품목' },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => itemRows(rows),
    minRows: 4,
  },
  totalsBlock,
  ...termsBlocks,
  signatureBlock,
];

const summaryBlocks: FormBlock[] = [
  headerBlock,
  partiesBlock,
  conditionBlock,
  { kind: 'section', title: '품목' },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => summaryRows(rows),
    minRows: 0,
  },
  totalsBlock,
  ...termsBlocks,
  { kind: 'notice', text: '붙임 1. 품목 내역서 1부.' },
  signatureBlock,
];

const attachmentBlocks: FormBlock[] = [
  {
    kind: 'pageBreak',
    title: '붙임 1. 품목 내역서',
    note: '본 붙임은 본문 발주서의 일부입니다.',
  },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => itemRows(rows),
    minRows: 4,
  },
  totalsBlock,
];

export const purchaseOrder: FormTemplate = {
  slug: 'purchase-order',
  title: '발주서',
  family: 'finance',
  category: 'money',
  description:
    '발주자·공급자·품목·수량·단가·납기일을 입력하면 공급가액과 부가세가 자동 계산되는 발주서를 A4 PDF로 만듭니다. 입력한 내용은 서버로 전송되지 않습니다.',
  keywords: ['발주서 양식', '발주서 PDF', '발주서 만들기', '구매 발주서', '물품 발주서'],
  updated: '2026-11-21',
  docPrefix: 'PO',
  companyParty: 'buyer',
  lead: '물품이나 용역을 주문할 때 쓰는 발주서입니다. 품목·규격·수량·단가를 입력하면 공급가액·부가세·합계가 자동으로 계산되고, 납기일과 납품 장소를 한 장에 정리할 수 있습니다.',
  useCases: [
    '거래처에 물품을 주문할 때',
    '용역·외주 작업을 발주할 때',
    '납기일과 납품 장소를 문서로 남길 때',
    '인쇄해서 서명·날인 후 보낼 때',
  ],
  howTo: [
    '문서 번호와 작성일, 납기일을 확인합니다.',
    '발주자와 공급자 정보를 입력합니다.',
    '품목·규격·수량·단가를 입력하면 줄별 금액과 합계가 자동으로 계산됩니다.',
    '납기·결제 조건과 결재선을 확인한 뒤 PDF로 내려받습니다.',
  ],
  notes: [
    '이 문서는 참고용입니다. 실제 발주는 회사의 구매·계약 규정과 거래처와의 합의를 따르세요.',
    '품목이 많으면 “한 장 유지 + 붙임”으로 본문은 요약하고 품목 전체는 붙임으로 보낼 수 있습니다.',
    '부가세 포함·별도 구분은 회계 기준에 맞춰 확인하세요.',
    '제조·수리·건설·용역을 중소기업에 맡기는 하도급 거래라면, 위탁 내용·납기·검사 방법·대금 지급 방법과 기일 등을 적은 서면을 작업 시작 전에 줘야 합니다(하도급법 제3조). 발주서가 이 서면 역할을 하므로 납기·결제 조건을 빠뜨리지 마세요.',
  ],
  fields,
  groups: [itemsGroup],
  blocks: bodyBlocks,
  buildBlocks: ({ attachment }) =>
    attachment ? [...summaryBlocks, ...attachmentBlocks] : bodyBlocks,
  sample: {
    docNo: 'P-20261115-001',
    date: '2026-11-15',
    buyerCompany: '옷깃',
    buyerBiz: '123-45-67891',
    buyerCeo: '홍길동',
    buyerAddress: '서울시 강남구 테헤란로 1',
    buyerContact: '010-1234-5678',
    supplierCompany: '거래처 주식회사',
    supplierBiz: '220-81-62517',
    supplierCeo: '김담당',
    supplierAddress: '부산시 해운대구 1',
    supplierContact: '051-123-4567',
    deliveryDate: '2026-11-22',
    deliveryPlace: '본사 3층 물류창고',
    vatMode: '부가세 별도',
    terms: '납기: 2026. 11. 22.까지\n결제: 납품 후 14일 이내',
    note: '납품 시 거래명세서 1부를 함께 보내 주세요.',
  },
  sampleRows: {
    items: [
      {
        name: 'A4 복사용지',
        spec: '80g 2,500매',
        quantity: '10',
        unitPrice: '25000',
      },
      {
        name: '토너 카트리지',
        spec: '검정',
        quantity: '2',
        unitPrice: '80000',
      },
      {
        name: '사무용 펜',
        spec: '0.5mm 12자루',
        quantity: '5',
        unitPrice: '12000',
      },
    ],
  },
  compute: (values, rows) => {
    const vatMode = toVatMode(values.vatMode);
    const totals = computeTotals(toItems(rows), vatMode);
    return {
      vatLabel: vatModeLabel(vatMode),
      supplyLabel: formatWon(totals.supply),
      vatAmountLabel: formatWon(totals.vat),
      totalLabel: formatWon(totals.total),
    };
  },
  validate: (_values, rows) => {
    const items = toItems(rows);
    const errors: string[] = [];
    if (items.length === 0) errors.push('품목을 한 줄 이상 입력하세요.');
    if (items.some((item) => item.quantity <= 0)) {
      errors.push('수량은 1 이상이어야 합니다.');
    }
    if (items.some((item) => item.unitPrice < 0)) {
      errors.push('단가는 0원 이상이어야 합니다.');
    }
    return errors;
  },
  faq: [
    {
      q: '발주서와 거래명세서는 무엇이 다른가요?',
      a: '발주서는 물품이나 용역을 주문할 때 쓰고, 거래명세서는 납품 후 실제 거래 내역을 확인할 때 씁니다. 발주서의 품목·수량과 납품받은 수량이 같은지 대조하세요.',
    },
    {
      q: '부가세는 어떻게 계산되나요?',
      a: '부가세 별도는 품목 합계에 10%를 더하고, 부가세 포함은 입력 금액에서 공급가액과 부가세를 역산합니다. 부가세 없음은 합계만 표시합니다.',
    },
    {
      q: '품목이 많으면 어떻게 하나요?',
      a: '“한 장 유지 + 붙임”을 선택하면 본문에는 대표 품목과 합계만 두고, 전체 품목은 붙임 1. 품목 내역서로 분리합니다.',
    },
    {
      q: '결재선은 어떻게 바꾸나요?',
      a: '최대 5명까지 체크할 수 있고, 각 줄의 이름을 직접 고칠 수 있습니다. 체크한 순서대로 문서 서명란에 표시됩니다.',
    },
  ],
  sources: [
    {
      label: '국세청 — 전자세금계산서·증빙 안내',
      href: 'https://www.nts.go.kr/',
    },
    {
      label: '공정거래위원회 — 거래 조건 안내',
      href: 'https://www.ftc.go.kr/',
    },
  ],
  related: [
    { label: '견적서', href: '/forms/quote/' },
    { label: '거래명세서', href: '/forms/statement/' },
    { label: '지출결의서', href: '/forms/expense-report/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
