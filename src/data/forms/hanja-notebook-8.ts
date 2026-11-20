import type { FormBlock } from '@/lib/doc/types';
import { evenColumns, notebookForm, notebookGrid, notebookHeader } from './notebook-kit';

const blocks: FormBlock[] = [
  notebookHeader(),
  notebookGrid({
    columns: evenColumns(8, 160),
    rows: 12,
    rowHeight: 20,
    x: 15,
    guide: true,
  }),
];

export const hanjaNotebook8 = notebookForm({
  slug: 'hanja-notebook-8',
  title: '한자 8칸 노트',
  description:
    '한자를 처음 배우는 저학년용 한자 8칸 노트를 190×260mm 실제 공책 크기로 인쇄하는 양식입니다. 칸마다 점선 십자 안내선이 있습니다.',
  keywords: ['한자 노트', '한문 노트', '8칸 노트', '한자 공책', '초등 한자', '쓰기 노트'],
  docPrefix: 'H8',
  lead: '20mm 8칸에 점선 십자가 있는 한자 노트입니다. A4에 실제 공책 크기로 인쇄됩니다.',
  useCases: [
    '한자를 처음 배우는 저학년이',
    '한자 획순과 균형을 익힐 때',
    '한자 시험을 준비할 때',
    '한문 공책을 바로 출력할 때',
  ],
  howTo: [
    '줄 첫 칸에 본보기 한자를 쓰고, 옆 여백이나 다음 칸에 훈과 음(예: 메 산)을 적습니다.',
    '위에서 아래로, 왼쪽에서 오른쪽으로 획순을 지키며 나머지 칸에 따라 씁니다.',
    '십자 안내선을 기준으로 좌우·위아래 부수의 비율을 맞춥니다.',
    'PDF로 내려받아 A4 용지에 100% 배율로 인쇄합니다.',
  ],
  tips: ['칸이 커서 한자를 처음 익히거나 획이 많은 글자를 크게 써 보며 짜임을 익히기에 좋습니다.'],
  blocks,
  sample: { studentName: '김옷깃', className: '2학년 1반', noteDate: '2026-11-20' },
  faq: [
    {
      q: '한자 급수 시험 공부에도 쓰나요?',
      a: '네. 급수별 배정 한자를 하루 몇 자씩 정해 한 줄에 한 글자를 반복해 쓰는 방식으로 많이 씁니다.',
    },
    {
      q: '칸 크기는 얼마인가요?',
      a: '가로 20mm, 세로 20mm인 8칸×12줄입니다. 한자를 크게 쓰며 익히기 좋습니다.',
    },
    {
      q: '십자 안내선은 무엇인가요?',
      a: '한자의 중심과 균형을 잡도록 칸 가운데에 점선 십자를 그립니다.',
    },
  ],
  related: [
    { label: '한자 10칸 노트', href: '/forms/hanja-notebook-10/' },
    { label: '국어 8칸 노트', href: '/forms/korean-notebook-8/' },
    { label: '받아쓰기 노트', href: '/forms/dictation-notebook/' },
  ],
});
