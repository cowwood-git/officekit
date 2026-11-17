import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const agenda: RepeatGroup = {
  id: 'agenda',
  label: '회의 안건',
  help: '안건과 담당, 예상 소요 시간을 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 2,
  maxRows: 15,
  addLabel: '+ 안건 추가',
  required: true,
  group: '참석 대상',
  columns: [
    {
      id: 'topic',
      label: '안건',
      type: 'text',
      required: true,
      placeholder: '예: 2027년 사업계획 공유',
      maxLength: 80,
      width: 3.2,
    },
    {
      id: 'owner',
      label: '담당',
      type: 'text',
      placeholder: '발표·진행 담당',
      maxLength: 40,
      width: 1.6,
    },
    {
      id: 'duration',
      label: '소요 시간',
      type: 'text',
      placeholder: '예: 20분',
      maxLength: 20,
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
    placeholder: 'MTG-20261117-001',
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
    id: 'title',
    label: '회의명',
    type: 'text',
    group: '회의 정보',
    placeholder: '예: 2027년 사업계획 Kick-off 회의',
    required: true,
    maxLength: 100,
    span: 2,
  },
  {
    id: 'meetingDate',
    label: '회의 일자',
    type: 'date',
    group: '회의 정보',
    required: true,
  },
  {
    id: 'meetingTime',
    label: '회의 시간',
    type: 'text',
    group: '회의 정보',
    placeholder: '예: 14:00~15:30',
    required: true,
    maxLength: 30,
  },
  {
    id: 'place',
    label: '장소',
    type: 'text',
    group: '회의 정보',
    placeholder: '예: 본사 3층 대회의실',
    required: true,
    maxLength: 100,
    span: 2,
  },
  {
    id: 'host',
    label: '주관 부서',
    type: 'text',
    group: '회의 정보',
    placeholder: '경영기획팀',
    required: true,
    maxLength: 40,
  },
  {
    id: 'organizer',
    label: '담당자',
    type: 'text',
    group: '회의 정보',
    placeholder: '김담당',
    maxLength: 30,
  },
  {
    id: 'attendees',
    label: '참석 대상',
    type: 'textarea',
    group: '참석 대상',
    placeholder: '참석 부서·직책·이름을 줄바꿈으로 적습니다.',
    required: true,
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'preparation',
    label: '준비 사항',
    type: 'textarea',
    group: '준비 사항',
    placeholder: '회의 전에 준비할 자료, 발표 순서, 장비 등',
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'request',
    label: '참석 요청',
    type: 'textarea',
    group: '참석 요청',
    placeholder: '참석 회신 기한, 불참 시 대리 참석 안내 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명',
    type: 'roles',
    group: '서명',
    options: ['주관자', '팀장'],
    defaultValue: JSON.stringify([
      { label: '주관자', enabled: true },
      { label: '팀장', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const agendaOf = (rows: FormRows): FormRows['agenda'] =>
  (rows.agenda ?? []).filter((row) => (row.topic ?? '').trim());

export const meetingNotice: FormTemplate = {
  slug: 'meeting-notice',
  title: '회의 소집 안내문',
  family: 'report',
  category: 'report',
  description:
    '회의 일시·장소·참석 대상·안건을 정리해 참석자에게 알리는 회의 소집 안내문을 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '회의 소집 안내문',
    '회의 소집 안내문 양식',
    '회의 안내문',
    '회의 소집 공문',
    '회의 안건 안내',
    '회의 소집 안내문 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'MTG',
  lead: '회의 일시와 장소, 참석 대상, 안건을 한 장으로 정리해 참석자에게 알리는 안내문입니다. 준비 사항과 참석 요청까지 함께 전달합니다.',
  useCases: [
    '부서·팀 회의를 공식적으로 소집할 때',
    '여러 부서가 참석하는 회의를 안내할 때',
    '회의 안건과 준비 사항을 미리 공유할 때',
    '회의 일정과 참석 여부를 문서로 남길 때',
  ],
  howTo: [
    '회의명과 일자·시간, 장소를 적습니다.',
    '주관 부서와 담당자를 확인합니다.',
    '참석 대상과 회의 안건을 입력합니다.',
    '준비 사항과 참석 요청을 적고 PDF로 내려받아 발송합니다.',
  ],
  notes: [
    '회의 일시와 장소는 참석자 이동 시간을 고려해 정하세요.',
    '안건별 담당과 소요 시간을 적으면 회의가 길어지는 것을 줄일 수 있습니다.',
    '회의 자료는 미리 공유하고, 참석 회신 기한을 명확히 안내하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [agenda],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '회의 소집 안내문',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '회의 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '회의명', field: 'title' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '일자', field: 'meetingDate' },
        { label: '시간', field: 'meetingTime' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '장소', field: 'place' },
        { label: '주관 부서', field: 'host' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '담당자', field: 'organizer' }] },
    { kind: 'section', title: '참석 대상' },
    { kind: 'text', field: 'attendees', minLines: 2 },
    { kind: 'section', title: '회의 안건' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '안건', width: 92 },
        { label: '담당', width: 40 },
        { label: '소요 시간', width: 32, align: 'center' },
      ],
      rows: (_values, rows) =>
        agendaOf(rows).map((row, index) => [
          String(index + 1),
          (row.topic ?? '').trim(),
          (row.owner ?? '').trim(),
          (row.duration ?? '').trim(),
        ]),
      minRows: 2,
    },
    { kind: 'section', title: '준비 사항' },
    { kind: 'text', field: 'preparation', minLines: 2 },
    { kind: 'section', title: '참석 요청' },
    { kind: 'text', field: 'request', minLines: 2 },
    {
      kind: 'signature',
      roles: ['주관자', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  validate: (values, rows) => {
    const errors: string[] = [];
    if (values.date && values.meetingDate && values.meetingDate < values.date) {
      errors.push('회의 일자는 작성일보다 빠를 수 없습니다.');
    }
    if (agendaOf(rows).length === 0) {
      errors.push('회의 안건을 한 줄 이상 입력하세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'MTG-20261117-001',
    date: '2026-11-17',
    title: '2027년 사업계획 Kick-off 회의',
    meetingDate: '2026-11-24',
    meetingTime: '14:00~15:30',
    place: '본사 3층 대회의실',
    host: '경영기획팀',
    organizer: '김담당',
    attendees: '대표이사, 경영기획팀, 서비스기획팀, 개발팀, 영업팀 팀장\n각 부서 사업계획 담당자',
    preparation:
      '부서별 2027년 사업계획 초안과 예산표를 11월 21일까지 공유해 주세요. 발표는 부서당 10분으로 진행합니다.',
    request: '참석 여부를 11월 20일까지 회신해 주세요. 불참 시 대리 참석자를 알려 주시기 바랍니다.',
  },
  sampleRows: {
    agenda: [
      {
        topic: '2027년 회사 목표와 전략 방향',
        owner: '대표이사',
        duration: '15분',
      },
      {
        topic: '부서별 사업계획 발표',
        owner: '각 부서 팀장',
        duration: '50분',
      },
      {
        topic: '예산·인력 계획 조정',
        owner: '경영기획팀',
        duration: '20분',
      },
      {
        topic: '다음 단계와 일정 확정',
        owner: '경영기획팀',
        duration: '5분',
      },
    ],
  },
  faq: [
    {
      q: '회의 소집 안내문에 꼭 들어가야 할 내용은?',
      a: '회의명, 일시, 장소, 주관 부서, 참석 대상, 안건, 준비 사항, 참석 회신 방법을 넣으면 참석자가 바로 준비할 수 있습니다.',
    },
    {
      q: '안건은 몇 개까지 넣는 게 좋나요?',
      a: '회의 시간 안에 논의할 수 있는 분량으로 정하세요. 안건별 소요 시간을 적으면 회의가 길어지는 것을 줄일 수 있습니다.',
    },
    {
      q: '온라인 회의에도 쓸 수 있나요?',
      a: '네. 장소에 화상회의 링크나 접속 정보를 적고, 준비 사항에 마이크·화면 공유 안내를 추가하세요.',
    },
    {
      q: '회의록과 어떻게 다른가요?',
      a: '소집 안내문은 회의 전에 일정과 안건을 알리는 문서이고, 회의록은 회의 후 논의와 결정을 기록하는 문서입니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '행정안전부 — 회의·공문 작성 안내',
      href: 'https://www.mois.go.kr/',
    },
  ],
  related: [
    { label: '회의록 양식', href: '/forms/meeting-minutes/' },
    { label: '회의 참석 서명부 양식', href: '/forms/sign-in-sheet/' },
    { label: '업무 협조 요청서 양식', href: '/forms/collaboration-request/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
