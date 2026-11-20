import type { FormBlock } from '@/lib/doc/types';
import { evenColumns, notebookForm, notebookGrid, notebookHeader } from './notebook-kit';

const blocks: FormBlock[] = [
  notebookHeader(),
  notebookGrid({
    columns: evenColumns(11),
    rows: 16,
    rowHeight: 15,
    guide: true,
  }),
];

export const koreanNotebook11 = notebookForm({
  slug: 'korean-notebook-11',
  title: '국어 11칸 노트',
  description:
    '초등 2학년 받아쓰기에 많이 쓰는 국어 11칸 노트를 190×260mm 실제 공책 크기로 인쇄하는 양식입니다. 11칸×16줄 구성입니다.',
  keywords: ['국어 노트', '11칸 노트', '초등 공책', '2학년 공책', '받아쓰기 노트', '쓰기 노트'],
  docPrefix: 'K11',
  lead: '2학년 받아쓰기 공책으로 많이 쓰는 11칸×16줄 국어 노트입니다. A4에 실제 공책 크기로 인쇄됩니다.',
  useCases: [
    '2학년 받아쓰기 공책으로',
    '문장을 한 줄에 길게 쓸 때',
    '낱말과 짧은 문장을 함께 연습할 때',
    '학교 공책을 바로 출력할 때',
  ],
  howTo: [
    '불러 주는 문장을 한 줄에 하나씩, 줄 첫 칸에 문제 번호를 적고 씁니다.',
    '띄어 쓸 자리는 한 칸을 비우고 문장 부호도 한 칸에 씁니다.',
    '채점 후 틀린 낱말은 아래 빈 줄에 바르게 세 번씩 고쳐 씁니다.',
    'PDF로 내려받아 A4 용지에 100% 배율로 인쇄합니다.',
  ],
  tips: ['16줄이라 받아쓰기 10문제와 고쳐 쓰기 줄을 한 장에 함께 담을 수 있습니다.'],
  blocks,
  sample: { studentName: '김옷깃', className: '2학년 1반', noteDate: '2026-11-20' },
  faq: [
    {
      q: '받아쓰기 급수표 문장을 미리 인쇄할 수 있나요?',
      a: '이 노트는 빈칸으로 인쇄됩니다. 문장을 연한 회색으로 미리 넣어 따라 쓰게 하려면 받아쓰기 노트 양식을 쓰세요.',
    },
    {
      q: '칸 크기는 얼마인가요?',
      a: '가로 약 17mm, 세로 15mm인 11칸×16줄입니다. 2학년 받아쓰기에 맞춘 구성입니다.',
    },
    {
      q: '10칸 노트와 무엇이 다른가요?',
      a: '한 줄에 한 칸 더 많아 문장을 길게 쓰기 좋습니다. 세로 줄도 16줄로 더 많습니다.',
    },
  ],
  related: [
    { label: '국어 10칸 노트', href: '/forms/korean-notebook-10/' },
    { label: '받아쓰기 노트', href: '/forms/dictation-notebook/' },
    { label: '국어 8칸 노트', href: '/forms/korean-notebook-8/' },
  ],
});
