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
  howTo: [
    '가운데 선을 기준으로 소문자 몸통(a·c·e·o)의 높이를 맞춥니다.',
    '대문자와 키가 큰 소문자(b·d·h·k·l)는 맨 위 선까지 올려 씁니다.',
    '알파벳 한 글자를 한 줄에 여러 번 쓴 뒤, 익숙해지면 짧은 단어를 띄어 씁니다.',
    'PDF로 내려받아 A4 용지에 100% 배율로 인쇄합니다.',
  ],
  tips: ['줄 간격이 넓어 손이 작은 저학년이 알파벳 모양을 처음 익히기에 알맞습니다.'],
  blocks,
  sample: { studentName: '김옷깃', className: '1학년 1반', noteDate: '2026-11-20' },
  faq: [
    {
      q: '단어 공부에도 쓸 수 있나요?',
      a: '네. 짧은 단어를 한 줄에 서너 개씩 띄어 쓰며 연습할 수 있습니다. 뜻과 예문까지 함께 적으려면 영어 단어장 양식을 쓰세요.',
    },
    {
      q: '4선 노트와 무엇이 다른가요?',
      a: '선이 하나 적어 칸이 더 넓습니다. 알파벳을 크게 쓰기 시작하는 저학년에게 좋습니다.',
    },
    {
      q: '줄 간격은 얼마인가요?',
      a: '한 줄 안의 세 선 간격은 약 5.2mm, 한 묶음과 다음 묶음 사이는 4.8mm입니다.',
    },
  ],
  related: [
    { label: '영어 4선 노트', href: '/forms/english-notebook-4/' },
    { label: '영어 단어장', href: '/forms/vocabulary-notebook/' },
    { label: '국어 8칸 노트', href: '/forms/korean-notebook-8/' },
  ],
});
