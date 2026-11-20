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

export const hanjaNotebook10 = notebookForm({
  slug: 'hanja-notebook-10',
  title: '한자 10칸 노트',
  description:
    '초등 한자 수업에 쓰는 한자 10칸 노트를 190×260mm 실제 공책 크기로 인쇄하는 양식입니다. 10칸×14줄에 점선 십자 안내선이 있습니다.',
  keywords: ['한자 노트', '한문 노트', '10칸 노트', '한자 공책', '초등 한자', '쓰기 노트'],
  docPrefix: 'H10',
  lead: '10칸×14줄, 점선 십자가 있는 한자 노트입니다. A4에 실제 공책 크기로 인쇄됩니다.',
  useCases: [
    '학교 한자 수업 공책으로',
    '한자 급수 시험을 준비할 때',
    '획순과 부수를 함께 익힐 때',
    '한문 공책을 바로 출력할 때',
  ],
  blocks,
  sample: { studentName: '김옷깃', className: '4학년 1반', noteDate: '2026-11-20' },
  faq: [
    {
      q: '칸 크기는 얼마인가요?',
      a: '가로 19mm, 세로 약 17mm인 10칸×14줄입니다. 한자를 한 칸에 하나씩 쓰기 좋습니다.',
    },
    {
      q: '십자 안내선은 무엇인가요?',
      a: '한자의 중심과 균형을 잡도록 칸 가운데에 점선 십자를 그립니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '190×260mm(16절) 공책 크기로 A4 중앙에 놓입니다. 인쇄 배율을 100%로 두세요.',
    },
  ],
  related: [
    { label: '한자 8칸 노트', href: '/forms/hanja-notebook-8/' },
    { label: '국어 10칸 노트', href: '/forms/korean-notebook-10/' },
    { label: '국어 11칸 노트', href: '/forms/korean-notebook-11/' },
  ],
});
