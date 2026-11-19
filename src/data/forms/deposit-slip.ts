import { formatKoreanAmount } from '@/lib/doc/format';
import type { FormBlock, FormField, FormTemplate, GridRow } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

/** 실제 입금전표(10.6×19cm)를 가로로 펼친 크기. */
const SHEET = { width: 190, height: 106 };
const PURPLE = '#8C2F6B';

const fields: FormField[] = [
  { id: 'docNo', label: '문서 번호', type: 'text', group: '문서', placeholder: 'DP-20261118-001' },
  { id: 'date', label: '거래일', type: 'date', group: '문서', defaultToday: true, required: true },
  {
    id: 'account',
    label: '과목',
    type: 'text',
    group: '입금 정보',
    placeholder: '예: 외상매출금',
    required: true,
    maxLength: 40,
  },
  {
    id: 'item',
    label: '항목',
    type: 'text',
    group: '입금 정보',
    placeholder: '예: 11월 납품 대금',
    maxLength: 60,
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
    id: 'description',
    label: '적요',
    type: 'textarea',
    group: '내용',
    placeholder: '입금 내용과 거래 조건',
    maxLength: 300,
    rows: 3,
    span: 3,
  },
];

const columns = [8, 50, 8, 54, ...Array.from({ length: 9 }, () => 44 / 9), 26];

const splitLines = (text: string, lines: number): string[] => {
  const clean = text.replace(/\s+/g, ' ').trim();
  const result: string[] = [];
  let rest = clean;
  while (rest && result.length < lines) {
    result.push(rest.slice(0, 36));
    rest = rest.slice(36);
  }
  return result;
};

const gridRows = (
  values: Record<string, string>,
  _rows: Record<string, Record<string, string>[]>,
  mode: 'filled' | 'blank',
): readonly GridRow[] => {
  const digits = Array.from({ length: 9 }, () => ({ border: true }));
  const description = mode === 'blank' ? '' : (values.description ?? '');
  const lines = splitLines(description, 8);
  const [year = '', month = '', day = ''] = (values.date ?? '').split('-');
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
      { text: lines[index] ?? '', colSpan: 4, align: 'left', size: 7 },
      ...digits,
      ...(span ? [span] : []),
    ],
  });

  return [
    {
      height: 12,
      cells: [{ text: '입 금 전 표', colSpan: 14, size: 16, bold: true }],
    },
    { height: 1.2, cells: [{ text: '', colSpan: 14 }] },
    {
      height: 7,
      cells: [{ text: dateText, colSpan: 13, size: 8 }, approval('사장')],
    },
    {
      height: 7,
      cells: [
        { text: '과목', size: 7 },
        { field: 'account', align: 'left' },
        { text: '항목', size: 7 },
        { field: 'item', colSpan: 10, align: 'left' },
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
        {
          field: 'amountLabel',
          colSpan: 9,
          align: 'right',
          size: 8,
          bold: true,
        },
      ],
    },
    { height: 8.8, cells: [{ text: '', colSpan: 14 }] },
  ];
};

const printBlocks = (): FormBlock[] => [
  {
    kind: 'grid',
    columns,
    rows: gridRows,
    lineColor: PURPLE,
    lineWidth: 0.18,
    overlays: [
      { x: 3, y: 2.4, text: 'No.', size: 6.5 },
      { x: 11, y: 2.4, field: 'docNo', size: 6.5 },
      { x: 163, y: 36.2, field: 'amountLabel', size: 7.5, align: 'right' },
    ],
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
      { label: '과목', field: 'account' },
      { label: '항목', field: 'item' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '금액', field: 'amountLabel' }] },
  { kind: 'section', title: '내용' },
  { kind: 'text', field: 'description', minLines: 3 },
];

export const depositSlip: FormTemplate = {
  slug: 'deposit-slip',
  title: '입금전표',
  family: 'finance',
  category: 'money',
  description:
    '입금전표(10.6×19cm)의 자주색 격자와 과목·항목·적요·금액 칸을 그대로 재현해 A4에 인쇄하는 양식입니다.',
  keywords: ['입금전표', '입금전표 양식', '입금전표 PDF', '회계 전표', '입금 확인'],
  updated: '2026-11-18',
  docPrefix: 'DP',
  companyParty: 'supplier',
  sheet: { ...SHEET, padding: 0, border: false },
  showFooter: false,
  lead: '사진 속 입금전표와 같은 자주색 선, 과목·항목·적요·금액 칸을 그대로 옮겼습니다. A4에 실제 전표 크기로 중앙 배치됩니다.',
  useCases: [
    '입금 내역을 회계 전표로 남길 때',
    '거래처 입금을 확인할 때',
    '계정과목과 적요를 정리할 때',
    '증빙과 승인을 함께 보관할 때',
  ],
  howTo: [
    '거래일과 과목·항목을 적습니다.',
    '입금액과 적요를 입력합니다.',
    '합계 칸에서 금액을 확인합니다.',
    'PDF로 내려받아 A4에 100% 크기로 인쇄합니다.',
  ],
  notes: [
    'A4에 190×106mm(가로) 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '한글(HWPX)은 A4 기본 여백으로 만들어집니다. 실제 전표 크기로 인쇄하려면 PDF를 사용하세요.',
    '회사 계정과목 체계에 맞춰 과목·항목을 조정하세요.',
    '입금액과 실제 통장 거래 내역을 대조하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  blocks,
  printBlocks,
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
    item: '11월 사무용품 납품 대금',
    amount: '330000',
    description: '11월 사무용품 납품 대금 입금',
  },
  faq: [
    {
      q: '입금전표와 입금확인서는 무엇이 다른가요?',
      a: '입금전표는 회계 처리를 위한 내부 전표이고, 입금확인서는 거래처에 입금 사실을 알리는 문서입니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '실제 입금전표와 같은 190×106mm(가로) 크기로 A4 중앙에 배치됩니다. 인쇄 배율을 100%로 두세요.',
    },
    {
      q: '과목과 항목은 어떻게 적나요?',
      a: '회사에서 쓰는 계정과목과 거래 항목을 적습니다. 예: 과목 외상매출금, 항목 11월 납품 대금.',
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
