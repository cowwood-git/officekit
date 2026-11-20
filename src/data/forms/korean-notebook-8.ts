import type { FormBlock } from '@/lib/doc/types';
import { evenColumns, notebookForm, notebookGrid, notebookHeader } from './notebook-kit';

const blocks: FormBlock[] = [
  notebookHeader(),
  notebookGrid({
    columns: evenColumns(8, 160),
    rows: 12,
    rowHeight: 20,
    x: 15,
    guide: true,
  }),
];

export const koreanNotebook8 = notebookForm({
  slug: 'korean-notebook-8',
  title: '국어 8칸 노트',
  description:
    '초등 1학년이 쓰는 20mm 국어 8칸 노트를 190×260mm 실제 공책 크기로 인쇄하는 양식입니다. 칸마다 점선 십자가 있어 글자 중심을 잡기 쉽습니다.',
  keywords: ['국어 노트', '8칸 노트', '초등 공책', '1학년 공책', '쓰기 노트', '받아쓰기'],
  docPrefix: 'K8',
  lead: '20mm 넉넉한 8칸에 점선 십자를 넣은 1학년 국어 노트입니다. A4에 실제 공책 크기로 인쇄됩니다.',
  useCases: [
    '1학년이 글자 크기를 익히며 쓸 때',
    '받아쓰기·낱말 쓰기 연습을 할 때',
    '집에서 국어 공책을 바로 출력할 때',
    '손글씨를 크게 연습할 때',
  ],
  blocks,
  sample: { studentName: '김옷깃', className: '1학년 1반', noteDate: '2026-11-20' },
  faq: [
    {
      q: '칸 크기는 얼마인가요?',
      a: '가로 20mm, 세로 20mm인 8칸×12줄입니다. 1학년이 쓰기 좋은 넉넉한 크기입니다.',
    },
    {
      q: '점선 십자는 무엇인가요?',
      a: '칸 가운데에 가로·세로 점선을 넣어 글자의 중심과 크기를 잡도록 돕는 안내선입니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '190×260mm(16절) 공책 크기로 A4 중앙에 놓입니다. 인쇄 배율을 100%로 두세요.',
    },
  ],
  related: [
    { label: '국어 10칸 노트', href: '/forms/korean-notebook-10/' },
    { label: '국어 11칸 노트', href: '/forms/korean-notebook-11/' },
    { label: '받아쓰기 노트', href: '/forms/dictation-notebook/' },
  ],
});
