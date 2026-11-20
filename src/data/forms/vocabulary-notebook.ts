import type { FormBlock, FormRows, FormValues, GridRow } from '@/lib/doc/types';
import {
  NOTEBOOK_LINE,
  notebookFields,
  notebookForm,
  notebookHeader,
  traceCell,
  wordGroup,
} from './notebook-kit';

const ROWS = 15;
const COLUMNS = [64, 58, 68];

const words = wordGroup({
  id: 'words',
  label: '단어',
  group: '단어',
  help: '단어·뜻·예문을 한 줄에 하나씩 적습니다. 단어 칸은 연한 회색으로 인쇄되어 따라 쓸 수 있습니다.',
  rows: ROWS,
  columns: [
    { id: 'word', label: '단어', width: 2.2, maxLength: 24 },
    { id: 'meaning', label: '뜻', width: 2, maxLength: 40 },
    { id: 'example', label: '예문', width: 2.4, maxLength: 60 },
  ],
});

const gridRows = (
  _values: FormValues,
  rows: FormRows,
  mode: 'filled' | 'blank',
): readonly GridRow[] => {
  const list = mode === 'blank' ? [] : (rows.words ?? []);
  return Array.from({ length: ROWS }, (_, row) => {
    const item = list[row] ?? {};
    return {
      height: 15.6,
      cells: [
        item.word
          ? { ...traceCell(item.word, 13), align: 'left' as const, padding: 2 }
          : { align: 'left' as const, padding: 2 },
        item.meaning
          ? { text: item.meaning, size: 8.5, color: '#14181f', align: 'left' as const, padding: 2 }
          : { align: 'left' as const, padding: 2 },
        item.example
          ? { text: item.example, size: 7.5, color: '#14181f', align: 'left' as const, padding: 2 }
          : { align: 'left' as const, padding: 2 },
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

export const vocabularyNotebook = notebookForm({
  slug: 'vocabulary-notebook',
  title: '영어 단어장',
  description:
    '영어 단어·뜻·예문을 입력하면 단어 칸이 연한 회색으로 인쇄되는 초등 영어 단어장입니다. 아이가 단어 위에 따라 쓰며 외웁니다.',
  keywords: ['영어 단어장', '단어 노트', '영어 공책', '초등 영어', '따라쓰기', '단어 시험'],
  docPrefix: 'VOC',
  lead: '영어 단어·뜻·예문을 적으면 단어 칸이 연한 회색으로 인쇄됩니다. 아이가 단어 위에 따라 쓰며 외우는 초등 영어 단어장입니다.',
  useCases: [
    '영어 단어 시험을 준비할 때',
    '단어·뜻·예문을 한 장에 정리할 때',
    '아이가 단어를 따라 쓰며 외울 때',
    '학원·학교 영어 숙제를 할 때',
  ],
  fields: notebookFields,
  groups: [words],
  blocks,
  sample: {
    studentName: '김옷깃',
    className: '4학년 1반',
    noteDate: '2026-11-20',
  },
  sampleRows: {
    words: [
      { word: 'family', meaning: '가족', example: 'My family is happy.' },
      { word: 'mother', meaning: '어머니', example: 'My mother is a teacher.' },
      { word: 'father', meaning: '아버지', example: 'My father cooks well.' },
      { word: 'sister', meaning: '자매', example: 'I have one sister.' },
      { word: 'brother', meaning: '형제', example: 'My brother is tall.' },
      ...Array.from({ length: 10 }, () => ({ word: '', meaning: '', example: '' })),
    ],
  },
  faq: [
    {
      q: '단어 칸은 어떻게 인쇄되나요?',
      a: '입력한 단어가 연한 회색 정자체로 인쇄됩니다. 아이가 그 위에 진한 연필로 따라 쓰며 외웁니다.',
    },
    {
      q: '뜻과 예문도 인쇄되나요?',
      a: '네. 뜻과 예문은 진한 글씨로 함께 인쇄되어 참고할 수 있습니다. 필요 없으면 비워 두세요.',
    },
    {
      q: '빈 양식으로도 인쇄할 수 있나요?',
      a: '네. 빈 양식으로 바꾸면 회색 글씨 없이 빈 단어장이 인쇄됩니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '190×260mm(16절) 공책 크기로 A4 중앙에 놓입니다. 인쇄 배율을 100%로 두세요.',
    },
  ],
  related: [
    { label: '영어 4선 노트', href: '/forms/english-notebook-4/' },
    { label: '영어 3선 노트', href: '/forms/english-notebook-3/' },
    { label: '받아쓰기 노트', href: '/forms/dictation-notebook/' },
  ],
  notes: [
    'A4에 190×260mm(16절) 실제 공책 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '단어 칸은 연한 회색으로 인쇄되어 아이가 위에 따라 쓸 수 있습니다.',
    '뜻과 예문은 진한 글씨로 인쇄됩니다. 비워 두면 빈 칸으로 남습니다.',
    '빈 양식으로 바꾸면 회색 글씨 없이 빈 단어장이 인쇄됩니다.',
    '입력값과 PDF 생성은 브라우저 안에서 이루어지며 서버로 전송되지 않습니다.',
  ],
});
