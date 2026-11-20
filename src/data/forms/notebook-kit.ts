import type { FormBlock, FormField, GridCell, GridRow, RepeatGroup } from '@/lib/doc/types';

/** 실제 초등 공책 16절 크기(190×260mm). A4 중앙에 그대로 놓는다. */
export const NOTEBOOK_SHEET = { width: 190, height: 260 } as const;

/** 공책 선. 흑백 인쇄에서도 보이되 잉크를 아끼는 회색. */
export const NOTEBOOK_LINE = '#8C98A4';
export const NOTEBOOK_HAIR = '#C3CAD2';
/** 따라쓰기 글씨. 아이가 위에 덮어 쓸 수 있을 만큼만 진하다. */
export const TRACE_INK = '#C3CAD2';

export const notebookSheet = { ...NOTEBOOK_SHEET, padding: 0, border: false } as const;

export const notebookFields: readonly FormField[] = [
  {
    id: 'studentName',
    label: '이름',
    type: 'text',
    group: '이름표',
    placeholder: '김옷깃',
    maxLength: 20,
  },
  {
    id: 'className',
    label: '반',
    type: 'text',
    group: '이름표',
    placeholder: '1학년 1반',
    maxLength: 20,
  },
  {
    id: 'noteDate',
    label: '날짜',
    type: 'date',
    group: '이름표',
    defaultToday: true,
  },
];

/** 공책 맨 위 이름·반·날짜. 점선에 맞춰 손으로 쓸 수 있게 둔다. */
export const notebookHeader = (): FormBlock => ({
  kind: 'kv',
  columns: 3,
  rows: [
    { label: '이름', field: 'studentName' },
    { label: '반', field: 'className' },
    { label: '날짜', field: 'noteDate' },
  ],
});

export interface NotebookGridOptions {
  /** 열 너비(mm). */
  columns: readonly number[];
  rows: number;
  /** 행 높이(mm). */
  rowHeight: number;
  x?: number;
  gapBefore?: number;
  lineColor?: string;
  lineWidth?: number;
  /** 칸 가운데 점선 십자. 국어·한자 노트. */
  guide?: boolean;
  /** 셀 내용을 직접 만든다. 없으면 빈 칸. */
  cell?: (row: number, column: number) => GridCell | undefined;
}

export function notebookGrid(options: NotebookGridOptions): FormBlock {
  const rows: GridRow[] = Array.from({ length: options.rows }, (_, row) => ({
    height: options.rowHeight,
    cells: options.columns.map((_, column) => {
      const custom = options.cell?.(row, column);
      if (custom) return custom;
      return options.guide ? { guide: 'cross' as const } : {};
    }),
  }));
  return {
    kind: 'grid',
    columns: options.columns,
    rows,
    x: options.x,
    gapBefore: options.gapBefore ?? 0,
    lineColor: options.lineColor ?? NOTEBOOK_LINE,
    lineWidth: options.lineWidth ?? 0.12,
  };
}

/** 같은 너비의 칸을 만든다. */
export function evenColumns(
  count: number,
  width: number = NOTEBOOK_SHEET.width,
): readonly number[] {
  return Array.from({ length: count }, () => width / count);
}

/** 한 글자씩 칸에 넣을 때 쓰는 따라쓰기 셀. */
export const traceCell = (text: string, size = 16): GridCell => ({
  text,
  color: TRACE_INK,
  size,
  bold: false,
});

/** 낱말을 글자 단위로 나눠 칸에 채운다. */
export const traceLetters = (
  columns: number,
  word: string,
  startColumn: number,
  size = 16,
): GridCell[] =>
  Array.from({ length: columns }, (_, index) => {
    const char = [...word][index - startColumn];
    return char ? traceCell(char, size) : {};
  });

export const notebookNotes: readonly string[] = [
  'A4에 190×260mm(16절) 실제 공책 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
  '이름·반·날짜를 비워 두면 손으로 쓸 수 있게 빈칸으로 남고, 선은 흑백 인쇄에서도 보이는 연한 회색입니다.',
  '입력값과 PDF 생성은 브라우저 안에서 이루어지며 서버로 전송되지 않습니다.',
];

export const notebookHowTo: readonly string[] = [
  '이름·반·날짜를 적습니다.',
  '필요하면 예시 채우기로 미리보기를 확인합니다.',
  'PDF 또는 한글(HWPX)로 내려받습니다.',
  'A4 용지에 100% 크기로 인쇄합니다.',
];

export function wordGroup(options: {
  id: string;
  label: string;
  group: string;
  help?: string;
  rows: number;
  columns: readonly { id: string; label: string; width: number; maxLength?: number }[];
}): RepeatGroup {
  return {
    id: options.id,
    label: options.label,
    group: options.group,
    help: options.help,
    initialRows: options.rows,
    minRows: 1,
    maxRows: options.rows,
    columns: options.columns.map((column) => ({
      id: column.id,
      label: column.label,
      type: 'text' as const,
      maxLength: column.maxLength ?? 40,
      width: column.width,
    })),
  };
}

export interface NotebookFormOptions {
  slug: string;
  title: string;
  description: string;
  keywords: readonly string[];
  lead: string;
  useCases: readonly string[];
  howTo?: readonly string[];
  notes?: readonly string[];
  /** 이 공책만의 쓰임·고르는 법. 공통 안내 앞에 붙는다. */
  tips?: readonly string[];
  docPrefix?: string;
  fields?: readonly FormField[];
  groups?: readonly RepeatGroup[];
  blocks: readonly FormBlock[];
  printBlocks?: (options: { attachment: boolean }) => readonly FormBlock[];
  sample: Record<string, string>;
  sampleRows?: Record<string, readonly Record<string, string>[]>;
  faq: readonly { q: string; a: string }[];
  related?: readonly { label: string; href: string }[];
}

/** 공책 12종이 함께 쓰는 뼈대. 크기·이름표·안내 문구를 한 곳에서 맞춘다. */
export function notebookForm(options: NotebookFormOptions): import('@/lib/doc/types').FormTemplate {
  return {
    slug: options.slug,
    title: options.title,
    family: 'admin',
    category: 'school',
    description: options.description,
    keywords: options.keywords,
    updated: '2026-11-20',
    docPrefix: options.docPrefix,
    sheet: notebookSheet,
    showFooter: false,
    lead: options.lead,
    useCases: options.useCases,
    howTo: options.howTo ?? notebookHowTo,
    notes: options.notes ?? [...(options.tips ?? []), ...notebookNotes],
    fields: options.fields ?? notebookFields,
    groups: options.groups,
    blocks: options.blocks,
    printBlocks: options.printBlocks,
    sample: options.sample,
    sampleRows: options.sampleRows as import('@/lib/doc/types').FormRows | undefined,
    faq: options.faq,
    sources: [
      { label: '국가교육과정정보센터 — 초등학교 교육과정', href: 'https://www.ncic.go.kr/' },
      {
        label: '국립국어원 — 한국어 어문 규범',
        href: 'https://korean.go.kr/kornorms/main/main.do',
      },
    ],
    related: options.related,
  };
}
