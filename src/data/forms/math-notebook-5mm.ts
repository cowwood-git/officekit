import type { FormBlock } from '@/lib/doc/types';
import { notebookForm, notebookGrid, notebookHeader } from './notebook-kit';

const blocks: FormBlock[] = [
  notebookHeader(),
  notebookGrid({
    columns: Array.from({ length: 38 }, () => 5),
    rows: 48,
    rowHeight: 5,
    lineColor: '#D5DBE1',
    lineWidth: 0.1,
  }),
];

export const mathNotebook5mm = notebookForm({
  slug: 'math-notebook-5mm',
  title: '수학 5mm 모눈 노트',
  description:
    '초등 수학 문제 풀이에 가장 많이 쓰는 5mm 모눈 노트를 190×260mm 실제 공책 크기로 인쇄하는 양식입니다. 38×48칸입니다.',
  keywords: ['수학 노트', '모눈 노트', '5mm 모눈', '수학 공책', '방안 노트', '오답 노트'],
  docPrefix: 'M5',
  lead: '5mm 모눈 38×48칸 수학 노트입니다. A4에 실제 공책 크기로 인쇄됩니다.',
  useCases: [
    '수학 문제를 식과 함께 풀 때',
    '도형·그래프를 정확히 그릴 때',
    '오답 노트로 다시 풀어 볼 때',
    '글씨를 반듯하게 쓰고 싶을 때',
  ],
  blocks,
  sample: { studentName: '김옷깃', className: '5학년 1반', noteDate: '2026-11-20' },
  faq: [
    {
      q: '모눈 크기는 얼마인가요?',
      a: '5mm 간격으로 가로 38칸, 세로 48칸입니다. 초등 수학 노트의 기본 크기입니다.',
    },
    {
      q: '도형을 그리기 좋나요?',
      a: '네. 5mm 모눈이라 자 없이도 정사각형·직사각형·그래프를 그리기 쉽습니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '190×260mm(16절) 공책 크기로 A4 중앙에 놓입니다. 인쇄 배율을 100%로 두세요.',
    },
  ],
  related: [
    { label: '수학 10mm 모눈 노트', href: '/forms/math-notebook-10mm/' },
    { label: '국어 10칸 노트', href: '/forms/korean-notebook-10/' },
    { label: '음악 오선지 노트', href: '/forms/music-notebook/' },
  ],
});
