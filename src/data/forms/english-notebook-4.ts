import type { FormBlock } from '@/lib/doc/types';
import { notebookForm, notebookHeader } from './notebook-kit';

const blocks: FormBlock[] = [
  notebookHeader(),
  {
    kind: 'ruled',
    groups: 12,
    lines: 4,
    lineGap: 3.9,
    groupGap: 4.5,
    width: 190,
    lineColor: '#8C98A4',
    lineWidth: 0.12,
    accentLine: 2,
    accentColor: '#D9534F',
    accentWidth: 0.25,
    gapBefore: 1,
  },
];

export const englishNotebook4 = notebookForm({
  slug: 'english-notebook-4',
  title: '영어 4선 노트',
  description:
    '초등 영어 공책의 기본인 4선 노트를 190×260mm 실제 공책 크기로 인쇄하는 양식입니다. 세 번째 기준선은 빨간색으로 그립니다.',
  keywords: ['영어 노트', '4선 노트', '영어 공책', '초등 영어', '알파벳 연습', '영어 쓰기'],
  docPrefix: 'E4',
  lead: '4선×12줄, 세 번째 기준선이 빨간색인 영어 노트입니다. A4에 실제 공책 크기로 인쇄됩니다.',
  useCases: [
    '알파벳 대·소문자를 바르게 쓸 때',
    '영어 단어와 짧은 문장을 연습할 때',
    '초등 영어 수업 공책으로',
    '영어 공책을 바로 출력할 때',
  ],
  howTo: [
    '대문자와 b·d·h·k·l처럼 키가 큰 소문자는 첫째 선에서 셋째(빨간) 선까지 씁니다.',
    'a·c·e·o처럼 몸통만 있는 소문자는 둘째 선과 셋째 선 사이에 씁니다.',
    'g·j·p·q·y처럼 아래로 내려오는 글자는 꼬리를 넷째 선까지 내립니다.',
    'PDF로 내려받아 A4 용지에 100% 배율로 인쇄합니다.',
  ],
  tips: ['모든 글자가 빨간 기준선 위에 앉도록 쓰면 글자 높이가 고르게 맞춰집니다.'],
  blocks,
  sample: { studentName: '김옷깃', className: '3학년 1반', noteDate: '2026-11-20' },
  faq: [
    {
      q: '3선 노트에서 언제 4선으로 바꾸나요?',
      a: '알파벳 모양이 익숙해져 글자 높이를 스스로 맞출 수 있을 때 바꿉니다. 아래로 내려오는 글자의 꼬리 위치까지 연습할 수 있어 단어·문장 쓰기에 알맞습니다.',
    },
    {
      q: '빨간 선은 무엇인가요?',
      a: '네 줄 중 세 번째 선으로, 소문자의 바닥 기준선입니다. 알파벳 높이를 맞추는 데 씁니다.',
    },
    {
      q: '줄 간격은 얼마인가요?',
      a: '한 줄 안의 네 선 간격은 약 3.9mm, 한 묶음과 다음 묶음 사이는 4.5mm입니다.',
    },
  ],
  related: [
    { label: '영어 3선 노트', href: '/forms/english-notebook-3/' },
    { label: '영어 단어장', href: '/forms/vocabulary-notebook/' },
    { label: '국어 10칸 노트', href: '/forms/korean-notebook-10/' },
  ],
});
