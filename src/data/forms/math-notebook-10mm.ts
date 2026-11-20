import type { FormBlock } from '@/lib/doc/types';
import { notebookForm, notebookGrid, notebookHeader } from './notebook-kit';

const blocks: FormBlock[] = [
  notebookHeader(),
  notebookGrid({
    columns: Array.from({ length: 19 }, () => 10),
    rows: 24,
    rowHeight: 10,
    lineColor: '#C8D0D8',
    lineWidth: 0.1,
  }),
];

export const mathNotebook10mm = notebookForm({
  slug: 'math-notebook-10mm',
  title: '수학 10mm 모눈 노트',
  description:
    '저학년이 처음 모눈에 쓰기 좋은 10mm 모눈 노트를 190×260mm 실제 공책 크기로 인쇄하는 양식입니다. 19×24칸입니다.',
  keywords: ['수학 노트', '모눈 노트', '10mm 모눈', '저학년 수학', '방안 노트', '수학 공책'],
  docPrefix: 'M10',
  lead: '10mm 모눈 19×24칸 수학 노트입니다. A4에 실제 공책 크기로 인쇄됩니다.',
  useCases: [
    '1~2학년이 처음 모눈에 쓸 때',
    '수를 크게 쓰며 자리값을 익힐 때',
    '도형을 크게 그려 볼 때',
    '수학 공책을 바로 출력할 때',
  ],
  howTo: [
    '한 칸에 숫자 하나, 더하기·빼기 같은 기호도 한 칸씩 씁니다.',
    '세로셈은 일의 자리를 오른쪽 끝 같은 열에 맞추고 받아올림 수는 윗칸에 적습니다.',
    '칸 수를 세어 도형이나 수 모형을 그리며 길이와 넓이를 비교합니다.',
    'PDF로 내려받아 A4 용지에 100% 배율로 인쇄합니다.',
  ],
  tips: ['칸이 커서 숫자를 크게 쓰는 저학년이 자릿값과 세로셈을 익히기에 알맞습니다.'],
  blocks,
  sample: { studentName: '김옷깃', className: '2학년 1반', noteDate: '2026-11-20' },
  faq: [
    {
      q: '몇 학년이 쓰나요?',
      a: '숫자를 크게 쓰는 1~2학년이 자릿값과 세로셈을 익힐 때 많이 씁니다. 숫자가 작아지면 5mm 모눈으로 바꾸세요.',
    },
    {
      q: '모눈 크기는 얼마인가요?',
      a: '10mm 간격으로 가로 19칸, 세로 24칸입니다. 저학년이 쓰기 좋은 넉넉한 크기입니다.',
    },
    {
      q: '5mm 모눈과 무엇이 다른가요?',
      a: '칸이 두 배 커서 글씨와 숫자를 크게 쓸 수 있습니다. 처음 모눈을 쓰는 저학년에게 좋습니다.',
    },
  ],
  related: [
    { label: '수학 5mm 모눈 노트', href: '/forms/math-notebook-5mm/' },
    { label: '국어 8칸 노트', href: '/forms/korean-notebook-8/' },
    { label: '영어 3선 노트', href: '/forms/english-notebook-3/' },
  ],
});
