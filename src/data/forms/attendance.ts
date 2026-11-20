import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const attendees: RepeatGroup = {
  id: 'attendees',
  label: '출석 명단',
  help: '교육생 이름·부서·직위·출석 상태를 적습니다. 등록 인원과 출석 인원이 자동으로 계산됩니다.',
  minRows: 3,
  maxRows: 60,
  addLabel: '+ 교육생 추가',
  required: true,
  group: '교육 정보',
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
      width: 1.5,
    },
    {
      id: 'department',
      label: '부서',
      type: 'text',
      placeholder: '경영지원팀',
      maxLength: 40,
      width: 2,
    },
    {
      id: 'position',
      label: '직위',
      type: 'text',
      placeholder: '대리',
      maxLength: 30,
      width: 1.2,
    },
    {
      id: 'status',
      label: '출석',
      type: 'select',
      options: ['출석', '지각', '조퇴', '결석'],
      width: 1.2,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'AT-20261117-001',
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
    id: 'course',
    label: '교육명',
    type: 'text',
    group: '교육 정보',
    required: true,
    placeholder: '예: 데이터 분석 실무',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'instructor',
    label: '강사',
    type: 'text',
    group: '교육 정보',
    placeholder: '예: 김강사',
    maxLength: 40,
  },
  {
    id: 'place',
    label: '교육 장소',
    type: 'text',
    group: '교육 정보',
    placeholder: '예: 본사 3층 교육장',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'startDate',
    label: '시작일',
    type: 'date',
    group: '교육 정보',
    required: true,
  },
  {
    id: 'endDate',
    label: '종료일',
    type: 'date',
    group: '교육 정보',
    required: true,
  },
  {
    id: 'hours',
    label: '교육 시간',
    type: 'text',
    group: '교육 정보',
    placeholder: '예: 21시간',
    maxLength: 20,
  },
  {
    id: 'attendeeCountLabel',
    label: '등록 인원',
    type: 'computed',
    group: '교육 정보',
    help: '출석 명단에 입력한 교육생 수입니다.',
  },
  {
    id: 'presentCountLabel',
    label: '출석 인원',
    type: 'computed',
    group: '교육 정보',
    help: '출석으로 표시한 인원입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '지각·결석 사유, 수료 기준, 후속 교육 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['담당자', '확인자', '부서장', '본부장', '대표'],
    defaultValue: JSON.stringify([
      { label: '담당자', enabled: true },
      { label: '확인자', enabled: true },
      { label: '부서장', enabled: false },
      { label: '본부장', enabled: false },
      { label: '대표', enabled: false },
    ]),
    required: true,
    maxSelected: 5,
    editable: true,
    help: '5칸 중 필요한 단계만 켜고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const attendeesOf = (rows: FormRows): FormRows['attendees'] =>
  (rows.attendees ?? []).filter((row) => (row.name ?? '').trim());

export const attendance: FormTemplate = {
  slug: 'attendance',
  title: '교육 출석부',
  family: 'hr',
  category: 'people',
  description:
    '교육생의 출석 상태를 기록하는 교육 출석부를 브라우저에서 작성하고 A4 PDF로 저장합니다. 등록·출석 인원이 자동으로 계산되고 서명란을 인쇄할 수 있습니다.',
  keywords: [
    '교육 출석부',
    '교육 출석부 양식',
    '출석부 양식',
    '교육생 명단',
    '출석 확인서',
    '교육 출석부 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'AT',
  lead: '교육생 명단과 출석 상태를 기록하는 출석부입니다. 등록 인원과 출석 인원을 자동으로 계산하고, 인쇄용 서명란을 제공합니다.',
  useCases: [
    '사내·외부 교육의 출석을 확인할 때',
    '교육 수료 기준 인원을 집계할 때',
    '강사·담당자 서명을 받을 때',
    '교육 이수 증빙으로 보관할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 교육명을 확인합니다.',
    '강사·장소·기간·시간을 적습니다.',
    '교육생 이름·부서·직위·출석 상태를 입력합니다.',
    '등록·출석 인원을 확인하고 PDF로 내려받아 서명을 받습니다.',
  ],
  notes: [
    '출석 상태는 실제 출석 기록에 따라 정확히 적습니다.',
    '교육생 이름·부서는 교육 운영 목적에 필요한 범위에서만 사용하세요.',
    '인쇄 후 서명란에 자필 서명을 받거나 PDF 서명 도구를 사용할 수 있습니다.',
  ],
  fields,
  groups: [attendees],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '교육 출석부',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '교육 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '교육명', field: 'course' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '강사', field: 'instructor' },
        { label: '교육 장소', field: 'place' },
      ],
    },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '시작일', field: 'startDate' },
        { label: '종료일', field: 'endDate' },
        { label: '교육 시간', field: 'hours' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '등록 인원', field: 'attendeeCountLabel' },
        { label: '출석 인원', field: 'presentCountLabel' },
      ],
    },
    { kind: 'section', title: '출석 명단' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '이름', width: 30 },
        { label: '부서', width: 42 },
        { label: '직위', width: 26 },
        { label: '상태', width: 24, align: 'center' },
        { label: '서명', width: 42 },
      ],
      rows: (_values, rows) =>
        attendeesOf(rows).map((row, index) => [
          String(index + 1),
          (row.name ?? '').trim(),
          (row.department ?? '').trim(),
          (row.position ?? '').trim(),
          (row.status ?? '').trim(),
          '',
        ]),
      minRows: 4,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['담당자', '확인자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = attendeesOf(rows);
    const present = list.filter((row) => row.status === '출석').length;
    return {
      attendeeCountLabel: list.length > 0 ? `${list.length}명` : '',
      presentCountLabel: list.length > 0 ? `${present}명` : '',
    };
  },
  validate: (values, rows) => {
    const errors: string[] = [];
    if (attendeesOf(rows).length === 0) errors.push('교육생을 한 명 이상 입력하세요.');
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      errors.push('종료일은 시작일보다 빠를 수 없습니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'AT-20261117-001',
    date: '2026-11-17',
    course: '데이터 분석 실무',
    instructor: '김강사',
    place: '본사 3층 교육장',
    startDate: '2026-11-24',
    endDate: '2026-11-26',
    hours: '21시간',
    note: '3일 중 2일 이상 출석 시 수료로 인정합니다. 결석자는 12월 보수 교육 대상입니다.',
  },
  sampleRows: {
    attendees: [
      { name: '김옷깃', department: '경영지원팀', position: '대리', status: '출석' },
      { name: '이데이터', department: '개발팀', position: '과장', status: '출석' },
      { name: '박표', department: '영업팀', position: '사원', status: '지각' },
      { name: '최문서', department: '기획팀', position: '대리', status: '출석' },
    ],
  },
  faq: [
    {
      q: '교육 출석부와 교육 신청서는 어떻게 다른가요?',
      a: '교육 신청서는 교육 전에 참가를 신청하는 문서이고, 출석부는 교육 당일·기간의 출석을 확인하는 문서입니다.',
    },
    {
      q: '출석 인원은 어떻게 계산되나요?',
      a: '상태가 “출석”인 교육생만 셉니다. 지각·조퇴·결석은 등록 인원에는 포함되지만 출석 인원에는 포함되지 않습니다.',
    },
    {
      q: '서명란은 어떻게 쓰나요?',
      a: 'PDF로 인쇄해 교육생에게 자필 서명을 받거나, PDF 서명 도구로 전자 서명을 넣을 수 있습니다. 출석부에는 서명 열이 빈 칸으로 인쇄됩니다.',
    },
    {
      q: '교육생 이름을 모두 적어야 하나요?',
      a: '출석 확인이 필요한 교육이라면 이름과 소속을 적습니다. 개인정보는 교육 운영 목적에 필요한 범위에서만 사용하세요.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 직업능력개발 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '고용24 — 직업훈련 정보',
      href: 'https://www.work24.go.kr/',
    },
  ],
  related: [
    { label: '교육 신청서 양식', href: '/forms/training-request/' },
    { label: '회의록 양식', href: '/forms/meeting-minutes/' },
    { label: '연차 사용계획서 양식', href: '/forms/leave-plan/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
