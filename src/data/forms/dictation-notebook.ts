import type { FormBlock, FormRows, FormValues, GridRow } from '@/lib/doc/types';
import {
  NOTEBOOK_LINE,
  notebookFields,
  notebookForm,
  notebookHeader,
  traceCell,
  wordGroup,
} from './notebook-kit';

const ROWS = 14;
const COLUMNS = [10, ...Array.from({ length: 10 }, () => 18)];

const words = wordGroup({
  id: 'words',
  label: '받아쓰기 낱말',
  group: '받아쓰기 낱말',
  help: '한 줄에 낱말 하나씩 적습니다. 입력한 글자는 연한 회색으로 인쇄되어 그 위에 따라 쓸 수 있습니다.',
  rows: ROWS,
  columns: [{ id: 'word', label: '낱말', width: 1, maxLength: 20 }],
});

const gridRows = (
  _values: FormValues,
  rows: FormRows,
  mode: 'filled' | 'blank',
): readonly GridRow[] => {
  const list = mode === 'blank' ? [] : (rows.words ?? []);
  return Array.from({ length: ROWS }, (_, row) => {
    const letters = [...(list[row]?.word ?? '')];
    return {
      height: 17,
      cells: [
        {
          text: String(row + 1),
          size: 7,
          color: NOTEBOOK_LINE,
          align: 'center' as const,
          border: false,
        },
        ...Array.from({ length: 10 }, (_, column) => {
          const char = letters[column];
          return char ? traceCell(char, 18) : { guide: 'cross' as const };
        }),
      ],
    };
  });
};

const blocks: FormBlock[] = [
  notebookHeader(),
  {
    kind: 'grid',
    columns: COLUMNS,
    rows: gridRows,
    lineColor: NOTEBOOK_LINE,
    lineWidth: 0.12,
  },
];

export const dictationNotebook = notebookForm({
  slug: 'dictation-notebook',
  title: '받아쓰기 노트',
  description:
    '받아쓰기 낱말을 입력하면 연한 회색 정자체로 칸마다 인쇄되는 10칸 받아쓰기 노트입니다. 아이가 그 위에 따라 쓰며 연습합니다.',
  keywords: [
    '받아쓰기 노트',
    '받아쓰기 공책',
    '10칸 노트',
    '따라쓰기',
    '초등 국어',
    '받아쓰기 연습',
  ],
  docPrefix: 'DIC',
  lead: '받아쓰기 낱말을 한 줄에 하나씩 적으면 칸마다 연한 회색 정자체로 인쇄됩니다. 아이가 그 위에 따라 쓰며 연습하는 10칸 받아쓰기 노트입니다.',
  useCases: [
    '학교 받아쓰기 시험을 준비할 때',
    '집에서 낱말 따라쓰기를 시킬 때',
    '아이가 손글씨 크기와 간격을 익힐 때',
    '같은 낱말을 여러 번 연습할 때',
  ],
  fields: notebookFields,
  groups: [words],
  blocks,
  sample: {
    studentName: '김옷깃',
    className: '2학년 1반',
    noteDate: '2026-11-20',
  },
  sampleRows: {
    words: [
      { word: '학교' },
      { word: '가방' },
      { word: '연필' },
      { word: '지우개' },
      { word: '선생님' },
      ...Array.from({ length: 9 }, () => ({ word: '' })),
    ],
  },
  faq: [
    {
      q: '입력한 글자는 어떻게 인쇄되나요?',
      a: '칸마다 한 글자씩 연한 회색 정자체로 인쇄됩니다. 아이가 그 위에 진한 연필로 따라 쓰면 됩니다.',
    },
    {
      q: '낱말은 어떻게 적나요?',
      a: '한 줄에 낱말 하나씩 적습니다. 열 칸을 넘는 낱말은 열 글자까지 인쇄됩니다.',
    },
    {
      q: '빈 양식으로도 인쇄할 수 있나요?',
      a: '네. 빈 양식으로 바꾸면 회색 글씨 없이 점선 십자만 있는 빈 받아쓰기 노트가 인쇄됩니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '190×260mm(16절) 공책 크기로 A4 중앙에 놓입니다. 인쇄 배율을 100%로 두세요.',
    },
  ],
  related: [
    { label: '국어 10칸 노트', href: '/forms/korean-notebook-10/' },
    { label: '국어 11칸 노트', href: '/forms/korean-notebook-11/' },
    { label: '영어 단어장', href: '/forms/vocabulary-notebook/' },
  ],
  notes: [
    'A4에 190×260mm(16절) 실제 공책 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '입력한 낱말은 칸마다 한 글자씩 연한 회색으로 인쇄됩니다. 아이가 그 위에 따라 쓰도록 하세요.',
    '빈 양식으로 바꾸면 회색 글씨 없이 점선 십자만 남습니다.',
    '회색 글씨는 흑백 인쇄에서도 흐리게 보이도록 연하게 조정했습니다.',
    '입력값과 PDF 생성은 브라우저 안에서 이루어지며 서버로 전송되지 않습니다.',
  ],
});
