import { formatKoreanNumber } from '@/lib/doc/format';
import type {
  FormBlock,
  FormField,
  FormRows,
  FormTemplate,
  GridCell,
  GridRow,
} from '@/lib/doc/types';
import { formatWon, itemAmount, parseAmount } from '@/lib/quote';

/** 실제 거래명세서(12.8×18.2cm). */
const SHEET = { width: 182, height: 128 };
const BLACK = '#1C1C1C';

const supplierFields: FormField[] = [
  {
    id: 'supplierCompany',
    label: '상호',
    type: 'text',
    group: '공급자',
    required: true,
    placeholder: '옷깃 주식회사',
    maxLength: 60,
  },
  {
    id: 'supplierBiz',
    label: '등록번호',
    type: 'text',
    group: '공급자',
    placeholder: '123-45-67891',
    maxLength: 20,
  },
  {
    id: 'supplierCeo',
    label: '성명',
    type: 'text',
    group: '공급자',
    placeholder: '박대표',
    maxLength: 30,
  },
  {
    id: 'supplierAddress',
    label: '사업장소재지',
    type: 'text',
    group: '공급자',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'supplierType',
    label: '업태',
    type: 'text',
    group: '공급자',
    placeholder: '도소매',
    maxLength: 40,
  },
  {
    id: 'supplierItem',
    label: '종목',
    type: 'text',
    group: '공급자',
    placeholder: '사무용품',
    maxLength: 40,
  },
];

const items = {
  id: 'items',
  label: '품목',
  group: '품목',
  help: '표준 거래명세서는 10줄까지 적습니다. 품목·규격·수량·단가를 입력하면 금액과 세액이 계산됩니다.',
  minRows: 1,
  maxRows: 10,
  addLabel: '+ 품목 추가',
  required: true,
  summaryField: 'totalLabel',
  summaryLabel: '합계',
  columns: [
    {
      id: 'name',
      label: '품목',
      type: 'text' as const,
      required: true,
      placeholder: '품목명',
      maxLength: 60,
      width: 2.8,
    },
    {
      id: 'spec',
      label: '규격',
      type: 'text' as const,
      placeholder: '규격',
      maxLength: 30,
      width: 1,
    },
    { id: 'quantity', label: '수량', type: 'number' as const, placeholder: '1', width: 0.9 },
    { id: 'unitPrice', label: '단가', type: 'money' as const, placeholder: '0', width: 1.4 },
    {
      id: 'amount',
      label: '공급가액',
      type: 'computed' as const,
      align: 'right' as const,
      width: 1.5,
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

const fields: FormField[] = [
  { id: 'docNo', label: '문서 번호', type: 'text', group: '문서', placeholder: 'TSP-20261118-001' },
  { id: 'date', label: '거래일', type: 'date', group: '문서', defaultToday: true, required: true },
  {
    id: 'buyerCompany',
    label: '받는 곳(귀하)',
    type: 'text',
    group: '공급받는자',
    placeholder: '거래처 주식회사',
    maxLength: 60,
    span: 2,
  },
  ...supplierFields,
  { id: 'supplyLabel', label: '공급가액', type: 'computed', group: '품목' },
  { id: 'taxLabel', label: '세액', type: 'computed', group: '품목' },
  { id: 'totalLabel', label: '합계', type: 'computed', group: '품목' },
];

const toItems = (rows: FormRows) =>
  (rows.items ?? [])
    .filter((row) => (row.name ?? '').trim())
    .map((row) => ({
      name: (row.name ?? '').trim(),
      spec: (row.spec ?? '').trim(),
      quantity: Number(row.quantity ?? 0),
      unitPrice: parseAmount(row.unitPrice ?? ''),
    }));

const cell = (text: string, width: number, options: Partial<GridCell> = {}): GridCell => ({
  text,
  colSpan: width,
  ...options,
});

const gridRows = (
  values: Record<string, string>,
  rows: FormRows,
  mode: 'filled' | 'blank',
): readonly GridRow[] => {
  const list = mode === 'blank' ? [] : toItems(rows);
  const [, month = '', day = ''] = (values.date ?? '').split('-');
  const dateText =
    mode === 'blank' || !month
      ? '20        년        월        일'
      : `20${(values.date ?? '').slice(2, 4)}   년   ${month}   월   ${day}   일`;
  const buyer = mode === 'blank' ? '' : (values.buyerCompany ?? '');
  const amountKorean = mode === 'blank' ? '' : (values.amountKorean ?? '');

  const itemRows: GridRow[] = Array.from({ length: 10 }, (_, index) => {
    const item = list[index];
    const amount = item ? itemAmount(item) : 0;
    const tax = Math.round(amount * 0.1);
    return {
      height: 5,
      cells: [
        cell(index === 0 && mode === 'filled' && month ? `${month}/${day}` : '', 14, {
          size: 6.5,
        }),
        cell(item?.name ?? '', 52, { align: 'left', size: 6.8 }),
        cell(item?.spec ?? '', 18, { align: 'left', size: 6.8 }),
        cell(item?.quantity ? String(item.quantity) : '', 13, { size: 6.8 }),
        cell(item?.unitPrice ? formatWon(item.unitPrice) : '', 23, { align: 'right', size: 6.8 }),
        cell(amount > 0 ? formatWon(amount) : '', 32, { align: 'right', size: 6.8 }),
        cell(tax > 0 ? formatWon(tax) : '', 30, { align: 'right', size: 6.8 }),
      ],
    };
  });

  return [
    {
      height: 10,
      cells: [
        cell('권', 20, { size: 7 }),
        cell('호', 18, { size: 7 }),
        cell('거 래 명 세 서', 82, { size: 18, bold: true }),
        cell('(공급받는자용)', 40, { size: 6 }),
        cell('', 22, {}),
      ],
    },
    {
      height: 8,
      cells: [
        cell(dateText, 55, { size: 7 }),
        cell('등록번호', 15, { size: 6 }),
        cell('', 50, { field: 'supplierBiz', size: 7.5 }),
        cell('', 62, {}),
      ],
    },
    {
      height: 9,
      cells: [
        cell(buyer ? `${buyer}   귀하` : '귀하', 95, { size: 12, align: 'right', padding: 4 }),
        cell('상호', 15, { size: 6.5 }),
        cell('', 40, { field: 'supplierCompany', size: 7.5 }),
        cell('성명', 12, { size: 6.5 }),
        cell('', 14, { field: 'supplierCeo', size: 7.5 }),
        cell('(인)', 6, { size: 4.5, padding: 0.4 }),
      ],
    },
    {
      height: 9,
      cells: [
        cell('아래와 같이 계산합니다.', 95, { size: 8, align: 'left', padding: 4 }),
        cell('사업장소재지', 17, { size: 5.8, align: 'left', padding: 1 }),
        cell('', 70, { field: 'supplierAddress', align: 'left', size: 6.5, padding: 1 }),
      ],
    },
    {
      height: 10,
      cells: [
        cell('', 95, {}),
        cell('업태', 15, { size: 6.5 }),
        cell('', 35, { field: 'supplierType', align: 'left', size: 6.5, padding: 1 }),
        cell('종목', 13, { size: 6.5 }),
        cell('', 24, { field: 'supplierItem', align: 'left', size: 6.5, padding: 1 }),
      ],
    },
    {
      height: 8,
      cells: [
        cell('합계금액', 20, { size: 6.5 }),
        cell('', 75, { field: 'totalLabel', align: 'right', size: 8, bold: true, padding: 1.5 }),
        cell('원정(₩', 17, { size: 6.5 }),
        cell(amountKorean, 63, { size: 6.5, align: 'left', padding: 1 }),
        cell(')', 7, { size: 6.5 }),
      ],
    },
    {
      height: 7,
      cells: [
        cell('월일', 14, { size: 7 }),
        cell('품 목', 52, { size: 7 }),
        cell('규 격', 18, { size: 7 }),
        cell('수 량', 13, { size: 7 }),
        cell('단 가', 23, { size: 7 }),
        cell('공 급 가 액', 32, { size: 7 }),
        cell('세 액', 30, { size: 7 }),
      ],
    },
    ...itemRows,
    {
      height: 5,
      cells: [
        cell('계', 55, { size: 8 }),
        cell('', 127, { field: 'totalLabel', align: 'right', size: 8, bold: true, padding: 1.5 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('전 잔 금', 20, { size: 6.5 }),
        cell('', 70, {}),
        cell('합    계', 20, { size: 6.5 }),
        cell('', 72, { field: 'totalLabel', align: 'right', size: 7 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('입    금', 20, { size: 6.5 }),
        cell('', 55, {}),
        cell('잔    금', 20, { size: 6.5 }),
        cell('', 50, {}),
        cell('인수자', 20, { size: 6.5 }),
        cell('', 11, {}),
        cell('(인)', 6, { size: 4.5, padding: 0.4 }),
      ],
    },
    { height: 2, cells: [cell('', 182, { size: 1, padding: 0.1 })] },
  ];
};

const printBlocks = (): FormBlock[] => [
  {
    kind: 'grid',
    columns: Array.from({ length: 182 }, () => 1),
    rows: gridRows,
    lineColor: BLACK,
    lineWidth: 0.16,
  },
];

const blocks: FormBlock[] = [
  { kind: 'paragraph', text: '거래명세서', align: 'center', size: 15, bold: true, after: 1 },
  {
    kind: 'paragraph',
    text: 'SPECIFICATION OF TRANSACTION',
    align: 'center',
    size: 6,
    bold: true,
    color: '#0B6B5B',
    after: 4,
  },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '문서번호', field: 'docNo' },
      { label: '거래일', field: 'date' },
    ],
  },
  { kind: 'section', title: '공급받는자' },
  { kind: 'kv', columns: 1, rows: [{ label: '받는 곳', field: 'buyerCompany' }] },
  { kind: 'section', title: '공급자' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '상호', field: 'supplierCompany' },
      { label: '등록번호', field: 'supplierBiz' },
      { label: '성명', field: 'supplierCeo' },
      { label: '주소', field: 'supplierAddress' },
    ],
  },
  { kind: 'section', title: '품목' },
  {
    kind: 'table',
    columns: [
      { label: '품목', width: 54 },
      { label: '규격', width: 16 },
      { label: '수량', width: 14, align: 'right' },
      { label: '단가', width: 20, align: 'right' },
      { label: '금액', width: 24, align: 'right' },
    ],
    rows: (_v, rows) =>
      toItems(rows).map((row) => [
        row.name,
        row.spec,
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
    width: 70,
  },
];

export const transactionSpec: FormTemplate = {
  slug: 'transaction-spec',
  title: '거래명세서(표준)',
  family: 'finance',
  category: 'money',
  description:
    '실제 거래명세서(12.8×18.2cm)의 검은 격자와 품목·규격·수량·단가·공급가액·세액 칸을 그대로 재현해 A4에 인쇄하는 양식입니다.',
  keywords: ['거래명세서', '거래명세서 양식', '거래명세서 PDF', '거래 내역서', '납품명세서'],
  updated: '2026-11-18',
  docPrefix: 'TSP',
  companyParty: 'supplier',
  sheet: { ...SHEET, padding: 0, border: false },
  showFooter: false,
  lead: '사진 속 거래명세서와 같은 검은 격자, 품목·규격·수량·단가·공급가액·세액 칸을 그대로 옮겼습니다.',
  useCases: [
    '거래명세서를 A4에 인쇄할 때',
    '납품 품목과 금액을 확인할 때',
    '공급자·공급받는자가 함께 확인할 때',
    '정산 자료로 거래 내역을 남길 때',
  ],
  howTo: [
    '거래일과 받는 곳, 공급자 정보를 적습니다.',
    '품목·규격·수량·단가를 입력합니다.',
    '합계금액과 세액을 확인합니다.',
    'PDF로 내려받아 A4에 100% 크기로 인쇄합니다.',
  ],
  notes: [
    'A4에 182×128mm(가로) 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '한글(HWPX)은 A4 기본 여백으로 만들어집니다. 실제 전표 크기로 인쇄하려면 PDF를 사용하세요.',
    '표준 거래명세서는 10줄까지 적을 수 있습니다.',
    '세금계산서가 필요한 거래는 세금계산서를 별도로 발급하세요.',
  ],
  fields,
  groups: [items],
  blocks,
  printBlocks,
  compute: (_v, rows) => {
    const supply = toItems(rows).reduce((sum, row) => sum + itemAmount(row), 0);
    const tax = Math.round(supply * 0.1);
    return {
      supplyLabel: formatWon(supply),
      taxLabel: formatWon(tax),
      totalLabel: formatWon(supply + tax),
      amountKorean: `${formatKoreanNumber(supply + tax)} 원`,
    };
  },
  validate: (_v, rows) => (toItems(rows).length === 0 ? ['품목을 한 줄 이상 입력하세요.'] : []),
  sample: {
    docNo: 'TSP-20261118-001',
    date: '2026-11-18',
    buyerCompany: '거래처 주식회사',
    supplierCompany: '옷깃 주식회사',
    supplierBiz: '123-45-67891',
    supplierCeo: '박대표',
    supplierAddress: '서울시 강남구 테헤란로 1',
    supplierType: '도소매',
    supplierItem: '사무용품',
  },
  sampleRows: {
    items: [
      { name: '사무용품', spec: 'A4', quantity: '10', unitPrice: '30000' },
      { name: '토너', spec: '흑백', quantity: '2', unitPrice: '80000' },
    ],
  },
  faq: [
    {
      q: '거래명세서와 거래명세표는 무엇이 다른가요?',
      a: '거래명세서는 가로로 넓은 문서 형식, 거래명세표는 좁은 세로 전표 형식이 일반적입니다. 제출처가 요구하는 형식을 확인하세요.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '실제 거래명세서와 같은 182×128mm(가로) 크기로 A4 중앙에 배치됩니다. 인쇄 배율을 100%로 두세요.',
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
    { label: '거래명세표 양식', href: '/forms/transaction-statement/' },
    { label: '입금전표 양식', href: '/forms/deposit-slip/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
