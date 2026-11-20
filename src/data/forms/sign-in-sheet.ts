import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const attendees: RepeatGroup = {
  id: 'attendees',
  label: '참석 명단',
  help: '참석자 이름·부서·직위를 적습니다. 인쇄 후 서명란에 자필 서명을 받을 수 있습니다.',
  minRows: 4,
  maxRows: 80,
  addLabel: '+ 참석자 추가',
  required: true,
  group: '회의 정보',
  summaryField: 'attendeeCountLabel',
  summaryLabel: '등록 인원',
  columns: [
    {
      id: 'name',
      label: '이름',
      type: 'text',
      required: true,
      placeholder: '홍길동',
      maxLength: 30,
      width: 1.6,
    },
    {
      id: 'department',
      label: '부서',
      type: 'text',
      placeholder: '경영지원팀',
      maxLength: 40,
      width: 2.2,
    },
    {
      id: 'position',
      label: '직위',
      type: 'text',
      placeholder: '대리',
      maxLength: 30,
      width: 1.4,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'SS-20261117-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '작성일',
    type: 'date',
    group: '문서',
    defaultToday: true,
    required: true,
  },
  {
    id: 'meetingTitle',
    label: '회의명',
    type: 'text',
    group: '회의 정보',
    required: true,
    placeholder: '예: 12월 전사 회의',
    maxLength: 100,
    span: 3,
  },
  {
    id: 'meetingDate',
    label: '회의 일시',
    type: 'date',
    group: '회의 정보',
    required: true,
  },
  {
    id: 'place',
    label: '장소',
    type: 'text',
    group: '회의 정보',
    placeholder: '예: 본사 3층 대회의실',
    maxLength: 80,
  },
  {
    id: 'host',
    label: '주관',
    type: 'text',
    group: '회의 정보',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'attendeeCountLabel',
    label: '등록 인원',
    type: 'computed',
    group: '회의 정보',
    help: '참석 명단에 입력한 인원입니다.',
  },
  {
    id: 'note',
    label: '안내',
    type: 'textarea',
    group: '안내',
    placeholder: '회의 안내, 개인정보 고지, 서명 요청 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['담당자', '확인자'],
    defaultValue: JSON.stringify([
      { label: '담당자', enabled: true },
      { label: '확인자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const attendeesOf = (rows: FormRows): FormRows['attendees'] =>
  (rows.attendees ?? []).filter((row) => (row.name ?? '').trim());

export const signInSheet: FormTemplate = {
  slug: 'sign-in-sheet',
  title: '회의 참석 서명부',
  family: 'admin',
  category: 'report',
  description:
    '회의 참석자 명단과 서명란을 만드는 회의 참석 서명부를 브라우저에서 작성하고 A4 PDF로 저장합니다. 인쇄 후 자필 서명을 받을 수 있습니다.',
  keywords: [
    '회의 참석 서명부',
    '참석 서명부 양식',
    '회의 서명부',
    '참석자 명단',
    '회의 출석부',
    '회의 참석 서명부 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'SS',
  lead: '회의 참석자를 확인하고 서명을 받는 문서입니다. 이름·부서·직위를 정리하고 인쇄용 서명란을 제공합니다.',
  useCases: [
    '전사·부서 회의 참석을 확인할 때',
    '교육·설명회 참석자 서명을 받을 때',
    '의결·투표 참석자를 기록할 때',
    '회의록과 함께 참석 증빙을 보관할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 회의명을 확인합니다.',
    '회의 일시·장소·주관을 적습니다.',
    '참석자 이름·부서·직위를 입력합니다.',
    'PDF로 내려받아 인쇄한 뒤 서명란에 서명을 받습니다.',
  ],
  notes: [
    '참석자 개인정보는 회의 운영 목적에 필요한 범위에서만 사용하세요.',
    '서명은 인쇄 후 자필로 받거나 PDF 서명 도구를 사용할 수 있습니다.',
    '회의록과 함께 보관하면 참석·의결 사실을 확인하기 쉽습니다.',
  ],
  fields,
  groups: [attendees],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '회의 참석 서명부',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '회의 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '회의명', field: 'meetingTitle' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '회의 일시', field: 'meetingDate' },
        { label: '장소', field: 'place' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '주관', field: 'host' },
        { label: '등록 인원', field: 'attendeeCountLabel' },
      ],
    },
    { kind: 'section', title: '참석 명단' },
    {
      kind: 'table',
      columns: [
        { label: '이름', width: 34 },
        { label: '부서', width: 46 },
        { label: '직위', width: 30 },
        { label: '서명', width: 64 },
      ],
      rows: (_values, rows) =>
        attendeesOf(rows).map((row) => [
          (row.name ?? '').trim(),
          (row.department ?? '').trim(),
          (row.position ?? '').trim(),
          '',
        ]),
      minRows: 5,
    },
    { kind: 'section', title: '안내' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['담당자', '확인자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const count = attendeesOf(rows).length;
    return { attendeeCountLabel: count > 0 ? `${count}명` : '' };
  },
  validate: (_values, rows) =>
    attendeesOf(rows).length === 0 ? ['참석자를 한 명 이상 입력하세요.'] : [],
  sample: {
    docNo: 'SS-20261117-001',
    date: '2026-11-17',
    meetingTitle: '12월 전사 회의',
    meetingDate: '2026-12-04',
    place: '본사 3층 대회의실',
    host: '경영지원팀',
    note: '참석 확인을 위해 서명란에 자필 서명해 주세요. 개인정보는 회의 참석 확인 목적으로만 사용합니다.',
  },
  sampleRows: {
    attendees: [
      { name: '김옷깃', department: '경영지원팀', position: '대리' },
      { name: '이데이터', department: '개발팀', position: '과장' },
      { name: '박표', department: '영업팀', position: '사원' },
      { name: '최문서', department: '기획팀', position: '대리' },
      { name: '김안전', department: '운영팀', position: '과장' },
    ],
  },
  faq: [
    {
      q: '회의 참석 서명부는 언제 쓰나요?',
      a: '회의 참석 사실을 확인해야 할 때 사용합니다. 회의록과 함께 보관하면 참석·의결 기록으로 활용할 수 있습니다.',
    },
    {
      q: '서명은 어떻게 받나요?',
      a: 'PDF로 인쇄해 참석자에게 자필 서명을 받거나, PDF 서명 도구로 전자 서명을 넣을 수 있습니다.',
    },
    {
      q: '참석 인원은 자동 계산되나요?',
      a: '네. 명단에 입력한 이름 수를 세어 표시합니다. 빈 줄은 제외됩니다.',
    },
    {
      q: '온라인 회의에도 쓸 수 있나요?',
      a: '네. 온라인 회의는 참석자 이름을 적고, 별도로 화면 캡처나 회의 로그를 함께 보관하면 좋습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '행정안전부 — 회의 운영 안내',
      href: 'https://www.mois.go.kr/',
    },
  ],
  related: [
    { label: '회의록 양식', href: '/forms/meeting-minutes/' },
    { label: '교육 출석부 양식', href: '/forms/attendance/' },
    { label: '회의실 예약 신청서 양식', href: '/forms/room-booking/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
