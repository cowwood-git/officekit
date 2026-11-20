import type {
  FormBlock,
  FormField,
  FormRows,
  FormTemplate,
  GridOverlay,
  GridRow,
  RepeatGroup,
} from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

/** 실제 출금전표(10.6×19cm)를 가로로 펼친 크기. */
const SHEET = { width: 190, height: 106 };
const RED = '#A63D40';

const fields: FormField[] = [
  { id: 'docNo', label: '문서 번호', type: 'text', group: '문서', placeholder: 'WDS-20261120-001' },
  { id: 'date', label: '거래일', type: 'date', group: '문서', defaultToday: true, required: true },
  {
    id: 'account',
    label: '과목',
    type: 'text',
    group: '출금 정보',
    placeholder: '예: 외상매출금',
    required: true,
    maxLength: 40,
  },
  {
    id: 'payee',
    label: '지급처',
    type: 'text',
    group: '출금 정보',
    placeholder: '예: 거래처 주식회사',
    maxLength: 60,
  },
  { id: 'totalLabel', label: '합계', type: 'computed', group: '출금 정보' },
];

const entries: RepeatGroup = {
  id: 'entries',
  label: '출금 내역',
  group: '출금 정보',
  help: '적요와 금액을 한 줄씩 추가합니다. 각 줄의 금액이 금액 칸에, 합계가 아래 합계 칸에 들어갑니다.',
  minRows: 1,
  maxRows: 8,
  addLabel: '+ 출금 내역 추가',
  required: true,
  summaryField: 'totalLabel',
  summaryLabel: '합계',
  columns: [
    {
      id: 'description',
      label: '적요',
      type: 'text',
      required: true,
      placeholder: '예: 11월 사무용품 납품 대금',
      maxLength: 40,
      width: 3.2,
    },
    {
      id: 'amount',
      label: '금액',
      type: 'money',
      placeholder: '0',
      width: 1.4,
    },
  ],
};

const columns = [8, 46, 12, 54, ...Array.from({ length: 9 }, () => 44 / 9), 26];
const amountWidths = Array.from({ length: 9 }, () => 44 / 9);

const toEntries = (rows: FormRows) =>
  (rows.entries ?? [])
    .map((row) => ({
      description: (row.description ?? '').trim(),
      amount: parseAmount(row.amount ?? ''),
    }))
    .filter((entry) => entry.description || entry.amount > 0);

const totalOf = (rows: FormRows): number =>
  toEntries(rows).reduce((sum, entry) => sum + entry.amount, 0);

const gridRows = (
  _values: Record<string, string>,
  rows: FormRows,
  mode: 'filled' | 'blank',
): readonly GridRow[] => {
  const list = mode === 'blank' ? [] : toEntries(rows);
  const digits = Array.from({ length: 9 }, () => ({ border: true }));
  const [year = '', month = '', day = ''] = (_values.date ?? '').split('-');
  const dateText =
    mode === 'blank' || !year
      ? '20        년        월        일'
      : `20${year.slice(2)}   년   ${month}   월   ${day}   일`;

  const approval = (label: string) => ({
    text: label,
    colSpan: 1,
    rowSpan: 2,
    border: true,
    size: 7,
  });

  const descRow = (index: number, span?: ReturnType<typeof approval>): GridRow => ({
    height: 7,
    cells: [
      {
        text: list[index]?.description ?? '',
        colSpan: 4,
        align: 'left',
        size: 6.5,
        padding: 1,
      },
      ...digits,
      ...(span ? [span] : []),
    ],
  });

  return [
    {
      height: 12,
      cells: [{ text: '출 금 전 표', colSpan: 14, size: 16, bold: true }],
    },
    { height: 1.2, cells: [{ text: '', colSpan: 14, size: 1, padding: 0.1 }] },
    {
      height: 7,
      cells: [{ text: dateText, colSpan: 13, size: 8 }, approval('사장')],
    },
    {
      height: 7,
      cells: [
        { text: '과목', size: 7 },
        { field: 'account', align: 'left', size: 7, padding: 1 },
        { text: '지급처', size: 7 },
        { field: 'payee', colSpan: 10, align: 'left', size: 7, padding: 1 },
      ],
    },
    {
      height: 7,
      cells: [
        { text: '적     요', colSpan: 4, size: 7 },
        { text: '금     액', colSpan: 9, size: 7 },
        approval('전무'),
      ],
    },
    descRow(0),
    descRow(1, approval('상무')),
    descRow(2),
    descRow(3, approval('부장')),
    descRow(4),
    descRow(5, approval('과장')),
    descRow(6),
    descRow(7, approval('계')),
    {
      height: 7,
      cells: [
        { text: '합     계', colSpan: 4, size: 7 },
        ...Array.from({ length: 9 }, () => ({
          text: '',
          colSpan: 1,
          border: true,
        })),
      ],
    },
    { height: 8.8, cells: [{ text: '', colSpan: 14 }] },
  ];
};

const digitOverlays = (
  value: number,
  startX: number,
  widths: readonly number[],
  y: number,
): GridOverlay[] => {
  if (value <= 0) return [];
  const digits = String(Math.round(value));
  const offset = widths.length - digits.length;
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
    columns,
    rows: gridRows,
    lineColor: RED,
    lineWidth: 0.18,
    overlays: (_values, rows, mode) => {
      const list = mode === 'blank' ? [] : toEntries(rows);
      const total = mode === 'blank' ? 0 : totalOf(rows);
      return [
        { x: 3, y: 2.4, text: 'No.', size: 6.5 },
        { x: 11, y: 2.4, field: 'docNo', size: 6.5 },
        ...list.flatMap((entry, index) =>
          digitOverlays(entry.amount, 120, amountWidths, 36.4 + index * 7),
        ),
        ...digitOverlays(total, 120, amountWidths, 92.4),
      ];
    },
  },
];

const blocks: FormBlock[] = [
  { kind: 'paragraph', text: '출금전표', align: 'center', size: 16, bold: true, after: 1 },
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
  { kind: 'section', title: '출금 정보' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '과목', field: 'account' },
      { label: '지급처', field: 'payee' },
    ],
  },
  { kind: 'section', title: '출금 내역' },
  {
    kind: 'table',
    columns: [
      { label: '적요', width: 52 },
      { label: '금액', width: 18, align: 'right' },
    ],
    rows: (_values, rows) =>
      toEntries(rows).map((entry) => [
        entry.description,
        entry.amount > 0 ? formatWon(entry.amount) : '',
      ]),
    minRows: 2,
  },
  {
    kind: 'totals',
    rows: [{ label: '합계', field: 'totalLabel', strong: true }],
    width: 70,
  },
];

export const withdrawalSlip: FormTemplate = {
  slug: 'withdrawal-slip',
  title: '출금전표',
  family: 'finance',
  category: 'money',
  description:
    '출금전표(10.6×19cm)의 격자와 과목·지급처·적요·금액 칸을 재현해 A4에 실제 크기로 인쇄합니다. 현금·계좌 출금 건을 회계 처리 전에 한 장씩 정리할 때 씁니다.',
  keywords: ['출금전표', '출금전표 양식', '출금전표 PDF', '회계 전표', '지출 전표'],
  updated: '2026-11-20',
  docPrefix: 'WDS',
  companyParty: 'supplier',
  sheet: { ...SHEET, padding: 0, border: false },
  showFooter: false,
  lead: '출금전표의 격자와 과목·지급처·적요·금액 칸을 그대로 옮겼습니다. 적요와 금액은 여러 줄로 입력할 수 있습니다.',
  useCases: [
    '지출 내역을 회계 전표로 남길 때',
    '거래처 지급을 확인할 때',
    '여러 건의 지출을 한 장에 정리할 때',
    '증빙과 승인을 함께 보관할 때',
  ],
  howTo: [
    '거래일과 과목·지급처를 적습니다.',
    '지출 내역에 적요와 금액을 한 줄씩 추가합니다.',
    '합계 칸에서 전체 금액을 확인합니다.',
    'PDF로 내려받아 A4에 100% 크기로 인쇄합니다.',
  ],
  notes: [
    'A4에 190×106mm(가로) 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '한글(HWPX)은 A4 기본 여백으로 만들어집니다. 실제 전표 크기로 인쇄하려면 PDF를 사용하세요.',
    '지출 내역은 적요·금액을 최대 8줄까지 적을 수 있고, 각 줄 금액이 합계에 더해집니다.',
    '회사 계정과목 체계에 맞춰 과목·지급처를 조정하세요.',
  ],
  fields,
  groups: [entries],
  blocks,
  printBlocks,
  compute: (_values, rows) => {
    const total = totalOf(rows);
    return { totalLabel: total > 0 ? formatWon(total) : '' };
  },
  validate: (_values, rows) => {
    const list = toEntries(rows);
    if (list.length === 0) return ['출금 내역을 한 줄 이상 입력하세요.'];
    if (list.some((entry) => entry.amount <= 0)) return ['각 줄의 금액을 1원 이상 입력하세요.'];
    return [];
  },
  sample: {
    docNo: 'WDS-20261120-001',
    date: '2026-11-20',
    account: '소모품비',
    payee: '거래처 주식회사',
  },
  sampleRows: {
    entries: [
      { description: '11월 사무용품 구입', amount: '200000' },
      { description: '배송비', amount: '130000' },
    ],
  },
  faq: [
    {
      q: '출금전표와 지출결의서는 무엇이 다른가요?',
      a: '출금전표는 회계 처리를 위한 내부 전표이고, 지출결의서는 지출 승인을 받기 위한 문서입니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '실제 출금전표와 같은 190×106mm(가로) 크기로 A4 중앙에 배치됩니다. 인쇄 배율을 100%로 두세요.',
    },
    {
      q: '적요와 금액을 여러 개 넣을 수 있나요?',
      a: '네. 지출 내역에 줄을 추가하면 적요와 금액을 각각 넣을 수 있고, 합계가 자동으로 계산됩니다.',
    },
  ],
  sources: [{ label: '국세청 — 증빙·장부 안내', href: 'https://www.nts.go.kr/' }],
  related: [
    { label: '지출결의서 양식', href: '/forms/expense-report/' },
    { label: '입금전표 양식', href: '/forms/deposit-slip/' },
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
