import { formatDateDot } from '@/lib/doc/format';
import type { FormField, FormRows, FormTemplate, LabelSlot, RepeatGroup } from '@/lib/doc/types';

const badges: RepeatGroup = {
  id: 'badges',
  label: '명찰 대상',
  help: '명찰에 인쇄할 이름과 소속을 한 줄에 하나씩 적습니다.',
  minRows: 2,
  maxRows: 8,
  addLabel: '+ 명찰 추가',
  required: true,
  group: '행사 정보',
  columns: [
    {
      id: 'name',
      label: '이름',
      type: 'text',
      required: true,
      placeholder: '김옷깃',
      maxLength: 30,
      width: 1.8,
    },
    {
      id: 'department',
      label: '소속',
      type: 'text',
      placeholder: '경영지원팀',
      maxLength: 40,
      width: 2,
    },
    {
      id: 'title',
      label: '직위',
      type: 'text',
      placeholder: '팀장',
      maxLength: 30,
      width: 1.4,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '역할·좌석 등',
      maxLength: 40,
      width: 1.6,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'eventName',
    label: '행사명',
    type: 'text',
    group: '행사 정보',
    placeholder: '예: 2026 문서 혁신 워크숍',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'eventDate',
    label: '행사일',
    type: 'date',
    group: '행사 정보',
  },
  {
    id: 'company',
    label: '회사·기관',
    type: 'text',
    group: '행사 정보',
    placeholder: '옷깃 주식회사',
    maxLength: 60,
  },
];

const badgesOf = (rows: FormRows): FormRows['badges'] =>
  (rows.badges ?? []).filter((row) => (row.name ?? '').trim());

export const nameBadge: FormTemplate = {
  slug: 'name-badge',
  title: '명찰',
  family: 'label',
  category: 'print',
  description:
    '행사·워크숍에서 사용할 이름·소속·직위 명찰을 A4 8칸으로 인쇄하는 양식입니다. 브라우저에서 만들고 PDF·HWPX로 저장합니다.',
  keywords: ['명찰 양식', '명찰 만들기', '행사 명찰', '이름표 양식', '명찰 인쇄', '명찰 PDF'],
  updated: '2026-11-18',
  docPrefix: 'NB',
  lead: '상단 띠에 행사명, 가운데 이름, 아래에 소속·회사·날짜를 배치한 A4 8칸 명찰입니다. 재단선을 따라 잘라 목걸이·클립에 끼워 사용하세요.',
  useCases: [
    '워크숍·세미나 참가자 명찰을 만들 때',
    '행사 스태프·발표자 명찰이 필요할 때',
    '소규모 모임에서 이름표를 인쇄할 때',
    '좌석·역할을 함께 표시할 때',
  ],
  howTo: [
    '행사명과 회사·기관을 적습니다.',
    '참가자 이름·소속·직위를 입력합니다.',
    '미리보기에서 명찰 배치를 확인합니다.',
    'PDF로 내려받아 A4에 인쇄하고 재단선을 따라 자릅니다.',
  ],
  notes: [
    '명찰 크기는 A4 2×4 기준입니다. 실제 명찰 케이스 크기와 맞는지 인쇄 전에 확인하세요.',
    '이름은 크게, 소속·직위는 작게 표시해 멀리서도 알아보기 쉽게 했습니다.',
    '행사 후 명찰은 개인정보가 남지 않도록 회수·폐기하세요.',
  ],
  fields,
  groups: [badges],
  showFooter: false,
  blocks: [
    {
      kind: 'labelGrid',
      design: 'badge',
      columns: 2,
      rows: 4,
      gap: 3,
      padding: 4,
      cutLines: true,
      rowHeight: 55,
      slots: (values, rows): LabelSlot[] =>
        badgesOf(rows).map((row) => ({
          eyebrow: (values.eventName ?? '').trim() || 'NAME BADGE',
          title: (row.name ?? '').trim() || '이름',
          subtitle: [(row.department ?? '').trim(), (row.title ?? '').trim()]
            .filter(Boolean)
            .join(' · '),
          lines: [
            (values.company ?? '').trim(),
            values.eventDate ? formatDateDot(values.eventDate) : '',
          ].filter(Boolean),
          tag: (row.note ?? '').trim() || '참가자',
        })),
    },
  ],
  validate: (_values, rows) =>
    badgesOf(rows).length === 0 ? ['명찰 대상을 한 줄 이상 입력하세요.'] : [],
  sample: {
    eventName: '2026 문서 혁신 워크숍',
    eventDate: '2026-12-04',
    company: '옷깃 주식회사',
  },
  sampleRows: {
    badges: [
      { name: '김옷깃', department: '경영지원팀', title: '팀장', note: '진행' },
      { name: '이개발', department: '개발팀', title: '대리', note: '발표' },
      { name: '박기획', department: '서비스기획팀', title: '과장', note: '' },
      { name: '최인턴', department: '개발팀', title: '인턴', note: '스태프' },
    ],
  },
  faq: [
    {
      q: '명찰 크기를 바꿀 수 있나요?',
      a: '이 양식은 A4 2×4 배치입니다. 다른 크기가 필요하면 인쇄 배율을 조정하거나 별도 라벨 규격을 사용하세요.',
    },
    {
      q: '명찰 케이스에 맞나요?',
      a: '일반적인 A4 8칸 라벨 기준입니다. 사용하는 케이스의 가로·세로 크기를 확인한 뒤 인쇄하세요.',
    },
    {
      q: '이름만 크게 인쇄할 수 있나요?',
      a: '이 양식은 이름을 가장 크게, 소속·직위를 작게 표시합니다. 행사명·회사명은 아래에 작게 들어갑니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '행정안전부 — 행사 안내 자료 작성 안내',
      href: 'https://www.mois.go.kr/',
    },
  ],
  related: [
    { label: '물류 라벨 양식', href: '/forms/shipping-label/' },
    { label: '초대장 양식', href: '/forms/invitation/' },
    { label: '티켓 양식', href: '/forms/ticket/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
