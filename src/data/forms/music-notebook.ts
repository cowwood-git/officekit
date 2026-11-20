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
  howTo: [
    '각 단 맨 앞에 높은음자리표와 박자표를 먼저 그립니다.',
    '음표 머리는 줄 위에 걸치거나 줄과 줄 사이 칸에 정확히 들어가게 그립니다.',
    '한 마디가 끝나면 세로줄을 긋고, 계이름은 단 아래 여백에 적습니다.',
    'PDF로 내려받아 A4 용지에 100% 배율로 인쇄합니다.',
  ],
  tips: ['짧은 가락 짓기 숙제나 리코더 곡의 계이름을 옮겨 적을 때 쓰기 좋습니다.'],
  blocks,
  sample: { studentName: '김옷깃', className: '4학년 1반', noteDate: '2026-11-20' },
  faq: [
    {
      q: '가락 짓기 숙제에도 쓸 수 있나요?',
      a: '네. 단마다 몇 마디씩 나눠 적을 수 있어 짧은 가락 짓기나 리듬 꼴 연습에 알맞습니다. 단 수가 많아 한 장에 여러 곡을 나눠 적을 수도 있습니다.',
    },
    {
      q: '한 장에 몇 단이 들어가나요?',
      a: '5선 12단이 들어갑니다. 단 사이 간격은 12mm입니다.',
    },
    {
      q: '큰오선지인가요?',
      a: '초등학생이 쓰기 편한 간격으로 맞췄습니다. 선 간격은 1.8mm입니다.',
    },
  ],
  related: [
    { label: '영어 4선 노트', href: '/forms/english-notebook-4/' },
    { label: '수학 5mm 모눈 노트', href: '/forms/math-notebook-5mm/' },
    { label: '국어 10칸 노트', href: '/forms/korean-notebook-10/' },
  ],
});
