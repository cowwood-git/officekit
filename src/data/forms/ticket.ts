import type { FormField, FormRows, FormTemplate, LabelSlot, RepeatGroup } from '@/lib/doc/types';

const tickets: RepeatGroup = {
  id: 'tickets',
  label: '티켓 목록',
  help: '티켓별 좌석·번호를 적습니다. A4 한 장에 8장까지 인쇄됩니다.',
  minRows: 2,
  maxRows: 8,
  addLabel: '+ 티켓 추가',
  required: true,
  group: '행사 정보',
  columns: [
    {
      id: 'name',
      label: '이름',
      type: 'text',
      placeholder: '김옷깃',
      maxLength: 30,
      width: 1.8,
    },
    {
      id: 'seat',
      label: '좌석',
      type: 'text',
      required: true,
      placeholder: 'A-12',
      maxLength: 20,
      width: 1.2,
    },
    {
      id: 'number',
      label: '티켓 번호',
      type: 'text',
      placeholder: '001',
      maxLength: 20,
      width: 1.2,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '입장 구분 등',
      maxLength: 40,
      width: 1.6,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'eventTitle',
    label: '행사명',
    type: 'text',
    group: '행사 정보',
    placeholder: '예: 2026 옷깃 컨퍼런스',
    required: true,
    maxLength: 100,
    span: 2,
  },
  {
    id: 'dateTime',
    label: '일시',
    type: 'text',
    group: '행사 정보',
    placeholder: '예: 2026. 12. 18. 오후 6:30',
    maxLength: 60,
  },
  {
    id: 'place',
    label: '장소',
    type: 'text',
    group: '행사 정보',
    placeholder: '예: 서울 강남구 그랜드홀',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'notice',
    label: '안내',
    type: 'text',
    group: '행사 정보',
    placeholder: '예: 입장은 30분 전부터 가능합니다.',
    maxLength: 100,
    span: 2,
  },
];

const ticketsOf = (rows: FormRows): FormRows['tickets'] =>
  (rows.tickets ?? []).filter((row) => (row.seat ?? '').trim());

export const ticket: FormTemplate = {
  slug: 'ticket',
  title: '티켓',
  family: 'label',
  category: 'print',
  description:
    '행사명·일시·좌석·티켓 번호를 넣어 A4 한 장에 8장씩 인쇄하는 티켓을 만듭니다. 번호를 바꿔 가며 여러 장을 만들고 PDF·한글(HWPX) 파일로 저장할 수 있습니다.',
  keywords: ['티켓 양식', '티켓 만들기', '행사 티켓', '초대 티켓', '티켓 인쇄', '티켓 PDF'],
  updated: '2026-11-18',
  docPrefix: 'TKT',
  lead: '점선 스텁에 좌석과 티켓 번호를 분리한 입장권입니다. A4 한 장에 8장을 배치하고 재단선을 따라 자릅니다.',
  useCases: [
    '공연·컨퍼런스 입장 티켓을 만들 때',
    '좌석이 정해진 행사 티켓을 인쇄할 때',
    '초대 인원에게 번호가 있는 티켓을 나눠 줄 때',
    '소규모 모임의 추첨·좌석 티켓을 만들 때',
  ],
  howTo: [
    '행사명과 일시·장소를 적습니다.',
    '티켓별 좌석과 번호를 입력합니다.',
    '미리보기에서 8장 배치를 확인합니다.',
    'PDF로 내려받아 A4에 인쇄하고 재단선을 따라 자릅니다.',
  ],
  notes: [
    '티켓 번호는 중복되지 않게 입력하면 입장 확인이 쉽습니다.',
    '좌석·입장 구분은 행사 운영 방식에 맞춰 적으세요.',
    '재단선을 따라 자른 뒤 티켓 번호와 좌석을 다시 확인하세요.',
  ],
  fields,
  groups: [tickets],
  showFooter: false,
  blocks: [
    {
      kind: 'labelGrid',
      design: 'ticket',
      columns: 2,
      rows: 4,
      gap: 3,
      padding: 4,
      cutLines: true,
      rowHeight: 55,
      slots: (values, rows): LabelSlot[] =>
        ticketsOf(rows).map((row) => ({
          eyebrow: 'ADMIT ONE',
          title: (values.eventTitle ?? '').trim() || '티켓',
          subtitle: (values.dateTime ?? '').trim(),
          lines: [
            (values.place ?? '').trim(),
            (row.name ?? '').trim(),
            (values.notice ?? '').trim(),
          ].filter(Boolean),
          tag: (row.number ?? '').trim() || '000',
          note: (row.seat ?? '').trim() || '자유석',
        })),
    },
  ],
  validate: (_values, rows) =>
    ticketsOf(rows).length === 0 ? ['티켓을 한 줄 이상 입력하세요.'] : [],
  sample: {
    eventTitle: '2026 옷깃 컨퍼런스',
    dateTime: '2026. 12. 18. 오후 6:30',
    place: '서울 강남구 그랜드홀',
    notice: '입장은 30분 전부터 가능합니다.',
  },
  sampleRows: {
    tickets: [
      { name: '김옷깃', seat: 'A-12', number: '001', note: 'VIP' },
      { name: '이개발', seat: 'A-13', number: '002', note: '' },
      { name: '박기획', seat: 'B-01', number: '003', note: '' },
      { name: '최인턴', seat: 'B-02', number: '004', note: '스태프' },
    ],
  },
  faq: [
    {
      q: '티켓을 몇 장까지 인쇄할 수 있나요?',
      a: 'A4 한 장에 8장까지 배치됩니다. 8장을 넘으면 여러 장을 인쇄하세요.',
    },
    {
      q: '티켓 번호는 꼭 있어야 하나요?',
      a: '필수는 아니지만 번호를 넣으면 입장 확인과 중복 방지에 도움이 됩니다.',
    },
    {
      q: '좌석 없이도 만들 수 있나요?',
      a: '좌석 칸을 비우면 티켓에 좌석이 표시되지 않습니다. 자유석 행사에 사용할 수 있습니다.',
    },
  ],
  sources: [
    {
      label: '행정안전부 — 행사 운영 안내',
      href: 'https://www.mois.go.kr/',
    },
  ],
  related: [
    { label: '초대장 양식', href: '/forms/invitation/' },
    { label: '명찰 양식', href: '/forms/name-badge/' },
    { label: '물류 라벨 양식', href: '/forms/shipping-label/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
