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

/** 실제 세금계산서(12.8×18.2cm)를 가로로 펼친 크기. */
const SHEET = { width: 182, height: 128 };
const BLACK = '#1C1C1C';
const SUPPLY_LABELS = [
  '조',
  '천',
  '백',
  '십',
  '억',
  '천',
  '백',
  '십',
  '만',
  '천',
  '백',
  '십',
  '일',
];

const EXEMPT_WIDTHS = [8, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7, 6, 6];

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

const buyerFields: FormField[] = [
  {
    id: 'buyerCompany',
    label: '상호',
    type: 'text',
    group: '공급받는자',
    required: true,
    placeholder: '거래처 주식회사',
    maxLength: 60,
  },
  {
    id: 'buyerBiz',
    label: '등록번호',
    type: 'text',
    group: '공급받는자',
    placeholder: '220-81-62517',
    maxLength: 20,
  },
  {
    id: 'buyerCeo',
    label: '성명',
    type: 'text',
    group: '공급받는자',
    placeholder: '김대표',
    maxLength: 30,
  },
  {
    id: 'buyerAddress',
    label: '사업장소재지',
    type: 'text',
    group: '공급받는자',
    placeholder: '부산시 해운대구 센텀중앙로 90',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'buyerType',
    label: '업태',
    type: 'text',
    group: '공급받는자',
    placeholder: '제조업',
    maxLength: 40,
  },
  {
    id: 'buyerItem',
    label: '종목',
    type: 'text',
    group: '공급받는자',
    placeholder: '전자부품',
    maxLength: 40,
  },
];

const items = {
  id: 'items',
  label: '품목',
  group: '품목',
  help: '표준 계산서는 5줄까지 적습니다. 품목·수량·단가를 입력하면 공급가액이 계산됩니다.',
  minRows: 1,
  maxRows: 5,
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
      placeholder: '예: 사무용품',
      maxLength: 60,
      width: 2.4,
    },
    {
      id: 'spec',
      label: '규격',
      type: 'text' as const,
      placeholder: 'A4',
      maxLength: 30,
      width: 1,
    },
    { id: 'quantity', label: '수량', type: 'number' as const, placeholder: '1', width: 0.8 },
    { id: 'unitPrice', label: '단가', type: 'money' as const, placeholder: '0', width: 1.2 },
    {
      id: 'amount',
      label: '공급가액',
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
  { id: 'docNo', label: '일련번호', type: 'text', group: '문서', placeholder: 'EXI-20261120-001' },
  { id: 'date', label: '작성일', type: 'date', group: '문서', defaultToday: true, required: true },
  {
    id: 'copyType',
    label: '보관용',
    type: 'select',
    group: '문서',
    options: ['공급받는자용', '공급자용'],
    defaultValue: '공급받는자용',
  },
  { id: 'copyLabel', label: '보관용 표시', type: 'computed', group: '문서' },
  ...supplierFields,
  ...buyerFields,
  { id: 'supplyLabel', label: '공급가액', type: 'computed', group: '품목' },
  { id: 'totalLabel', label: '합계', type: 'computed', group: '품목' },
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
  const note = mode === 'blank' ? '' : (values.note ?? '');
  const [, month = '', day = ''] = (values.date ?? '').split('-');
  const monthDay = mode === 'blank' || !month || !day ? '' : `${month}/${day}`;
  const dateText = mode === 'blank' ? '' : (values.date ?? '').replaceAll('-', '.');
  const itemRows: GridRow[] = Array.from({ length: 5 }, (_, index) => {
    const item = list[index];
    const amount = item ? itemAmount(item) : 0;
    return {
      height: 7,
      cells: [
        cell(index === 0 ? monthDay : '', 17, { size: 7 }),
        cell(item?.name ?? '', 52, { align: 'left', size: 7 }),
        cell(item?.spec ?? '', 20, { align: 'left', size: 7 }),
        cell(item?.quantity ? String(item.quantity) : '', 15, { size: 7 }),
        cell(item?.unitPrice ? formatWon(item.unitPrice) : '', 25, {
          align: 'right',
          size: 7,
        }),
        cell(amount > 0 ? formatWon(amount) : '', 33, { align: 'right', size: 7 }),
        cell('', 20, { align: 'left', size: 6.5 }),
      ],
    };
  });

  return [
    {
      height: 8,
      cells: [
        cell('계 산 서', 74, { size: 18, bold: true, rowSpan: 2 }),
        cell('', 36, { field: 'copyLabel', size: 7, rowSpan: 2 }),
        cell('책 번 호', 18, { size: 6.5 }),
        cell('권', 12, { size: 6.5 }),
        cell('', 22, {}),
        cell('호', 20, { size: 6.5 }),
      ],
    },
    {
      height: 7,
      cells: [cell('일련번호', 18, { size: 6.5 }), cell('', 54, { field: 'docNo', size: 8 })],
    },
    {
      height: 9,
      cells: [
        { text: '공급자', vertical: true, rowSpan: 4, colSpan: 8, size: 7.5 },
        cell('등록번호', 20, { align: 'left', size: 6.5, padding: 1 }),
        cell('', 18, {}),
        cell('-', 4, { size: 5 }),
        cell('', 12, {}),
        cell('-', 4, { size: 5 }),
        cell('', 25, {}),
        { text: '공급받는자', vertical: true, rowSpan: 4, colSpan: 8, size: 7 },
        cell('등록번호', 20, { align: 'left', size: 6.5, padding: 1 }),
        cell('', 18, {}),
        cell('-', 4, { size: 5 }),
        cell('', 12, {}),
        cell('-', 4, { size: 5 }),
        cell('', 25, {}),
      ],
    },
    {
      height: 9,
      cells: [
        cell('상호(법인명)', 20, { align: 'left', size: 6.2, padding: 1 }),
        cell('', 34, { field: 'supplierCompany', align: 'center', size: 7.5 }),
        cell('성명', 9, { size: 6.2 }),
        cell('', 14, { field: 'supplierCeo', align: 'center', size: 7.5 }),
        cell('(인)', 6, { size: 4.5, padding: 0.4 }),
        cell('상호(법인명)', 20, { align: 'left', size: 6.2, padding: 1 }),
        cell('', 34, { field: 'buyerCompany', align: 'center', size: 7.5 }),
        cell('성명', 9, { size: 6.2 }),
        cell('', 14, { field: 'buyerCeo', align: 'center', size: 7.5 }),
        cell('(인)', 6, { size: 4.5, padding: 0.4 }),
      ],
    },
    {
      height: 10,
      cells: [
        cell('사업장소재지', 20, { align: 'left', size: 6.2, padding: 1 }),
        cell('', 63, { field: 'supplierAddress', align: 'left', size: 7, padding: 1.5 }),
        cell('사업장소재지', 20, { align: 'left', size: 6.2, padding: 1 }),
        cell('', 63, { field: 'buyerAddress', align: 'left', size: 7, padding: 1.5 }),
      ],
    },
    {
      height: 9,
      cells: [
        cell('업태', 20, { align: 'left', size: 6.2, padding: 1 }),
        cell('', 30, { field: 'supplierType', align: 'left', size: 7, padding: 1.5 }),
        cell('종목', 9, { size: 6.2 }),
        cell('', 24, { field: 'supplierItem', align: 'left', size: 7, padding: 1.5 }),
        cell('업태', 20, { align: 'left', size: 6.2, padding: 1 }),
        cell('', 30, { field: 'buyerType', align: 'left', size: 7, padding: 1.5 }),
        cell('종목', 9, { size: 6.2 }),
        cell('', 24, { field: 'buyerItem', align: 'left', size: 7, padding: 1.5 }),
      ],
    },
    {
      height: 5,
      cells: [
        cell('작 성', 17, { size: 6 }),
        cell('공 급 가 액', 105, { size: 7 }),
        cell(note, 60, { rowSpan: 2, align: 'left', size: 6, padding: 1 }),
      ],
    },
    {
      height: 11,
      cells: [
        cell(mode === 'blank' ? '년   월   일' : dateText, 17, { size: 5 }),
        cell('공란수', 11, { size: 4.2, valign: 'top', padding: 0.4 }),
        ...SUPPLY_LABELS.map((label, index) =>
          cell(label, EXEMPT_WIDTHS[index] ?? 6, {
            size: 4.2,
            valign: 'top',
            padding: 0.4,
          }),
        ),
      ],
    },
    {
      height: 7,
      cells: [
        cell('월 일', 17, { size: 7 }),
        cell('품 목', 52, { size: 7 }),
        cell('규 격', 20, { size: 7 }),
        cell('수 량', 15, { size: 7 }),
        cell('단 가', 25, { size: 7 }),
        cell('공 급 가 액', 33, { size: 7 }),
        cell('비 고', 20, { size: 7 }),
      ],
    },
    ...itemRows,
    {
      height: 10,
      cells: [
        cell('합 계 금 액', 17, { size: 6.5 }),
        cell('', 45, { field: 'totalLabel', align: 'right', size: 8, bold: true, padding: 1.5 }),
        cell('현 금', 12, { size: 6.2, padding: 0.4 }),
        cell('', 12, {}),
        cell('수 표', 12, { size: 6.2, padding: 0.4 }),
        cell('', 12, {}),
        cell('어 음', 12, { size: 6.2, padding: 0.4 }),
        cell('', 12, {}),
        cell('외상미수금', 12, { size: 5.2, padding: 0.4 }),
        cell('', 36, {}),
      ],
    },
    { height: 8, cells: [cell('', 182, {})] },
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

const bizGroups = (value: string): string[] => {
  const digits = value.replace(/\D/g, '');
  return [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 10)];
};

const businessOverlays = (value: string, centers: readonly number[], y: number): GridOverlay[] =>
  bizGroups(value).flatMap((group, index) =>
    group ? [{ x: centers[index] ?? 0, y, text: group, size: 7, align: 'center' as const }] : [],
  );

const printBlocks = (): FormBlock[] => [
  {
    kind: 'grid',
    columns: Array.from({ length: 182 }, () => 1),
    rows: gridRows,
    lineColor: BLACK,
    lineWidth: 0.16,
    overlays: (values, rows, mode) => {
      const list = mode === 'blank' ? [] : toItems(rows);
      const supply = list.reduce((sum, row) => sum + itemAmount(row), 0);
      return [
        ...businessOverlays(
          mode === 'blank' ? '' : (values.supplierBiz ?? ''),
          [37, 56, 78.5],
          17.8,
        ),
        ...businessOverlays(
          mode === 'blank' ? '' : (values.buyerBiz ?? ''),
          [128, 147, 169.5],
          17.8,
        ),
        ...digitOverlays(supply, SUPPLY_LABELS, 28, EXEMPT_WIDTHS, 63.6),
        { x: 164, y: 114.6, text: '위 금액을 영수(청구)함', size: 5.8, align: 'center' },
        { x: 2, y: 121.5, text: '(면세사업자용)', size: 4.5 },
      ];
    },
  },
];

const blocks: FormBlock[] = [
  { kind: 'paragraph', text: '계산서', align: 'center', size: 18, bold: true, after: 1 },
  {
    kind: 'paragraph',
    text: 'TAX EXEMPT INVOICE',
    align: 'center',
    size: 6,
    bold: true,
    color: '#0B6B5B',
    after: 3,
  },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '일련번호', field: 'docNo' },
      { label: '작성일', field: 'date' },
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
  { kind: 'kv', columns: 1, rows: [{ label: '사업장소재지', field: 'supplierAddress' }] },
  { kind: 'section', title: '공급받는자' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '상호', field: 'buyerCompany' },
      { label: '등록번호', field: 'buyerBiz' },
      { label: '성명', field: 'buyerCeo' },
      { label: '업태', field: 'buyerType' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '사업장소재지', field: 'buyerAddress' }] },
  { kind: 'section', title: '품목' },
  {
    kind: 'table',
    columns: [
      { label: '품목', width: 52 },
      { label: '규격', width: 20 },
      { label: '수량', width: 15, align: 'right' },
      { label: '단가', width: 25, align: 'right' },
      { label: '공급가액', width: 33, align: 'right' },
    ],
    rows: (_values, rows) =>
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
    rows: [{ label: '공급가액', field: 'totalLabel', strong: true }],
    width: 74,
  },
  { kind: 'section', title: '비고' },
  { kind: 'text', field: 'note', minLines: 2 },
];

export const taxExemptInvoice: FormTemplate = {
  slug: 'tax-exempt-invoice',
  title: '계산서(면세)',
  family: 'finance',
  category: 'money',
  description:
    '면세사업자용 계산서(12.8×18.2cm)의 공급자·공급받는자·공급가액·품목 칸을 재현해 A4에 인쇄하는 양식입니다.',
  keywords: ['계산서', '면세 계산서', '계산서 양식', '면세사업자 계산서', '계산서 PDF'],
  updated: '2026-11-20',
  docPrefix: 'EXI',
  companyParty: 'supplier',
  sheet: { ...SHEET, padding: 0, border: false },
  showFooter: false,
  lead: '면세사업자용 계산서의 검은 격자와 공급자·공급받는자·공급가액·품목 칸을 그대로 옮겼습니다.',
  useCases: [
    '면세사업자가 계산서를 발급할 때',
    '세금계산서 대신 면세 거래 증빙이 필요할 때',
    '공급자·공급받는자 정보를 함께 남길 때',
    '계산서 발급 전 내용을 검토할 때',
  ],
  howTo: [
    '작성일과 일련번호, 보관용을 확인합니다.',
    '공급자와 공급받는자의 등록번호·상호·주소를 적습니다.',
    '품목·수량·단가를 입력하면 공급가액이 계산됩니다.',
    'PDF로 내려받아 A4에 100% 크기로 인쇄합니다.',
  ],
  notes: [
    'A4에 182×128mm(가로) 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '한글(HWPX)은 A4 기본 여백으로 만들어집니다. 실제 전표 크기로 인쇄하려면 PDF를 사용하세요.',
    '이 계산서는 면세사업자용입니다. 과세 거래에는 세금계산서를 발급하세요.',
    '사업자번호와 공급가액을 발급 전에 반드시 확인하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  groups: [items],
  blocks,
  printBlocks,
  compute: (values, rows) => {
    const supply = toItems(rows).reduce((sum, row) => sum + itemAmount(row), 0);
    return {
      copyLabel: `(${values.copyType ?? '공급받는자용'})`,
      supplyLabel: formatWon(supply),
      totalLabel: formatWon(supply),
    };
  },
  validate: (_values, rows) =>
    toItems(rows).length === 0 ? ['품목을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'EXI-20261120-001',
    date: '2026-11-20',
    copyType: '공급받는자용',
    supplierCompany: '옷깃 주식회사',
    supplierBiz: '123-45-67891',
    supplierCeo: '박대표',
    supplierAddress: '서울시 강남구 테헤란로 1',
    supplierType: '도소매',
    supplierItem: '사무용품',
    buyerCompany: '거래처 주식회사',
    buyerBiz: '220-81-62517',
    buyerCeo: '김대표',
    buyerAddress: '부산시 해운대구 센텀중앙로 90',
    buyerType: '제조업',
    buyerItem: '전자부품',
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
      q: '세금계산서와 무엇이 다른가요?',
      a: '계산서는 면세사업자가 발급하는 증빙이고, 세금계산서는 과세 거래에서 부가세를 포함해 발급합니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '실제 계산서와 같은 182×128mm(가로) 크기로 A4 중앙에 배치됩니다. 인쇄 배율을 100%로 두세요.',
    },
    {
      q: '공급자용과 공급받는자용을 따로 인쇄할 수 있나요?',
      a: '보관용에서 선택하면 제목의 보관용 표시가 바뀝니다. 필요하면 두 번 인쇄해 각각 보관하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성은 브라우저 안에서 이루어집니다.',
    },
  ],
  sources: [
    { label: '국세청 — 계산서 안내', href: 'https://www.nts.go.kr/' },
    { label: '국가법령정보센터 — 부가가치세법', href: 'https://www.law.go.kr/' },
  ],
  related: [
    { label: '세금계산서 양식', href: '/forms/tax-invoice/' },
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: '입금전표 양식', href: '/forms/deposit-slip/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
