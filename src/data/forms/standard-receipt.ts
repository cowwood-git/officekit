import type {
  FormBlock,
  FormField,
  FormRows,
  FormTemplate,
  GridCell,
  GridOverlay,
  GridRow,
} from '@/lib/doc/types';
import { formatWon, itemAmount, parseAmount } from '@/lib/quote';

/** 별지 제67호 영수증(95×135mm)을 A4에 그대로 배치한다. */
const SHEET = { width: 95, height: 135 };
const BLACK = '#1C1C1C';
const PLACE_LABELS = ['억', '천', '백', '십', '만', '천', '백', '십', '일'];
const PLACE_WIDTHS = [6, 6, 6, 6, 6, 5, 5, 5, 5];

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
    label: '사업장 주소',
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
  group: '영수 금액',
  help: '품목을 적으면 공급대가가 자동 계산됩니다. 품목 없이 금액만 적어도 됩니다.',
  minRows: 1,
  maxRows: 5,
  addLabel: '+ 품목 추가',
  required: false,
  summaryField: 'totalLabel',
  summaryLabel: '공급대가',
  columns: [
    {
      id: 'name',
      label: '품목',
      type: 'text' as const,
      placeholder: '품목명',
      maxLength: 60,
      width: 2.6,
    },
    { id: 'unitPrice', label: '단가', type: 'money' as const, placeholder: '0', width: 1.4 },
    { id: 'quantity', label: '수량', type: 'number' as const, placeholder: '1', width: 0.9 },
    {
      id: 'amount',
      label: '공급대가',
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

const fields: FormField[] = [
  { id: 'docNo', label: '일련번호', type: 'text', group: '문서', placeholder: 'RCT-20261120-001' },
  { id: 'date', label: '영수일', type: 'date', group: '문서', defaultToday: true, required: true },
  {
    id: 'copyType',
    label: '보관용',
    type: 'select',
    group: '문서',
    options: ['공급자용', '공급받는자용'],
    defaultValue: '공급자용',
  },
  ...supplierFields,
  {
    id: 'buyerCompany',
    label: '받는 곳(귀하)',
    type: 'text',
    group: '공급받는자',
    placeholder: '거래처 주식회사',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'amount',
    label: '영수 금액',
    type: 'text',
    group: '영수 금액',
    placeholder: '330000',
    maxLength: 20,
    help: '품목을 적지 않고 금액만 적을 때 사용합니다. 품목이 있으면 품목 합계가 우선입니다.',
  },
  { id: 'totalLabel', label: '공급대가', type: 'computed', group: '영수 금액' },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '거래 조건·특약 사항',
    maxLength: 120,
    rows: 2,
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

const totalOf = (values: Record<string, string>, rows: FormRows): number => {
  const list = toItems(rows);
  if (list.length > 0) return list.reduce((sum, row) => sum + itemAmount(row), 0);
  return parseAmount(values.amount ?? '');
};

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
  const note = mode === 'blank' ? '' : (values.note ?? '');
  const dateText = mode === 'blank' ? '년   월   일' : (values.date ?? '').replaceAll('-', '.');
  const itemRows: GridRow[] = Array.from({ length: 5 }, (_, index) => {
    const item = list[index];
    const amount = item ? itemAmount(item) : 0;
    return {
      height: 7,
      cells: [
        cell(item?.name ?? '', 40, { align: 'left', size: 6.8, padding: 1 }),
        cell(item?.unitPrice ? formatWon(item.unitPrice) : '', 15, {
          align: 'right',
          size: 6.8,
          padding: 1,
        }),
        cell(item?.quantity ? String(item.quantity) : '', 12, { size: 6.8 }),
        cell(amount > 0 ? formatWon(amount) : '', 28, {
          align: 'right',
          size: 6.8,
          padding: 1,
        }),
      ],
    };
  });

  return [
    {
      height: 12,
      cells: [
        cell('0303-1B', 15, { size: 7 }),
        cell('영   수   증', 50, { size: 14, bold: true }),
        cell('', 30, {}),
      ],
    },
    {
      height: 7,
      cells: [
        cell('근거 : 부가가치세법 시행규칙 제25조', 70, { align: 'left', size: 5.5, padding: 1 }),
        cell('권            호', 25, { size: 6 }),
      ],
    },
    {
      height: 8,
      cells: [
        { text: '공급자', vertical: true, rowSpan: 4, colSpan: 6, size: 6.5 },
        cell('등록번호', 20, { align: 'left', size: 6, padding: 1 }),
        cell('', 69, { field: 'supplierBiz', size: 7 }),
      ],
    },
    {
      height: 8,
      cells: [
        cell('상호', 20, { align: 'left', size: 6, padding: 1 }),
        cell('', 29, { field: 'supplierCompany', size: 7 }),
        cell('성명', 10, { size: 6 }),
        cell('', 30, { field: 'supplierCeo', size: 7 }),
      ],
    },
    {
      height: 8,
      cells: [
        cell('사업장 주소', 20, { align: 'left', size: 6, padding: 1 }),
        cell('', 69, { field: 'supplierAddress', align: 'left', size: 6.5, padding: 1 }),
      ],
    },
    {
      height: 8,
      cells: [
        cell('업태', 20, { align: 'left', size: 6, padding: 1 }),
        cell('', 24, { field: 'supplierType', align: 'left', size: 6.5, padding: 1 }),
        cell('종목', 10, { size: 6 }),
        cell('', 35, { field: 'supplierItem', align: 'left', size: 6.5, padding: 1 }),
      ],
    },
    {
      height: 7,
      cells: [
        cell('작 성', 15, { size: 6.5 }),
        cell('공 급 대 가', 50, { size: 7 }),
        cell('비 고', 30, { size: 6 }),
      ],
    },
    {
      height: 7,
      cells: [
        cell('년   월   일', 15, { size: 5 }),
        ...PLACE_LABELS.map((label, index) =>
          cell(label, PLACE_WIDTHS[index] ?? 5, {
            size: 4.2,
            valign: 'top',
            padding: 0.4,
          }),
        ),
        cell(note, 30, { rowSpan: 2, align: 'left', size: 6, padding: 1 }),
      ],
    },
    {
      height: 8,
      cells: [
        cell(dateText, 15, { size: 5 }),
        ...PLACE_WIDTHS.map((width) => cell('', width, { size: 4 })),
      ],
    },
    {
      height: 7,
      cells: [
        cell('품 목', 40, { size: 7 }),
        cell('단 가', 15, { size: 7 }),
        cell('수 량', 12, { size: 7 }),
        cell('공 급 대 가', 28, { size: 7 }),
      ],
    },
    ...itemRows,
    { height: 20, cells: [cell('', 95, {})] },
  ];
};

const digitOverlays = (
  value: number,
  labels: readonly string[],
  startX: number,
  widths: readonly number[],
  y: number,
): GridOverlay[] => {
  if (value <= 0) return [];
  const digits = String(Math.round(value));
  const offset = labels.length - digits.length;
  return [...digits].flatMap((digit, index) => {
    const column = offset + index;
    if (column < 0 || column >= widths.length) return [];
    const before = widths.slice(0, column).reduce((sum, width) => sum + width, 0);
    return [
      {
        x: startX + before + (widths[column] ?? 0) / 2,
        y,
        text: digit,
        size: 7.5,
        align: 'center' as const,
      },
    ];
  });
};

const printBlocks = (): FormBlock[] => [
  {
    kind: 'grid',
    columns: Array.from({ length: 95 }, () => 1),
    rows: gridRows,
    lineColor: BLACK,
    lineWidth: 0.16,
    overlays: (values, rows, mode) => {
      const total = mode === 'blank' ? 0 : totalOf(values, rows);
      const buyer = mode === 'blank' ? '' : (values.buyerCompany ?? '');
      const copy = mode === 'blank' ? '공급자용' : (values.copyType ?? '공급자용');
      return [
        { x: 40, y: 8.4, text: `(${copy})`, size: 5.2, align: 'center' },
        { x: 93, y: 3.2, field: 'docNo', size: 5, align: 'right' },
        ...digitOverlays(total, PLACE_LABELS, 15, PLACE_WIDTHS, 68.5),
        { x: 4, y: 118, text: '위 금액을 영수(청구)함', size: 8 },
        { x: 91, y: 128, text: buyer ? `${buyer}   귀하` : '귀하', size: 8, align: 'right' },
      ];
    },
  },
];

const blocks: FormBlock[] = [
  { kind: 'paragraph', text: '영수증', align: 'center', size: 16, bold: true, after: 2 },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '일련번호', field: 'docNo' },
      { label: '영수일', field: 'date' },
    ],
  },
  { kind: 'section', title: '공급자' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '상호', field: 'supplierCompany' },
      { label: '등록번호', field: 'supplierBiz' },
      { label: '성명', field: 'supplierCeo' },
      { label: '업태', field: 'supplierType' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '사업장 주소', field: 'supplierAddress' }] },
  { kind: 'section', title: '공급받는자' },
  { kind: 'kv', columns: 1, rows: [{ label: '받는 곳', field: 'buyerCompany' }] },
  {
    kind: 'table',
    columns: [
      { label: '품목', width: 38 },
      { label: '단가', width: 18, align: 'right' },
      { label: '수량', width: 12, align: 'right' },
      { label: '공급대가', width: 26, align: 'right' },
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
    rows: [{ label: '공급대가', field: 'totalLabel', strong: true }],
    width: 70,
  },
  { kind: 'section', title: '비고' },
  { kind: 'text', field: 'note', minLines: 2 },
];

export const standardReceipt: FormTemplate = {
  slug: 'standard-receipt',
  title: '영수증(표준)',
  family: 'finance',
  category: 'money',
  description:
    '별지 제67호 영수증(95×135mm)의 검은 격자와 공급자·공급대가·품목 칸을 그대로 재현해 A4에 인쇄하는 양식입니다.',
  keywords: ['영수증', '표준 영수증', '영수증 양식', '영수증 PDF', '공급자용 영수증'],
  updated: '2026-11-20',
  docPrefix: 'RCT',
  companyParty: 'supplier',
  sheet: { ...SHEET, padding: 0, border: false },
  showFooter: false,
  lead: '국세청 별지 제67호 영수증과 같은 검은 테두리, 공급자 칸, 공급대가 자릿수 칸, 품목 표를 그대로 옮겼습니다.',
  useCases: [
    '물품·용역 대금을 받고 영수증을 발급할 때',
    '공급자용·공급받는자용 영수증이 필요할 때',
    '품목별 공급대가를 한 장에 정리할 때',
    '간이영수증보다 정식 영수증 서식이 필요할 때',
  ],
  howTo: [
    '보관용(공급자용/공급받는자용)을 고릅니다.',
    '공급자 정보와 받는 곳을 적습니다.',
    '품목·단가·수량을 입력하거나 금액만 입력합니다.',
    'PDF로 내려받아 A4에 100% 크기로 인쇄합니다.',
  ],
  notes: [
    'A4에 95×135mm 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '한글(HWPX)은 A4 기본 여백으로 만들어집니다. 실제 영수증 크기로 인쇄하려면 PDF를 사용하세요.',
    '품목이 있으면 품목 합계가, 없으면 영수 금액이 자릿수 칸에 표시됩니다.',
    '영수증은 세금계산서·현금영수증을 대신하지 않습니다. 증빙 규정을 확인하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  groups: [items],
  blocks,
  printBlocks,
  compute: (values, rows) => {
    const total = totalOf(values, rows);
    return { totalLabel: total > 0 ? formatWon(total) : '' };
  },
  validate: () => [],
  sample: {
    docNo: 'RCT-20261120-001',
    date: '2026-11-20',
    copyType: '공급자용',
    supplierCompany: '옷깃 주식회사',
    supplierBiz: '123-45-67891',
    supplierCeo: '박대표',
    supplierAddress: '서울시 강남구 테헤란로 1',
    supplierType: '도소매',
    supplierItem: '사무용품',
    buyerCompany: '거래처 주식회사',
    note: '납품 후 14일 이내 입금',
  },
  sampleRows: {
    items: [{ name: '사무용품', unitPrice: '33000', quantity: '10' }],
  },
  faq: [
    {
      q: '간이영수증과 무엇이 다른가요?',
      a: '이 양식은 국세청 별지 제67호 영수증 서식으로, 공급자·공급대가·품목 칸을 갖춘 정식 영수증입니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '실제 영수증과 같은 95×135mm 크기로 A4 중앙에 배치됩니다. 인쇄 배율을 100%로 두세요.',
    },
    {
      q: '품목 없이 금액만 적을 수 있나요?',
      a: '네. 품목을 비우고 영수 금액만 입력하면 그 금액이 자릿수 칸에 표시됩니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성은 브라우저 안에서 이루어집니다.',
    },
  ],
  sources: [{ label: '국세청 — 부가가치세 영수증 서식', href: 'https://www.nts.go.kr/' }],
  related: [
    { label: '간이영수증 양식', href: '/forms/receipt/' },
    { label: '거래명세표 양식', href: '/forms/transaction-statement/' },
    { label: '세금계산서 양식', href: '/forms/tax-invoice/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
