import type {
  FormBlock,
  FormField,
  FormRows,
  FormTemplate,
  GridCell,
  GridRow,
} from '@/lib/doc/types';
import { formatWon, itemAmount, parseAmount } from '@/lib/quote';

/** 카드매출전표(약 80×140mm)를 A4에 그대로 배치한다. */
const SHEET = { width: 80, height: 140 };
const BLACK = '#1C1C1C';

const fields: FormField[] = [
  {
    id: 'storeName',
    label: '매장명',
    type: 'text',
    group: '매장 정보',
    required: true,
    placeholder: '옷깃 상점',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'storeBiz',
    label: '사업자번호',
    type: 'text',
    group: '매장 정보',
    placeholder: '123-45-67891',
    maxLength: 20,
  },
  {
    id: 'storeAddress',
    label: '주소',
    type: 'text',
    group: '매장 정보',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'storeCeo',
    label: '대표자',
    type: 'text',
    group: '매장 정보',
    placeholder: '박대표',
    maxLength: 30,
  },
  {
    id: 'storeTel',
    label: 'TEL',
    type: 'text',
    group: '매장 정보',
    placeholder: '02-123-4567',
    maxLength: 30,
  },
  {
    id: 'soldAt',
    label: '매출일시',
    type: 'text',
    group: '매장 정보',
    placeholder: '2026-11-20 14:30',
    maxLength: 30,
    span: 2,
  },
  {
    id: 'cardType',
    label: '카드종류',
    type: 'text',
    group: '카드 정보',
    placeholder: '삼성카드',
    maxLength: 30,
  },
  {
    id: 'cardNo',
    label: '카드번호',
    type: 'text',
    group: '카드 정보',
    placeholder: '0000-0000-****-****',
    maxLength: 30,
  },
  {
    id: 'expiry',
    label: '유효기간',
    type: 'text',
    group: '카드 정보',
    placeholder: '12/28',
    maxLength: 10,
  },
  {
    id: 'approvalNo',
    label: '승인번호',
    type: 'text',
    group: '카드 정보',
    placeholder: '00000000',
    maxLength: 30,
  },
  {
    id: 'approvedAt',
    label: '승인일시',
    type: 'text',
    group: '카드 정보',
    placeholder: '2026-11-20 14:31',
    maxLength: 30,
    span: 2,
  },
];

const items = {
  id: 'items',
  label: '품목',
  group: '매장 정보',
  help: '상품명·단가·수량을 입력하면 금액과 부가세·합계가 계산됩니다.',
  minRows: 1,
  maxRows: 5,
  addLabel: '+ 상품 추가',
  required: true,
  summaryField: 'totalLabel',
  summaryLabel: '합계',
  columns: [
    {
      id: 'name',
      label: '상품명',
      type: 'text' as const,
      required: true,
      placeholder: '상품명',
      maxLength: 60,
      width: 2.6,
    },
    { id: 'unitPrice', label: '단가', type: 'money' as const, placeholder: '0', width: 1.4 },
    { id: 'quantity', label: '수량', type: 'number' as const, placeholder: '1', width: 0.9 },
    {
      id: 'amount',
      label: '금액',
      type: 'computed' as const,
      align: 'right' as const,
      width: 1.4,
    },
  ],
  computeRow: (row: Record<string, string>) => {
    const amount = itemAmount({
      name: row.name ?? '',
      quantity: Number(row.quantity ?? 0),
      unitPrice: parseAmount(row.unitPrice ?? ''),
    });
    return { amount: amount > 0 ? formatWon(amount) : '' };
  },
};

const toItems = (rows: FormRows) =>
  (rows.items ?? [])
    .filter((row) => (row.name ?? '').trim())
    .map((row) => ({
      name: (row.name ?? '').trim(),
      quantity: Number(row.quantity ?? 0),
      unitPrice: parseAmount(row.unitPrice ?? ''),
    }));

const supplyOf = (rows: FormRows): number =>
  toItems(rows).reduce((sum, row) => sum + itemAmount(row), 0);

const cell = (text: string, width: number, options: Partial<GridCell> = {}): GridCell => ({
  text,
  colSpan: width,
  ...options,
});

const gridRows = (
  _values: Record<string, string>,
  rows: FormRows,
  mode: 'filled' | 'blank',
): readonly GridRow[] => {
  const list = mode === 'blank' ? [] : toItems(rows);
  const itemRows: GridRow[] = Array.from({ length: 5 }, (_, index) => {
    const item = list[index];
    const amount = item ? itemAmount(item) : 0;
    return {
      height: 6,
      cells: [
        cell(item?.name ?? '', 36, { align: 'left', size: 6, padding: 0.8 }),
        cell(item?.unitPrice ? formatWon(item.unitPrice) : '', 14, {
          align: 'right',
          size: 6,
          padding: 0.8,
        }),
        cell(item?.quantity ? String(item.quantity) : '', 10, { size: 6 }),
        cell(amount > 0 ? formatWon(amount) : '', 20, {
          align: 'right',
          size: 6,
          padding: 0.8,
        }),
      ],
    };
  });

  return [
    { height: 10, cells: [cell('신용카드 매출전표', 80, { size: 12, bold: true })] },
    {
      height: 5,
      cells: [
        cell('[매장명]', 16, { align: 'left', size: 5.5, padding: 0.6 }),
        cell('', 64, { field: 'storeName', align: 'left', size: 6.5, padding: 0.6 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('[사업자번호]', 16, { align: 'left', size: 5.2, padding: 0.6 }),
        cell('', 64, { field: 'storeBiz', align: 'left', size: 6.5, padding: 0.6 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('[주소]', 16, { align: 'left', size: 5.5, padding: 0.6 }),
        cell('', 64, { field: 'storeAddress', align: 'left', size: 6, padding: 0.6 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('[대표자]', 16, { align: 'left', size: 5.2, padding: 0.6 }),
        cell('', 28, { field: 'storeCeo', align: 'left', size: 6, padding: 0.6 }),
        cell('[TEL]', 10, { size: 4.8 }),
        cell('', 26, { field: 'storeTel', align: 'left', size: 6, padding: 0.6 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('[매출일]', 16, { align: 'left', size: 5.2, padding: 0.6 }),
        cell('', 64, { field: 'soldAt', align: 'left', size: 6, padding: 0.6 }),
      ],
    },
    { height: 1, cells: [cell('', 80, { size: 1, padding: 0.1 })] },
    {
      height: 6,
      cells: [
        cell('상품명', 36, { size: 6 }),
        cell('단가', 14, { size: 6 }),
        cell('수량', 10, { size: 6 }),
        cell('금액', 20, { size: 6 }),
      ],
    },
    ...itemRows,
    { height: 1, cells: [cell('', 80, { size: 1, padding: 0.1 })] },
    {
      height: 5,
      cells: [
        cell('공급가액', 50, { align: 'left', size: 6, padding: 0.8 }),
        cell('', 30, { field: 'supplyLabel', align: 'right', size: 6.5, padding: 0.8 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('부가세', 50, { align: 'left', size: 6, padding: 0.8 }),
        cell('', 30, { field: 'taxLabel', align: 'right', size: 6.5, padding: 0.8 }),
      ],
    },
    {
      height: 6,
      cells: [
        cell('합계', 50, { align: 'left', size: 7, bold: true, padding: 0.8 }),
        cell('', 30, { field: 'totalLabel', align: 'right', size: 7.5, bold: true, padding: 0.8 }),
      ],
    },
    { height: 1, cells: [cell('', 80, { size: 1, padding: 0.1 })] },
    {
      height: 5,
      cells: [
        cell('[카드종류]', 22, { align: 'left', size: 5.2, padding: 0.6 }),
        cell('', 58, { field: 'cardType', align: 'left', size: 6, padding: 0.6 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('[카드번호]', 22, { align: 'left', size: 5.2, padding: 0.6 }),
        cell('', 58, { field: 'cardNo', align: 'left', size: 6, padding: 0.6 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('[유효기간]', 22, { align: 'left', size: 5.2, padding: 0.6 }),
        cell('', 58, { field: 'expiry', align: 'left', size: 6, padding: 0.6 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('[승인금액]', 22, { align: 'left', size: 5.2, padding: 0.6 }),
        cell('', 58, { field: 'totalLabel', align: 'left', size: 6, padding: 0.6 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('[승인번호]', 22, { align: 'left', size: 5.2, padding: 0.6 }),
        cell('', 58, { field: 'approvalNo', align: 'left', size: 6, padding: 0.6 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('[승인일시]', 22, { align: 'left', size: 5.2, padding: 0.6 }),
        cell('', 58, { field: 'approvedAt', align: 'left', size: 6, padding: 0.6 }),
      ],
    },
    { height: 20, cells: [cell('', 80, { size: 1, padding: 0.1 })] },
  ];
};

const printBlocks = (): FormBlock[] => [
  {
    kind: 'grid',
    columns: Array.from({ length: 80 }, () => 1),
    rows: gridRows,
    lineColor: BLACK,
    lineWidth: 0.16,
    overlays: (_values, _rows, mode) => [
      {
        x: 4,
        y: 135,
        text: mode === 'blank' ? '' : '카드사 승인 내역을 확인하세요.',
        size: 4.8,
      },
    ],
  },
];

const blocks: FormBlock[] = [
  { kind: 'paragraph', text: '카드매출전표', align: 'center', size: 16, bold: true, after: 2 },
  { kind: 'section', title: '매장 정보' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '매장명', field: 'storeName' },
      { label: '사업자번호', field: 'storeBiz' },
      { label: '대표자', field: 'storeCeo' },
      { label: 'TEL', field: 'storeTel' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '주소', field: 'storeAddress' }] },
  { kind: 'kv', columns: 1, rows: [{ label: '매출일시', field: 'soldAt' }] },
  { kind: 'section', title: '품목' },
  {
    kind: 'table',
    columns: [
      { label: '상품명', width: 36 },
      { label: '단가', width: 14, align: 'right' },
      { label: '수량', width: 10, align: 'right' },
      { label: '금액', width: 20, align: 'right' },
    ],
    rows: (_v, rows) =>
      toItems(rows).map((row) => [
        row.name,
        row.unitPrice ? formatWon(row.unitPrice) : '',
        row.quantity ? String(row.quantity) : '',
        formatWon(itemAmount(row)),
      ]),
    minRows: 2,
  },
  {
    kind: 'totals',
    rows: [
      { label: '공급가액', field: 'supplyLabel' },
      { label: '부가세', field: 'taxLabel' },
      { label: '합계', field: 'totalLabel', strong: true },
    ],
    width: 70,
  },
  { kind: 'section', title: '카드 정보' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '카드종류', field: 'cardType' },
      { label: '카드번호', field: 'cardNo' },
      { label: '유효기간', field: 'expiry' },
      { label: '승인번호', field: 'approvalNo' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '승인일시', field: 'approvedAt' }] },
];

export const cardSalesSlip: FormTemplate = {
  slug: 'card-sales-slip',
  title: '카드매출전표',
  family: 'finance',
  category: 'money',
  description:
    '카드매출전표(약 80×140mm)의 매장 정보·상품 표·부가세·카드 승인 정보를 재현해 A4에 인쇄하는 양식입니다.',
  keywords: ['카드매출전표', '신용카드 매출전표', '카드 영수증', '매출전표 양식', '카드 승인'],
  updated: '2026-11-20',
  docPrefix: 'CDS',
  companyParty: 'supplier',
  sheet: { ...SHEET, padding: 0, border: false },
  showFooter: false,
  lead: '카드 결제 후 매장 정보·상품 내역·부가세·승인 정보를 한 장에 남기는 카드매출전표입니다.',
  useCases: [
    '카드 결제 내역을 매장 기록으로 남길 때',
    '상품별 금액과 부가세를 확인할 때',
    '카드 승인번호·승인일시를 함께 보관할 때',
    '카드사 전표와 대조할 때',
  ],
  howTo: [
    '매장 정보와 매출일시를 적습니다.',
    '상품명·단가·수량을 입력합니다.',
    '카드 종류·번호·승인번호·승인일시를 적습니다.',
    'PDF로 내려받아 A4에 100% 크기로 인쇄합니다.',
  ],
  notes: [
    'A4에 80×140mm 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '한글(HWPX)은 A4 기본 여백으로 만들어집니다. 실제 전표 크기로 인쇄하려면 PDF를 사용하세요.',
    '이 양식은 카드사 승인 전표를 대체하지 않습니다. 실제 승인 내역은 카드사·POS에서 확인하세요.',
    '카드번호는 일부를 가려서 보관하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  groups: [items],
  blocks,
  printBlocks,
  compute: (_values, rows) => {
    const supply = supplyOf(rows);
    const tax = Math.round(supply * 0.1);
    return {
      supplyLabel: supply > 0 ? formatWon(supply) : '',
      taxLabel: tax > 0 ? formatWon(tax) : '',
      totalLabel: supply > 0 ? formatWon(supply + tax) : '',
    };
  },
  validate: (_values, rows) =>
    toItems(rows).length === 0 ? ['상품을 한 줄 이상 입력하세요.'] : [],
  sample: {
    storeName: '옷깃 상점',
    storeBiz: '123-45-67891',
    storeAddress: '서울시 강남구 테헤란로 1',
    storeCeo: '박대표',
    storeTel: '02-123-4567',
    soldAt: '2026-11-20 14:30',
    cardType: '삼성카드',
    cardNo: '0000-0000-****-****',
    expiry: '12/28',
    approvalNo: '00000000',
    approvedAt: '2026-11-20 14:31',
  },
  sampleRows: {
    items: [
      { name: '사무용품', unitPrice: '15000', quantity: '2' },
      { name: '토너', unitPrice: '30000', quantity: '1' },
    ],
  },
  faq: [
    {
      q: '실제 카드 전표 대신 써도 되나요?',
      a: '아니요. 이 양식은 매장 기록·대조용입니다. 실제 승인 전표는 카드사·POS에서 발급됩니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '약 80×140mm 크기로 A4 중앙에 배치됩니다. 인쇄 배율을 100%로 두세요.',
    },
    {
      q: '부가세는 어떻게 계산되나요?',
      a: '공급가액의 10%로 계산합니다. 실제 세율·면세 여부는 거래 조건을 확인하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성은 브라우저 안에서 이루어집니다.',
    },
  ],
  sources: [{ label: '국세청 — 신용카드 매출전표 안내', href: 'https://www.nts.go.kr/' }],
  related: [
    { label: '현금영수증 양식', href: '/forms/cash-receipt/' },
    { label: '표준 영수증 양식', href: '/forms/standard-receipt/' },
    { label: '거래명세표 양식', href: '/forms/transaction-statement/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
