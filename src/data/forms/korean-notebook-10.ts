import type { FormBlock } from '@/lib/doc/types';
import { evenColumns, notebookForm, notebookGrid, notebookHeader } from './notebook-kit';

const blocks: FormBlock[] = [
  notebookHeader(),
  notebookGrid({
    columns: evenColumns(10),
    rows: 14,
    rowHeight: 240 / 14,
    guide: true,
  }),
];

export const koreanNotebook10 = notebookForm({
  slug: 'korean-notebook-10',
  title: '국어 10칸 노트',
  description:
    '초등 저학년이 가장 많이 쓰는 국어 10칸 노트를 190×260mm 실제 공책 크기로 인쇄하는 양식입니다. 10칸×14줄에 점선 십자 안내선이 있습니다.',
  keywords: ['국어 노트', '10칸 노트', '초등 공책', '국어 공책', '쓰기 노트', '받아쓰기'],
  docPrefix: 'K10',
  lead: '10칸×14줄, 칸마다 점선 십자가 있는 국어 노트입니다. A4에 실제 공책 크기로 인쇄됩니다.',
  useCases: [
    '초등 저학년 국어 수업 공책으로',
    '받아쓰기·낱말 쓰기를 할 때',
    '학교 공책을 잃어버려 바로 출력할 때',
    '글자 크기와 간격을 고르게 연습할 때',
  ],
  blocks,
  sample: { studentName: '김옷깃', className: '2학년 1반', noteDate: '2026-11-20' },
  faq: [
    {
      q: '칸 크기는 얼마인가요?',
      a: '가로 19mm, 세로 약 17mm인 10칸×14줄입니다. 저학년이 쓰기 좋은 크기입니다.',
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
    { label: '국어 8칸 노트', href: '/forms/korean-notebook-8/' },
    { label: '국어 11칸 노트', href: '/forms/korean-notebook-11/' },
    { label: '한자 10칸 노트', href: '/forms/hanja-notebook-10/' },
  ],
});
