import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const tasks: RepeatGroup = {
  id: 'tasks',
  label: '업무 내역',
  group: '근무 정보',
  help: '업무와 진행 내용, 상태, 소요 시간을 적습니다. 총 업무 시간이 자동으로 계산됩니다.',
  minRows: 3,
  maxRows: 20,
  addLabel: '+ 업무 추가',
  required: true,
  summaryField: 'totalHoursLabel',
  summaryLabel: '총 업무 시간',
  columns: [
    {
      id: 'task',
      label: '업무',
      type: 'text',
      required: true,
      placeholder: '예: 홈페이지 화면 수정',
      maxLength: 60,
      width: 2.4,
    },
    {
      id: 'detail',
      label: '진행 내용',
      type: 'text',
      placeholder: '어디까지 했는지',
      maxLength: 80,
      width: 2.6,
    },
    {
      id: 'status',
      label: '상태',
      type: 'select',
      options: ['완료', '진행 중', '보류'],
      width: 1.2,
    },
    {
      id: 'hours',
      label: '시간',
      type: 'number',
      required: true,
      placeholder: '2',
      step: 0.5,
      width: 0.9,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'WL-20261117-001',
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
    id: 'name',
    label: '성명',
    type: 'text',
    group: '작성자',
    required: true,
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '작성자',
    placeholder: '개발팀',
    maxLength: 40,
  },
  {
    id: 'position',
    label: '직위',
    type: 'text',
    group: '작성자',
    placeholder: '대리',
    maxLength: 30,
  },
  {
    id: 'workDate',
    label: '근무일',
    type: 'date',
    group: '근무 정보',
    required: true,
  },
  {
    id: 'totalHoursLabel',
    label: '총 업무 시간',
    type: 'computed',
    group: '근무 정보',
    help: '업무별 시간의 합계입니다.',
  },
  {
    id: 'summary',
    label: '오늘 요약',
    type: 'textarea',
    group: '요약',
    placeholder: '오늘의 주요 성과와 진행 상황을 2~3줄로 정리합니다.',
    required: true,
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'plan',
    label: '이슈·다음 계획',
    type: 'textarea',
    group: '요약',
    placeholder: '막힌 일, 도움이 필요한 일, 내일 할 일',
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['작성자', '팀장', '부서장', '본부장', '대표'],
    defaultValue: JSON.stringify([
      { label: '작성자', enabled: true },
      { label: '팀장', enabled: true },
      { label: '부서장', enabled: false },
      { label: '본부장', enabled: false },
      { label: '대표', enabled: false },
    ]),
    maxSelected: 5,
    editable: true,
    help: '5칸 중 필요한 단계만 켜고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const tasksOf = (rows: FormRows): FormRows['tasks'] =>
  (rows.tasks ?? []).filter((row) => (row.task ?? '').trim());

const hoursOf = (row: Record<string, string>): number => {
  const hours = Number((row.hours ?? '').replace(/,/g, ''));
  return Number.isFinite(hours) ? hours : 0;
};

const formatHours = (value: number): string =>
  Number.isInteger(value) ? `${value}시간` : `${value.toFixed(1)}시간`;

export const workLog: FormTemplate = {
  slug: 'work-log',
  title: '일일업무일지',
  family: 'report',
  category: 'report',
  description:
    '하루 동안 진행한 업무와 소요 시간, 상태, 다음 계획을 정리하는 일일업무일지를 브라우저에서 작성하고 A4 PDF로 저장합니다. 총 업무 시간이 자동 계산됩니다.',
  keywords: [
    '일일업무일지',
    '업무일지 양식',
    '일일 업무 일지',
    '데일리 업무일지',
    '업무일보',
    '일일업무일지 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'WL',
  lead: '하루의 업무를 시간과 상태로 정리하는 일지입니다. 업무별 소요 시간을 입력하면 총 업무 시간이 자동으로 계산되고, 다음 날 계획까지 한 장에 남길 수 있습니다.',
  useCases: [
    '하루 업무를 팀에 공유할 때',
    '업무별 소요 시간을 기록할 때',
    '진행 중·보류 업무를 정리할 때',
    '주간·월간 보고의 기초 자료로 쓸 때',
  ],
  howTo: [
    '문서 번호와 작성일, 작성자 정보를 확인합니다.',
    '근무일을 적고 업무·진행 내용·상태·시간을 한 줄씩 입력합니다.',
    '총 업무 시간을 확인하고 오늘 요약을 적습니다.',
    '이슈와 다음 계획을 적고 PDF로 내려받습니다.',
  ],
  notes: [
    '업무 시간은 실제 소요 시간을 기준으로 적습니다. 반시간 단위는 0.5로 입력할 수 있습니다.',
    '민감한 고객 정보나 내부 자료는 필요한 범위에서만 적고 외부 공유에 주의하세요.',
    '매일 같은 시간에 정리하면 주간·월간 보고를 만들기 쉽습니다.',
  ],
  fields,
  groups: [tasks],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '일일업무일지',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '작성자' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '성명', field: 'name' },
        { label: '부서', field: 'department' },
        { label: '직위', field: 'position' },
      ],
    },
    { kind: 'section', title: '근무 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '근무일', field: 'workDate' },
        { label: '총 업무 시간', field: 'totalHoursLabel' },
      ],
    },
    { kind: 'section', title: '업무 내역' },
    {
      kind: 'table',
      columns: [
        { label: '업무', width: 64 },
        { label: '진행 내용', width: 64 },
        { label: '상태', width: 26, align: 'center' },
        { label: '시간', width: 20, align: 'right' },
      ],
      rows: (_values, rows) =>
        tasksOf(rows).map((row) => [
          (row.task ?? '').trim(),
          (row.detail ?? '').trim(),
          (row.status ?? '').trim(),
          row.hours ? formatHours(hoursOf(row)) : '',
        ]),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [{ label: '총 업무 시간', field: 'totalHoursLabel', strong: true }],
      width: 60,
    },
    { kind: 'section', title: '오늘 요약' },
    { kind: 'text', field: 'summary', minLines: 2 },
    { kind: 'section', title: '이슈·다음 계획' },
    { kind: 'text', field: 'plan', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const total = tasksOf(rows).reduce((sum, row) => sum + hoursOf(row), 0);
    return { totalHoursLabel: total > 0 ? formatHours(total) : '' };
  },
  validate: (_values, rows) => {
    const list = tasksOf(rows);
    const errors: string[] = [];
    if (list.length === 0) {
      errors.push('업무 내역을 한 줄 이상 입력하세요.');
    }
    if (list.some((row) => hoursOf(row) <= 0)) {
      errors.push('업무 시간은 0.5시간 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'WL-20261117-001',
    date: '2026-11-17',
    name: '김옷깃',
    department: '개발팀',
    position: '대리',
    workDate: '2026-11-17',
    summary:
      '홈페이지 상담 폼 검증을 마무리하고 모바일 테스트를 진행했습니다. 남은 오류 1건은 내일 오전에 수정합니다.',
    plan: '모바일 폼 오류 수정 후 팀장 검수 요청. 12월 배포 일정은 목요일 회의에서 확정합니다.',
  },
  sampleRows: {
    tasks: [
      {
        task: '상담 폼 검증',
        detail: '필수값·이메일 형식 검사 추가',
        status: '완료',
        hours: '3',
      },
      {
        task: '모바일 화면 테스트',
        detail: 'iOS·Android 주요 화면 확인',
        status: '진행 중',
        hours: '3',
      },
      {
        task: '주간보고 정리',
        detail: '이번 주 진행률과 이슈 정리',
        status: '완료',
        hours: '1.5',
      },
      {
        task: '배포 체크리스트',
        detail: '12월 배포 항목 초안 작성',
        status: '보류',
        hours: '0.5',
      },
    ],
  },
  faq: [
    {
      q: '일일업무일지에는 무엇을 적어야 하나요?',
      a: '업무별로 무엇을 했는지, 어디까지 진행됐는지, 상태와 소요 시간을 적습니다. 마지막에 오늘 요약과 다음 계획을 남기면 좋습니다.',
    },
    {
      q: '시간은 어떻게 계산되나요?',
      a: '업무별 시간을 더해 총 업무 시간을 표시합니다. 반시간은 0.5로 입력할 수 있습니다.',
    },
    {
      q: '진행 중인 업무도 적나요?',
      a: '네. 상태를 “진행 중”으로 두고 어디까지 했는지 적습니다. 다음 날 이어서 할 일을 파악하기 쉽습니다.',
    },
    {
      q: '주간보고와 어떻게 연결하나요?',
      a: '일지의 요약과 이슈를 주간보고에 옮기면 됩니다. 같은 업무 표 구조를 쓰고 있어 정리가 쉽습니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 근로시간 안내',
      href: 'https://www.moel.go.kr/',
    },
  ],
  related: [
    { label: '영업활동일지 양식', href: '/forms/sales-daily/' },
    { label: '주간업무보고 양식', href: '/forms/weekly-report/' },
    { label: '월간업무보고 양식', href: '/forms/monthly-report/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
