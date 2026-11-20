import { formatDateDot } from '@/lib/doc/format';
import type { FormBlock, FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const approvalDefault = JSON.stringify([
  { label: '작성자', enabled: true },
  { label: '검토자', enabled: true },
  { label: '부서장', enabled: false },
  { label: '본부장', enabled: false },
  { label: '대표', enabled: true },
]);

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'R-20261115-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다.',
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
    id: 'name',
    label: '성명',
    type: 'text',
    group: '출장자',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '출장자',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'destination',
    label: '출장지',
    type: 'text',
    group: '출장 정보',
    placeholder: '예: 부산',
    required: true,
    maxLength: 60,
  },
  {
    id: 'from',
    label: '시작일',
    type: 'date',
    group: '출장 정보',
    required: true,
  },
  {
    id: 'to',
    label: '종료일',
    type: 'date',
    group: '출장 정보',
    required: true,
  },
  {
    id: 'purpose',
    label: '출장 목적',
    type: 'textarea',
    group: '내용',
    placeholder: '출장 목적을 한두 문장으로 적습니다.',
    required: true,
    rows: 3,
    maxLength: 400,
    span: 3,
  },
  {
    id: 'summary',
    label: '활동 내용',
    type: 'textarea',
    group: '내용',
    placeholder: '무엇을 했는지 시간 순서대로 적습니다.',
    rows: 5,
    maxLength: 800,
    span: 3,
  },
  {
    id: 'results',
    label: '결과·성과',
    type: 'textarea',
    group: '내용',
    placeholder: '확정된 내용, 얻은 결과',
    rows: 4,
    maxLength: 600,
    span: 3,
  },
  {
    id: 'issues',
    label: '문제·개선',
    type: 'textarea',
    group: '내용',
    placeholder: '아쉬웠던 점, 다음에 개선할 점',
    rows: 3,
    maxLength: 400,
    span: 3,
  },
  {
    id: 'nextActions',
    label: '후속 조치',
    type: 'textarea',
    group: '내용',
    placeholder: '담당자 · 기한 · 할 일',
    rows: 3,
    maxLength: 400,
    span: 3,
  },
  {
    id: 'attachments',
    label: '첨부 자료',
    type: 'textarea',
    group: '내용',
    placeholder: '영수증, 사진, 회의 자료 등 첨부한 자료를 적습니다.',
    rows: 2,
    maxLength: 300,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['작성자', '검토자', '부서장', '본부장', '대표'],
    defaultValue: approvalDefault,
    required: true,
    maxSelected: 5,
    editable: true,
    help: '5칸 중 필요한 단계만 켜고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const schedule: RepeatGroup = {
  id: 'schedule',
  label: '주요 일정',
  group: '출장 정보',
  help: '출장 중 주요 일정을 시간 순서대로 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 2,
  maxRows: 20,
  addLabel: '+ 일정 추가',
  columns: [
    { id: 'date', label: '일자', type: 'date', width: 1.3 },
    { id: 'time', label: '시간', type: 'text', placeholder: '14:00', width: 1 },
    {
      id: 'activity',
      label: '활동',
      type: 'text',
      required: true,
      placeholder: '예: 거래처 미팅',
      maxLength: 80,
      width: 3,
    },
    {
      id: 'place',
      label: '장소',
      type: 'text',
      placeholder: '예: 부산 사무소',
      maxLength: 60,
      width: 2,
    },
  ],
};

const tableColumns = [
  { label: '일자', width: 30 },
  { label: '시간', width: 24 },
  { label: '활동', width: 80 },
  { label: '장소', width: 40 },
] as const;

const scheduleRows = (rows: FormRows): readonly (readonly string[])[] => {
  const items = (rows.schedule ?? []).filter(
    (row) => (row.activity ?? '').trim() || (row.date ?? '').trim(),
  );
  return items.map((row) => [
    row.date ? formatDateDot(row.date) : '',
    (row.time ?? '').trim(),
    (row.activity ?? '').trim(),
    (row.place ?? '').trim(),
  ]);
};

const blocks: FormBlock[] = [
  {
    kind: 'header',
    variant: 'editorial',
    title: '출장보고서',
    docNoField: 'docNo',
    dateField: 'date',
    logo: true,
  },
  { kind: 'section', title: '출장자' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '성명', field: 'name' },
      { label: '부서', field: 'department' },
    ],
  },
  { kind: 'section', title: '출장 정보' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '출장지', field: 'destination' },
      { label: '기간', field: 'period' },
    ],
  },
  { kind: 'section', title: '주요 일정' },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => scheduleRows(rows),
    minRows: 2,
  },
  { kind: 'section', title: '출장 목적' },
  { kind: 'text', field: 'purpose', minLines: 4 },
  { kind: 'section', title: '활동 내용' },
  { kind: 'text', field: 'summary', minLines: 7 },
  { kind: 'pageBreak' },
  { kind: 'section', title: '결과·성과' },
  { kind: 'text', field: 'results', minLines: 6 },
  { kind: 'section', title: '문제·개선' },
  { kind: 'text', field: 'issues', minLines: 4 },
  { kind: 'section', title: '후속 조치' },
  { kind: 'text', field: 'nextActions', minLines: 4 },
  { kind: 'section', title: '첨부 자료' },
  { kind: 'text', field: 'attachments', minLines: 3 },
  {
    kind: 'signature',
    roles: ['작성자', '검토자', '대표'],
    rolesField: 'approvalRoles',
    bottom: true,
  },
];

export const travelReport: FormTemplate = {
  slug: 'travel-report',
  title: '출장보고서',
  family: 'hr',
  category: 'people',
  description:
    '출장 일정별 활동 내용과 결과, 후속 조치를 정리해 출장보고서를 A4 PDF로 만듭니다. 출장신청서와 같은 형식이라 결재 서류를 한 묶음으로 낼 수 있습니다.',
  keywords: ['출장보고서 양식', '출장보고서 PDF', '출장 결과 보고', '출장 복명서'],
  updated: '2026-11-15',
  docPrefix: 'TP',
  lead: '출장에서 무엇을 했고 무엇을 얻었는지 남기는 출장보고서입니다. 주요 일정·활동·결과·후속 조치를 나눠 적으면 다음 업무로 바로 이어집니다.',
  useCases: [
    '출장 후 결과를 팀에 공유할 때',
    '거래처 방문 내용과 결정 사항을 남길 때',
    '출장비 정산 전에 활동 근거를 정리할 때',
    '다음 출장이나 후속 업무를 준비할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 출장자 정보를 확인합니다.',
    '출장지와 기간, 주요 일정을 입력합니다.',
    '활동 내용·결과·문제·후속 조치를 나눠 적습니다.',
    '결재선을 선택하고 PDF로 내려받습니다.',
  ],
  notes: [
    '이 문서는 참고용입니다. 출장보고 형식과 제출 절차는 회사의 규정을 따르세요.',
    '후속 조치는 담당자와 기한을 함께 적어야 실행으로 이어집니다.',
    '출장비 정산서와 함께 보관하면 활동 근거와 비용을 대조하기 쉽습니다.',
  ],
  fields,
  groups: [schedule],
  blocks,
  sample: {
    docNo: 'R-20261115-001',
    date: '2026-11-15',
    name: '김옷깃',
    department: '경영지원팀',
    destination: '부산',
    from: '2026-11-20',
    to: '2026-11-21',
    purpose: '부산 거래처 방문과 연말 납품 일정 협의',
    summary:
      '11월 20일 오후 부산 거래처를 방문해 연말 납품 일정과 물량을 협의했습니다. 11월 21일 오전 현장을 확인하고 창고 배치를 점검했습니다.',
    results:
      '12월 납품 물량과 일정을 확정했습니다. 현장 창고 배치를 조정해 입고 동선을 줄이기로 했습니다.',
    issues: '오후 이동 시간이 예상보다 길어 현장 점검 시간이 30분 줄었습니다.',
    nextActions: '박출장 — 수정된 납품 일정표 공유 — 11월 24일까지',
    attachments: '거래처 미팅 사진, 납품 일정표 사본',
  },
  sampleRows: {
    schedule: [
      { date: '2026-11-20', time: '14:00', activity: '거래처 미팅', place: '부산 사무소' },
      { date: '2026-11-20', time: '18:00', activity: '저녁 식사 및 일정 정리', place: '숙소' },
      { date: '2026-11-21', time: '09:00', activity: '현장·창고 점검', place: '부산 물류센터' },
    ],
  },
  compute: (values) => {
    const from = values.from ? formatDateDot(values.from) : '';
    const to = values.to ? formatDateDot(values.to) : '';
    return {
      period: from && to ? `${from} ~ ${to}` : from || to,
    };
  },
  faq: [
    {
      q: '출장보고서에는 무엇을 적어야 하나요?',
      a: '출장 목적, 주요 일정, 활동 내용, 결과·성과, 문제·개선, 후속 조치를 적으면 충분합니다. 특히 후속 조치는 담당자와 기한을 함께 적으세요.',
    },
    {
      q: '출장비 정산서와 함께 써야 하나요?',
      a: '출장보고서는 활동과 결과를, 출장비 정산서는 비용과 영수증을 정리합니다. 두 문서를 함께 보관하면 근거와 비용을 대조하기 쉽습니다.',
    },
    {
      q: '결재선은 어떻게 바꾸나요?',
      a: '최대 5명까지 체크하고 이름을 직접 고칠 수 있습니다.',
    },
  ],
  sources: [
    { label: '행정안전부 — 문서 관리 안내', href: 'https://www.mois.go.kr/' },
    { label: '국세청 — 증빙서류 안내', href: 'https://www.nts.go.kr/' },
  ],
  related: [
    { label: '출장신청서', href: '/forms/travel-request/' },
    { label: '출장비 정산서', href: '/forms/travel-expense/' },
    { label: 'PDF 합치기', href: '/tools/pdf-merge/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
