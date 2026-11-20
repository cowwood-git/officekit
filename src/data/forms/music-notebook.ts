import type { FormBlock } from '@/lib/doc/types';
import { notebookForm, notebookHeader } from './notebook-kit';

const blocks: FormBlock[] = [
  notebookHeader(),
  {
    kind: 'ruled',
    groups: 12,
    lines: 5,
    lineGap: 1.8,
    groupGap: 12,
    width: 190,
    lineColor: '#7C8794',
    lineWidth: 0.13,
    gapBefore: 1,
  },
];

export const musicNotebook = notebookForm({
  slug: 'music-notebook',
  title: '음악 오선지 노트',
  description:
    '초등 음악 수업에 쓰는 5선 오선지 노트를 190×260mm 실제 공책 크기로 인쇄하는 양식입니다. 한 장에 12단을 그립니다.',
  keywords: ['음악 노트', '오선지', '5선 노트', '음악 공책', '악보 노트', '초등 음악'],
  docPrefix: 'MUS',
  lead: '5선×12단 오선지 노트입니다. A4에 실제 공책 크기로 인쇄됩니다.',
  useCases: [
    '음표와 쉼표를 직접 그려 볼 때',
    '간단한 악보를 손으로 쓸 때',
    '음악 수업 공책으로',
    '오선지가 필요할 때 바로 출력할 때',
  ],
  blocks,
  sample: { studentName: '김옷깃', className: '4학년 1반', noteDate: '2026-11-20' },
  faq: [
    {
      q: '한 장에 몇 단이 들어가나요?',
      a: '5선 12단이 들어갑니다. 단 사이 간격은 12mm입니다.',
    },
    {
      q: '큰오선지인가요?',
      a: '초등학생이 쓰기 편한 간격으로 맞췄습니다. 선 간격은 1.8mm입니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '190×260mm(16절) 공책 크기로 A4 중앙에 놓입니다. 인쇄 배율을 100%로 두세요.',
    },
  ],
  related: [
    { label: '영어 4선 노트', href: '/forms/english-notebook-4/' },
    { label: '수학 5mm 모눈 노트', href: '/forms/math-notebook-5mm/' },
    { label: '국어 10칸 노트', href: '/forms/korean-notebook-10/' },
  ],
});
