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

type PartyPrefix = 'supplier' | 'buyer';

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
    placeholder: prefix === 'supplier' ? '예: 옷깃' : '예: 거래처',
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
  label: '납품 품목',
  group: '납품 정보',
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
    placeholder: 'D-20261115-001',
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
  ...partyFields('supplier', '공급자'),
  ...partyFields('buyer', '공급받는자'),
  {
    id: 'deliveryDate',
    label: '납품일',
    type: 'date',
    group: '납품 정보',
    required: true,
  },
  {
    id: 'deliveryPlace',
    label: '납품 장소',
    type: 'text',
    group: '납품 정보',
    placeholder: '예: 본사 3층 물류창고',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'receiverName',
    label: '인수자',
    type: 'text',
    group: '납품 정보',
    placeholder: '물품을 인수한 담당자',
    required: true,
    maxLength: 30,
  },
  {
    id: 'receiverContact',
    label: '인수자 연락처',
    type: 'text',
    group: '납품 정보',
    placeholder: '전화 또는 이메일',
    maxLength: 60,
  },
  {
    id: 'vatMode',
    label: '부가세',
    type: 'select',
    group: '납품 정보',
    options: VAT_OPTIONS,
    defaultValue: '부가세 별도',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '납품 상태, 특이 사항',
    rows: 2,
    maxLength: 300,
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
  title: '납품확인서',
  docNoField: 'docNo',
  dateField: 'date',
  logo: true,
};

const partiesBlock: FormBlock = {
  kind: 'parties',
  left: {
    label: '공급자',
    lines: (values) => partyLines(values, 'supplier', '대표'),
  },
  right: {
    label: '공급받는자',
    lines: (values) => partyLines(values, 'buyer', '담당'),
  },
};

const deliveryBlock: FormBlock = {
  kind: 'kv',
  columns: 2,
  rows: [
    { label: '납품일', field: 'deliveryDate' },
    { label: '납품 장소', field: 'deliveryPlace' },
  ],
};

const receiverBlock: FormBlock = {
  kind: 'kv',
  columns: 2,
  rows: [
    { label: '인수자', field: 'receiverName' },
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

const signatureBlock: FormBlock = {
  kind: 'signature',
  roles: ['공급자', '인수자'],
  bottom: true,
  seal: true,
};

const bodyBlocks: FormBlock[] = [
  headerBlock,
  partiesBlock,
  deliveryBlock,
  receiverBlock,
  { kind: 'section', title: '납품 품목' },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => itemRows(rows),
    minRows: 4,
  },
  totalsBlock,
  { kind: 'text', label: '비고', field: 'note', minLines: 2 },
  signatureBlock,
];

const summaryBlocks: FormBlock[] = [
  headerBlock,
  partiesBlock,
  deliveryBlock,
  receiverBlock,
  { kind: 'section', title: '납품 품목' },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => summaryRows(rows),
    minRows: 0,
  },
  totalsBlock,
  { kind: 'text', label: '비고', field: 'note', minLines: 2 },
  { kind: 'notice', text: '붙임 1. 품목 내역서 1부.' },
  signatureBlock,
];

const attachmentBlocks: FormBlock[] = [
  {
    kind: 'pageBreak',
    title: '붙임 1. 품목 내역서',
    note: '본 붙임은 본문 납품확인서의 일부입니다.',
  },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => itemRows(rows),
    minRows: 4,
  },
  totalsBlock,
];

export const deliveryConfirmation: FormTemplate = {
  slug: 'delivery-confirmation',
  title: '납품확인서',
  family: 'finance',
  category: 'money',
  description:
    '납품 품목과 수량, 인수자를 입력해 납품확인서를 만들고 A4 PDF로 저장합니다. 입력한 내용은 서버로 전송되지 않습니다.',
  keywords: [
    '납품확인서 양식',
    '납품확인서 PDF',
    '납품 확인서',
    '물품 인수 확인서',
    '납품확인서 만들기',
  ],
  updated: '2026-11-15',
  docPrefix: 'D',
  companyParty: 'supplier',
  lead: '물품을 납품한 뒤 수량과 상태를 확인받는 납품확인서입니다. 품목·규격·수량·단가를 입력하면 합계가 자동으로 계산되고, 공급자와 인수자가 서명하는 한 장으로 정리됩니다.',
  useCases: [
    '물품을 납품하고 인수 확인을 받을 때',
    '거래명세서와 함께 납품 증빙을 남길 때',
    '납품 수량과 상태를 거래처와 확인할 때',
    '인쇄해서 인수자 서명을 받을 때',
  ],
  howTo: [
    '문서 번호와 작성일, 납품일·납품 장소를 확인합니다.',
    '공급자와 공급받는자 정보, 인수자를 입력합니다.',
    '납품 품목·규격·수량·단가를 입력하면 금액과 합계가 자동으로 계산됩니다.',
    '품목이 많으면 “한 장 유지 + 붙임”을 선택하고 PDF로 내려받습니다.',
  ],
  notes: [
    '이 문서는 물품 인수 사실을 확인하는 참고용 문서입니다. 법적 효력이나 세무 증빙을 대신하지 않습니다.',
    '거래명세서·세금계산서와 함께 보관하면 납품·정산 자료로 쓰기 좋습니다.',
    '인수자 서명은 출력 후 직접 받는 것을 권장합니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [itemsGroup],
  blocks: bodyBlocks,
  buildBlocks: ({ attachment }) =>
    attachment ? [...summaryBlocks, ...attachmentBlocks] : bodyBlocks,
  sample: {
    docNo: 'D-20261115-001',
    date: '2026-11-15',
    supplierCompany: '옷깃',
    supplierBiz: '123-45-67891',
    supplierCeo: '홍길동',
    supplierAddress: '서울시 강남구 테헤란로 1',
    supplierContact: '010-1234-5678',
    buyerCompany: '거래처 주식회사',
    buyerBiz: '220-81-62517',
    buyerCeo: '김담당',
    buyerAddress: '부산시 해운대구 1',
    buyerContact: '051-123-4567',
    deliveryDate: '2026-11-18',
    deliveryPlace: '본사 3층 물류창고',
    receiverName: '김담당',
    receiverContact: '051-123-4567',
    vatMode: '부가세 별도',
    note: '납품 품목과 수량을 확인했습니다.',
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
      q: '거래명세서와 납품확인서는 무엇이 다른가요?',
      a: '거래명세서는 거래한 품목과 금액을 정리하는 문서이고, 납품확인서는 물품을 실제로 인수했다는 사실을 확인하는 문서입니다. 두 문서를 함께 보관하면 납품과 정산을 대조하기 쉽습니다.',
    },
    {
      q: '인수자 서명은 어떻게 받나요?',
      a: 'PDF로 내려받아 인쇄한 뒤 인수자에게 서명을 받는 것을 권장합니다. PDF 서명 도구로 전자 서명을 넣을 수도 있습니다.',
    },
    {
      q: '품목이 많으면 어떻게 하나요?',
      a: '“한 장 유지 + 붙임”을 선택하면 본문에는 대표 품목과 합계만 두고, 전체 품목은 붙임 1. 품목 내역서로 분리합니다.',
    },
    {
      q: '부가세는 어떻게 계산되나요?',
      a: '부가세 별도는 품목 합계에 10%를 더하고, 부가세 포함은 입력 금액에서 공급가액과 부가세를 역산합니다. 부가세 없음은 합계만 표시합니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다.',
    },
  ],
  sources: [
    {
      label: '공정거래위원회 — 거래 조건 안내',
      href: 'https://www.ftc.go.kr/',
    },
    {
      label: '국세청 — 증빙서류 안내',
      href: 'https://www.nts.go.kr/',
    },
  ],
  related: [
    { label: '발주서', href: '/forms/purchase-order/' },
    { label: '거래명세서', href: '/forms/statement/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
