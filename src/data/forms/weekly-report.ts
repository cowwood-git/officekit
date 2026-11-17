import { formatDateDot } from '@/lib/doc/format';
import type { FormBlock, FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const approvalDefault = JSON.stringify([
  { label: '작성자', enabled: true },
  { label: '팀장', enabled: true },
  { label: '부서장', enabled: false },
  { label: '본부장', enabled: false },
  { label: '대표', enabled: false },
]);

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'W-20261115-001',
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
    group: '작성자',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '작성자',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'periodStart',
    label: '시작일',
    type: 'date',
    group: '보고 기간',
    required: true,
  },
  {
    id: 'periodEnd',
    label: '종료일',
    type: 'date',
    group: '보고 기간',
    required: true,
  },
  {
    id: 'summary',
    label: '주요 성과',
    type: 'textarea',
    group: '내용',
    placeholder: '이번 주에 완료했거나 의미 있게 진행한 일',
    rows: 4,
    maxLength: 600,
    span: 3,
  },
  {
    id: 'issues',
    label: '이슈·지원 필요',
    type: 'textarea',
    group: '내용',
    placeholder: '막힌 일, 결정이 필요한 사항',
    rows: 3,
    maxLength: 400,
    span: 3,
  },
  {
    id: 'nextWeek',
    label: '다음 주 계획',
    type: 'textarea',
    group: '내용',
    placeholder: '다음 주에 할 일과 우선순위',
    rows: 4,
    maxLength: 600,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['작성자', '팀장', '부서장', '본부장', '대표'],
    defaultValue: approvalDefault,
    required: true,
    maxSelected: 5,
    editable: true,
    help: '최대 5개까지 선택할 수 있고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const tasks: RepeatGroup = {
  id: 'tasks',
  label: '이번 주 업무',
  group: '보고 기간',
  help: '업무·상태·진행률을 입력합니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 3,
  maxRows: 20,
  addLabel: '+ 업무 추가',
  columns: [
    {
      id: 'task',
      label: '업무',
      type: 'text',
      required: true,
      placeholder: '예: 11월 정산 마감',
      maxLength: 80,
      width: 3,
    },
    {
      id: 'status',
      label: '상태',
      type: 'select',
      options: ['진행 전', '진행 중', '완료', '보류'],
      width: 1.2,
    },
    {
      id: 'progress',
      label: '진행률',
      type: 'number',
      placeholder: '0',
      width: 1,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '이슈·다음 단계',
      maxLength: 60,
      width: 1.8,
    },
  ],
};

const tableColumns = [
  { label: 'No', width: 12, align: 'center' },
  { label: '업무', width: 74 },
  { label: '상태', width: 24 },
  { label: '진행률', width: 22, align: 'right' },
  { label: '비고', width: 42 },
] as const;

const taskRows = (rows: FormRows): readonly (readonly string[])[] => {
  const items = (rows.tasks ?? []).filter((row) => (row.task ?? '').trim());
  return items.map((row, index) => {
    const progress = Number(row.progress ?? 0);
    return [
      String(index + 1),
      (row.task ?? '').trim(),
      (row.status ?? '').trim(),
      progress > 0 ? `${Math.min(100, progress)}%` : '',
      (row.note ?? '').trim(),
    ];
  });
};

const blocks: FormBlock[] = [
  {
    kind: 'header',
    variant: 'editorial',
    title: '주간업무보고',
    docNoField: 'docNo',
    dateField: 'date',
    logo: true,
  },
  { kind: 'section', title: '작성자' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '성명', field: 'name' },
      { label: '부서', field: 'department' },
    ],
  },
  { kind: 'section', title: '보고 기간' },
  {
    kind: 'kv',
    columns: 2,
    rows: [{ label: '기간', field: 'periodLabel' }],
  },
  { kind: 'section', title: '이번 주 업무' },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => taskRows(rows),
    minRows: 3,
  },
  { kind: 'section', title: '주요 성과' },
  { kind: 'text', field: 'summary', minLines: 4 },
  { kind: 'section', title: '이슈·지원 필요' },
  { kind: 'text', field: 'issues', minLines: 3 },
  { kind: 'section', title: '다음 주 계획' },
  { kind: 'text', field: 'nextWeek', minLines: 4 },
  {
    kind: 'signature',
    roles: ['작성자', '팀장'],
    rolesField: 'approvalRoles',
    bottom: true,
  },
];

export const weeklyReport: FormTemplate = {
  slug: 'weekly-report',
  title: '주간업무보고',
  family: 'report',
  category: 'report',
  description:
    '이번 주 업무와 성과, 이슈, 다음 주 계획을 정리해 A4 PDF로 저장합니다. 입력한 내용은 서버로 전송되지 않습니다.',
  keywords: ['주간업무보고 양식', '주간보고 PDF', '주간 업무 보고서', '업무 보고 양식'],
  updated: '2026-11-15',
  docPrefix: 'WR',
  lead: '이번 주에 무엇을 했고 다음 주에 무엇을 할지 한 장에 정리하는 주간업무보고입니다. 업무별 상태와 진행률을 표로 남기고, 성과·이슈·다음 계획을 이어 적습니다.',
  useCases: [
    '매주 팀·개인 업무를 보고할 때',
    '진행률과 막힌 일을 공유할 때',
    '다음 주 우선순위를 정리할 때',
    '월간 보고서의 기초 자료로 쓸 때',
  ],
  howTo: [
    '문서 번호와 작성일, 작성자 정보를 확인합니다.',
    '보고 기간을 입력합니다.',
    '이번 주 업무를 표에 적고 상태·진행률을 입력합니다.',
    '주요 성과·이슈·다음 주 계획을 적고 결재선을 확인합니다.',
  ],
  notes: [
    '이 문서는 참고용입니다. 보고 형식과 제출 주기는 회사의 규정을 따르세요.',
    '업무는 완료·진행 중·보류로 구분하면 다음 주 계획을 세우기 쉽습니다.',
    '진행률은 0~100 사이로 입력합니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  groups: [tasks],
  blocks,
  sample: {
    docNo: 'W-20261115-001',
    date: '2026-11-15',
    name: '김옷깃',
    department: '경영지원팀',
    periodStart: '2026-11-09',
    periodEnd: '2026-11-13',
    summary:
      '11월 정산 마감과 신규 양식 시범 적용을 완료했습니다. 휴가신청서와 회의록을 새 문서 스타일로 정리했습니다.',
    issues: '거래처별 정산 기준이 달라 확인에 시간이 걸렸습니다. 공통 기준표가 필요합니다.',
    nextWeek: '정산 기준표 초안을 만들고, 발주서·납품확인서 양식을 검토합니다.',
  },
  sampleRows: {
    tasks: [
      { task: '11월 정산 마감', status: '완료', progress: '100', note: '이상 없음' },
      { task: '신규 양식 시범 적용', status: '진행 중', progress: '70', note: '휴가·회의록 완료' },
      { task: '거래처 정산 기준 정리', status: '보류', progress: '20', note: '기준 확인 필요' },
    ],
  },
  compute: (values) => {
    const from = values.periodStart ? formatDateDot(values.periodStart) : '';
    const to = values.periodEnd ? formatDateDot(values.periodEnd) : '';
    return { periodLabel: from && to ? `${from} ~ ${to}` : from || to };
  },
  validate: (_values, rows) => {
    const invalid = (rows.tasks ?? []).some((row) => {
      const raw = (row.progress ?? '').trim();
      if (!raw) return false;
      const value = Number(raw);
      return !Number.isFinite(value) || value < 0 || value > 100;
    });
    return invalid ? ['진행률은 0~100 사이 숫자로 입력하세요.'] : [];
  },
  faq: [
    {
      q: '주간업무보고에는 무엇을 적어야 하나요?',
      a: '이번 주 업무와 상태·진행률, 주요 성과, 이슈·지원 필요, 다음 주 계획을 적으면 충분합니다.',
    },
    {
      q: '진행률은 어떻게 입력하나요?',
      a: '0~100 사이 숫자로 입력합니다. 표에는 퍼센트로 표시되고, 비워 두면 표시되지 않습니다.',
    },
    {
      q: '결재선은 꼭 필요한가요?',
      a: '회사 규정에 맞춰 작성자·팀장 등 필요한 역할만 선택하세요. 최대 5명까지 이름을 직접 고칠 수 있습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다.',
    },
  ],
  sources: [
    { label: '행정안전부 — 문서 관리 안내', href: 'https://www.mois.go.kr/' },
    { label: '국세청 — 증빙서류 안내', href: 'https://www.nts.go.kr/' },
  ],
  related: [
    { label: '회의록', href: '/forms/meeting-minutes/' },
    { label: '인수인계서', href: '/forms/handover/' },
    { label: 'PDF 합치기', href: '/tools/pdf-merge/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
