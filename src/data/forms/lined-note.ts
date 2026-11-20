import type {
  FormBlock,
  FormField,
  FormRows,
  FormTemplate,
  GridRow,
  RepeatGroup,
} from '@/lib/doc/types';

/** 사진 속 사무용 줄 노트(약 17×25cm). */
const SHEET = { width: 170, height: 250 };
const BLACK = '#1C1C1C';
const MIN_LINES = 8;
const MAX_LINES = 28;

const fields: FormField[] = [
  {
    id: 'lineCount',
    label: '줄 수',
    type: 'number',
    group: '줄 설정',
    defaultValue: '28',
    min: MIN_LINES,
    max: MAX_LINES,
    required: true,
    help: `8~${MAX_LINES}줄까지 만들 수 있습니다. 줄 수를 바꾸면 입력칸과 미리보기가 함께 바뀝니다.`,
  },
  { id: 'docNo', label: 'No.', type: 'text', group: '문서', placeholder: 'NTE-20261120-001' },
];

const lines: RepeatGroup = {
  id: 'lines',
  label: '노트 줄',
  group: '줄 설정',
  help: '한 줄에 하나씩 적습니다. 빈 줄은 그대로 빈 줄로 인쇄됩니다.',
  rowCountField: 'lineCount',
  initialRows: 28,
  minRows: MIN_LINES,
  maxRows: MAX_LINES,
  columns: [
    {
      id: 'text',
      label: '내용',
      type: 'text',
      maxLength: 50,
      placeholder: '이 줄에 적을 내용',
      width: 1,
    },
  ],
};

const clampCount = (value: string | undefined): number => {
  const count = Number(value);
  if (!Number.isFinite(count)) return 28;
  return Math.min(MAX_LINES, Math.max(MIN_LINES, Math.trunc(count)));
};

const gridRows = (
  values: Record<string, string>,
  rows: FormRows,
  mode: 'filled' | 'blank',
): readonly GridRow[] => {
  const count = clampCount(values.lineCount);
  const texts = mode === 'blank' ? [] : (rows.lines ?? []);
  const lineRows = Math.max(1, count);
  const height = 222 / lineRows;
  return [
    { height: 13, cells: [{ text: '' }] },
    ...Array.from({ length: lineRows }, (_, index) => ({
      height,
      cells: [
        {
          text: texts[index]?.text ?? '',
          align: 'left' as const,
          valign: 'bottom' as const,
          size: 7,
          padding: 1.5,
        },
      ],
    })),
    { height: 5, cells: [{ text: '' }] },
  ];
};

const printBlocks = (): FormBlock[] => [
  {
    kind: 'grid',
    columns: [160],
    rows: gridRows,
    x: 5,
    gapBefore: 5,
    lineColor: BLACK,
    lineWidth: 0.18,
    overlays: [
      { x: 124, y: 1.4, text: 'No.', size: 6.5 },
      { x: 136, y: 1.4, field: 'docNo', size: 6.5 },
    ],
  },
];

const blocks: FormBlock[] = [
  { kind: 'paragraph', text: '줄 노트', align: 'center', size: 16, bold: true, after: 2 },
  { kind: 'kv', columns: 1, rows: [{ label: 'No.', field: 'docNo' }] },
  {
    kind: 'table',
    columns: [{ label: ' ', width: 160 }],
    rows: (_values, rows) => (rows.lines ?? []).map((line) => [line.text ?? '']),
    minRows: 28,
  },
];

const sampleLines = ['11월 20일 회의 메모', '− 예산 검토', '− 다음 주 일정 확인'];

export const linedNote: FormTemplate = {
  slug: 'lined-note',
  title: '줄 노트',
  family: 'admin',
  category: 'report',
  description:
    '원하는 줄 수를 정해 각 줄에 내용을 입력하고, A4 안에 실제 노트 크기(170×250mm)로 인쇄하는 줄 노트 양식입니다.',
  keywords: ['줄 노트', '노트 양식', '사무용 노트', '기록지', '메모지', '줄공책'],
  updated: '2026-11-20',
  docPrefix: 'NTE',
  sheet: { ...SHEET, padding: 0, border: false },
  showFooter: false,
  lead: '줄 수를 8~28줄에서 고르고, 각 줄에 내용을 입력하면 그대로 인쇄되는 줄 노트입니다. A4에 실제 노트 크기로 중앙 배치됩니다.',
  useCases: [
    '원하는 줄 수의 사무용 노트를 만들 때',
    '회의 메모·기록지를 직접 만들 때',
    '줄마다 정해진 항목을 적을 때',
    '필기용 빈 양식을 대량으로 출력할 때',
  ],
  howTo: [
    '줄 수를 8~28줄에서 고릅니다.',
    '노트 줄에 한 줄씩 내용을 적습니다.',
    '필요하면 여러 줄을 한 번에 붙여넣습니다.',
    'PDF나 HWPX로 내려받아 A4에 100% 크기로 인쇄합니다.',
  ],
  notes: [
    'A4에 170×250mm 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '줄 수를 바꾸면 입력칸과 미리보기가 함께 바뀝니다. 내용이 있는 줄을 줄이면 확인을 거칩니다.',
    '줄 수가 많을수록 줄 간격이 좁아집니다. 28줄까지 한 장에 들어갑니다.',
    '한글(HWPX)도 PDF와 같은 줄 수·실제 크기로 만들어집니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  groups: [lines],
  blocks,
  printBlocks,
  sample: { lineCount: '28', docNo: 'NTE-20261120-001' },
  sampleRows: {
    lines: [
      ...sampleLines.map((text) => ({ text })),
      ...Array.from({ length: 25 }, () => ({ text: '' })),
    ],
  },
  faq: [
    {
      q: '줄 수를 바꿀 수 있나요?',
      a: '네. 8~28줄에서 고를 수 있고, 줄 수에 맞춰 입력칸과 미리보기가 함께 바뀝니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '170×250mm 크기로 A4 중앙에 배치됩니다. 인쇄 배율을 100%로 두세요.',
    },
    {
      q: '줄을 줄이면 내용이 사라지나요?',
      a: '내용이 있는 줄을 줄이면 확인을 거칩니다. 취소하면 줄 수가 원래대로 돌아갑니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성은 브라우저 안에서 이루어집니다.',
    },
  ],
  sources: [],
  related: [
    { label: '회의록 양식', href: '/forms/meeting-minutes/' },
    { label: '업무일지 양식', href: '/forms/work-daily/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
