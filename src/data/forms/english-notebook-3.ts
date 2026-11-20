import type { FormBlock } from '@/lib/doc/types';
import { notebookForm, notebookHeader } from './notebook-kit';

const blocks: FormBlock[] = [
  notebookHeader(),
  {
    kind: 'ruled',
    groups: 12,
    lines: 3,
    lineGap: 5.2,
    groupGap: 4.8,
    width: 190,
    lineColor: '#8C98A4',
    lineWidth: 0.12,
    gapBefore: 1,
  },
];

export const englishNotebook3 = notebookForm({
  slug: 'english-notebook-3',
  title: '영어 3선 노트',
  description:
    '저학년이 처음 영어를 쓸 때 쓰는 3선 노트를 190×260mm 실제 공책 크기로 인쇄하는 양식입니다. 넓은 줄 간격으로 천천히 연습합니다.',
  keywords: ['영어 노트', '3선 노트', '영어 공책', '저학년 영어', '알파벳 연습', '영어 쓰기'],
  docPrefix: 'E3',
  lead: '3선×12줄, 줄 간격이 넓은 저학년 영어 노트입니다. A4에 실제 공책 크기로 인쇄됩니다.',
  useCases: [
    '처음 알파벳을 쓰는 저학년이',
    '영어 단어를 크게 연습할 때',
    '영어 수업 첫 공책으로',
    '손글씨 간격을 익힐 때',
  ],
  blocks,
  sample: { studentName: '김옷깃', className: '1학년 1반', noteDate: '2026-11-20' },
  faq: [
    {
      q: '4선 노트와 무엇이 다른가요?',
      a: '선이 하나 적어 칸이 더 넓습니다. 알파벳을 크게 쓰기 시작하는 저학년에게 좋습니다.',
    },
    {
      q: '줄 간격은 얼마인가요?',
      a: '한 줄 안의 세 선 간격은 약 5.2mm, 한 묶음과 다음 묶음 사이는 4.8mm입니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '190×260mm(16절) 공책 크기로 A4 중앙에 놓입니다. 인쇄 배율을 100%로 두세요.',
    },
  ],
  related: [
    { label: '영어 4선 노트', href: '/forms/english-notebook-4/' },
    { label: '영어 단어장', href: '/forms/vocabulary-notebook/' },
    { label: '국어 8칸 노트', href: '/forms/korean-notebook-8/' },
  ],
});
