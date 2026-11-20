import { formatDateDot } from '@/lib/doc/format';
import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const plans: RepeatGroup = {
  id: 'plans',
  label: '사용 계획',
  group: '연차 정보',
  help: '날짜와 일수를 적습니다. 반차는 0.5처럼 소수로 입력할 수 있습니다.',
  minRows: 2,
  maxRows: 30,
  addLabel: '+ 계획 추가',
  required: true,
  summaryField: 'totalDaysLabel',
  summaryLabel: '계획 일수',
  columns: [
    {
      id: 'date',
      label: '사용일',
      type: 'date',
      required: true,
      width: 1.3,
    },
    {
      id: 'days',
      label: '일수',
      type: 'number',
      required: true,
      placeholder: '1',
      step: 0.5,
      width: 1,
    },
    {
      id: 'reason',
      label: '사유',
      type: 'text',
      placeholder: '예: 개인 사정, 가족 행사',
      maxLength: 60,
      width: 3.4,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'LP-20261117-001',
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
    group: '신청자',
    required: true,
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '신청자',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'position',
    label: '직위',
    type: 'text',
    group: '신청자',
    placeholder: '대리',
    maxLength: 30,
  },
  {
    id: 'planYear',
    label: '계획 연도',
    type: 'text',
    group: '연차 정보',
    placeholder: '2026',
    defaultValue: '2026',
    required: true,
    maxLength: 4,
  },
  {
    id: 'entitlement',
    label: '부여 연차(일)',
    type: 'number',
    group: '연차 정보',
    placeholder: '15',
    help: '올해 부여받은 총 연차 일수입니다.',
  },
  {
    id: 'usedDays',
    label: '사용 연차(일)',
    type: 'number',
    group: '연차 정보',
    placeholder: '0',
    help: '이미 사용한 연차 일수입니다.',
  },
  {
    id: 'totalDaysLabel',
    label: '계획 일수',
    type: 'computed',
    group: '연차 정보',
    help: '아래 사용 계획의 일수 합계입니다.',
  },
  {
    id: 'remainingLabel',
    label: '잔여 연차',
    type: 'computed',
    group: '연차 정보',
    help: '부여 연차 − 사용 연차 − 계획 일수입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '부서 일정, 대체 근무 등',
    maxLength: 300,
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
    required: true,
    maxSelected: 5,
    editable: true,
    help: '5칸 중 필요한 단계만 켜고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const plansOf = (rows: FormRows): FormRows['plans'] =>
  (rows.plans ?? []).filter((row) => (row.date ?? '').trim());

const daysOf = (row: Record<string, string>): number => {
  const days = Number((row.days ?? '').replace(/,/g, ''));
  return Number.isFinite(days) ? days : 0;
};

const formatDays = (value: number): string =>
  Number.isInteger(value) ? `${value}일` : `${value.toFixed(1)}일`;

const numberField = (value: string | undefined): number => {
  const parsed = Number((value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const leavePlan: FormTemplate = {
  slug: 'leave-plan',
  title: '연차 사용계획서',
  family: 'hr',
  category: 'people',
  description:
    '한 해 연차 사용 계획을 날짜별로 정리하는 연차 사용계획서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 계획 일수와 잔여 연차가 자동으로 계산됩니다.',
  keywords: [
    '연차 사용계획서',
    '연차 계획서',
    '연차 사용 계획',
    '휴가 계획서',
    '연차 신청 계획',
    '연차계획서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'LP',
  lead: '올해 연차를 언제, 며칠 쓸지 미리 정리하는 계획서입니다. 부여·사용 연차를 적으면 계획 일수와 잔여 연차가 자동으로 계산되고 반차도 0.5일로 입력할 수 있습니다.',
  useCases: [
    '연초·연말에 연차 사용 계획을 팀에 공유할 때',
    '장기 휴가 전에 업무 공백을 조정할 때',
    '연차 소진 계획을 인사팀에 제출할 때',
    '반차·반반차 일정을 미리 정리할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 신청자 정보를 확인합니다.',
    '계획 연도와 부여 연차, 이미 사용한 연차를 적습니다.',
    '사용할 날짜와 일수(반차는 0.5), 사유를 한 줄씩 입력합니다.',
    '계획 일수와 잔여 연차를 확인하고 PDF로 내려받습니다.',
  ],
  notes: [
    '연차 부여 일수와 사용 기준은 회사의 취업규칙·근로계약에 따릅니다. 이 문서는 계획을 정리하는 보조 자료입니다.',
    '계획을 세운 뒤에도 실제 사용 전에는 휴가신청서로 승인을 받아야 합니다.',
    '반차·반반차 단위는 회사 규정에 따라 다를 수 있습니다. 입력 전에 확인하세요.',
  ],
  fields,
  groups: [plans],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '연차 사용계획서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '신청자' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '성명', field: 'name' },
        { label: '부서', field: 'department' },
        { label: '직위', field: 'position' },
      ],
    },
    { kind: 'section', title: '연차 정보' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '계획 연도', field: 'planYear' },
        { label: '부여 연차(일)', field: 'entitlement' },
        { label: '사용 연차(일)', field: 'usedDays' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '계획 일수', field: 'totalDaysLabel' },
        { label: '잔여 연차', field: 'remainingLabel' },
      ],
    },
    { kind: 'section', title: '사용 계획' },
    {
      kind: 'table',
      columns: [
        { label: '사용일', width: 30 },
        { label: '일수', width: 16, align: 'right' },
        { label: '사유', width: 128 },
      ],
      rows: (_values, rows) =>
        plansOf(rows).map((row) => [
          row.date ? formatDateDot(row.date) : '',
          row.days ? formatDays(daysOf(row)) : '',
          (row.reason ?? '').trim(),
        ]),
      minRows: 2,
    },
    {
      kind: 'totals',
      rows: [{ label: '계획 일수', field: 'totalDaysLabel', strong: true }],
      width: 60,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장', '부서장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values, rows) => {
    const planned = plansOf(rows).reduce((sum, row) => sum + daysOf(row), 0);
    const entitlement = numberField(values.entitlement);
    const used = numberField(values.usedDays);
    const remaining = entitlement - used - planned;
    return {
      totalDaysLabel: planned > 0 ? formatDays(planned) : '',
      remainingLabel: entitlement > 0 ? formatDays(remaining) : '',
    };
  },
  validate: (values, rows) => {
    const errors: string[] = [];
    const plans = plansOf(rows);
    if (plans.length === 0) {
      errors.push('사용 계획을 한 줄 이상 입력하세요.');
    }
    if (plans.some((row) => daysOf(row) <= 0)) {
      errors.push('일수는 0.5일 이상이어야 합니다.');
    }
    const entitlement = numberField(values.entitlement);
    const used = numberField(values.usedDays);
    const planned = plans.reduce((sum, row) => sum + daysOf(row), 0);
    if (entitlement > 0 && used + planned > entitlement) {
      errors.push('사용·계획 연차가 부여 연차를 넘습니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'LP-20261117-001',
    date: '2026-11-17',
    name: '김옷깃',
    department: '경영지원팀',
    position: '대리',
    planYear: '2026',
    entitlement: '15',
    usedDays: '6',
    note: '12월 결산 기간에는 팀 일정을 피해 사용합니다.',
  },
  sampleRows: {
    plans: [
      { date: '2026-12-04', days: '1', reason: '개인 사정' },
      { date: '2026-12-11', days: '0.5', reason: '병원 방문(오후 반차)' },
      { date: '2026-12-24', days: '2', reason: '연말 휴가' },
    ],
  },
  faq: [
    {
      q: '연차 사용계획서와 휴가신청서는 무엇이 다른가요?',
      a: '계획서는 한 해 동안 언제 연차를 쓸지 미리 정리하는 문서이고, 휴가신청서는 실제 사용 직전에 승인을 받는 문서입니다. 계획을 세운 뒤에도 사용 전에는 휴가신청서를 제출하세요.',
    },
    {
      q: '반차도 입력할 수 있나요?',
      a: '네. 일수에 0.5를 입력하면 반차로 계산됩니다. 반반차 등 회사 규정이 다르면 그 단위에 맞춰 소수로 적으세요.',
    },
    {
      q: '잔여 연차는 어떻게 계산되나요?',
      a: '부여 연차에서 이미 사용한 연차와 아래 계획 일수를 뺀 값입니다. 부여 연차를 비워 두면 잔여 연차는 표시되지 않습니다.',
    },
    {
      q: '계획보다 연차가 부족하면 어떻게 하나요?',
      a: '사용·계획 합계가 부여 연차를 넘으면 PDF를 만들 수 없습니다. 계획을 줄이거나 인사팀과 연차 조정을 상의하세요.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 근로기준법 연차휴가 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '근로기준법 제60조 (연차 유급휴가)',
      href: 'https://www.law.go.kr/',
    },
  ],
  related: [
    { label: '휴가신청서 양식', href: '/forms/leave-request/' },
    { label: '초과근무 신청서 양식', href: '/forms/overtime-request/' },
    { label: '인수인계서 양식', href: '/forms/handover/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
