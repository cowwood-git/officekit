import type { FormField, FormTemplate } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'ML-20261117-001',
    help: '신청일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '신청일',
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
    placeholder: '김육아',
    required: true,
    maxLength: 30,
  },
  {
    id: 'employeeNo',
    label: '사번',
    type: 'text',
    group: '신청자',
    placeholder: '2021001',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '신청자',
    placeholder: '개발팀',
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
    id: 'childName',
    label: '자녀 성명',
    type: 'text',
    group: '자녀 정보',
    placeholder: '김아이',
    required: true,
    maxLength: 30,
  },
  {
    id: 'childBirth',
    label: '자녀 생년월일',
    type: 'date',
    group: '자녀 정보',
    required: true,
  },
  {
    id: 'leaveType',
    label: '신청 구분',
    type: 'select',
    group: '휴직 정보',
    options: ['육아휴직', '육아기 근로시간 단축'],
    defaultValue: '육아휴직',
    required: true,
  },
  {
    id: 'startDate',
    label: '휴직 시작일',
    type: 'date',
    group: '휴직 정보',
    required: true,
  },
  {
    id: 'endDate',
    label: '휴직 종료일',
    type: 'date',
    group: '휴직 정보',
    required: true,
  },
  {
    id: 'splitUse',
    label: '분할 사용',
    type: 'select',
    group: '휴직 정보',
    options: ['아니요', '예'],
    defaultValue: '아니요',
    required: true,
    help: '분할 사용을 신청하려면 “예”를 고르고 기간을 적습니다.',
  },
  {
    id: 'benefitApply',
    label: '급여 신청',
    type: 'select',
    group: '휴직 정보',
    options: ['신청함', '신청하지 않음'],
    defaultValue: '신청함',
    required: true,
  },
  {
    id: 'periodLabel',
    label: '휴직 기간',
    type: 'computed',
    group: '휴직 정보',
    help: '시작일과 종료일을 포함한 일수입니다.',
  },
  {
    id: 'splitPlan',
    label: '분할 사용 계획',
    type: 'textarea',
    group: '분할 사용 계획',
    placeholder: '예: 2026. 12. 1. ~ 2027. 5. 31., 2027. 6. 1. ~ 2027. 11. 30.',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'handover',
    label: '업무 인수인계',
    type: 'textarea',
    group: '업무 인수인계',
    placeholder: '인수인계 담당자와 주요 업무, 진행 중인 일정을 적습니다.',
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['신청자', '팀장', '인사 담당', '부서장', '대표'],
    defaultValue: JSON.stringify([
      { label: '신청자', enabled: true },
      { label: '팀장', enabled: true },
      { label: '인사 담당', enabled: true },
      { label: '부서장', enabled: false },
      { label: '대표', enabled: false },
    ]),
    required: true,
    maxSelected: 5,
    editable: true,
    help: '5칸 중 필요한 단계만 켜고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const daysBetween = (start: string, end: string): number => {
  const from = Date.parse(start);
  const to = Date.parse(end);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return 0;
  return Math.floor((to - from) / 86_400_000) + 1;
};

export const parentalLeave: FormTemplate = {
  slug: 'parental-leave',
  title: '육아휴직 신청서',
  family: 'hr',
  category: 'people',
  description:
    '자녀 정보와 휴직 기간, 분할 사용·급여 신청 여부를 정리하는 육아휴직 신청서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '육아휴직 신청서',
    '육아휴직 신청서 양식',
    '육아휴직 신청',
    '육아기 근로시간 단축',
    '육아휴직 PDF',
    '육아휴직 서류',
  ],
  updated: '2026-11-17',
  docPrefix: 'ML',
  lead: '자녀 정보와 휴직 기간을 정리해 회사에 제출하는 육아휴직 신청서입니다. 분할 사용과 급여 신청 여부, 업무 인수인계까지 한 장에 담습니다.',
  useCases: [
    '자녀 양육을 위해 육아휴직을 신청할 때',
    '육아기 근로시간 단축을 함께 신청할 때',
    '분할 사용 기간과 급여 신청 여부를 정리할 때',
    '업무 인수인계와 복직 일정을 회사에 알릴 때',
  ],
  howTo: [
    '신청일과 신청자 정보를 확인합니다.',
    '자녀 성명과 생년월일을 적습니다.',
    '휴직 기간과 분할 사용, 급여 신청 여부를 정합니다.',
    '업무 인수인계를 적고 PDF로 내려받아 결재를 받습니다.',
  ],
  notes: [
    '육아휴직 기간과 급여 요건은 고용노동부·고용센터 안내와 회사 취업규칙을 확인하세요.',
    '분할 사용은 사업주와 협의가 필요할 수 있으므로 사용 계획을 구체적으로 적는 것이 좋습니다.',
    '자녀의 개인정보는 신청 목적에 필요한 범위에서만 적고, 제출 후 보관·파기에 유의하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '육아휴직 신청서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '신청자' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '성명', field: 'name' },
        { label: '사번', field: 'employeeNo' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '부서', field: 'department' },
        { label: '직위', field: 'position' },
      ],
    },
    { kind: 'section', title: '자녀 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '자녀 성명', field: 'childName' },
        { label: '자녀 생년월일', field: 'childBirth' },
      ],
    },
    { kind: 'section', title: '휴직 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '신청 구분', field: 'leaveType' },
        { label: '휴직 기간', field: 'periodLabel' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '휴직 시작일', field: 'startDate' },
        { label: '휴직 종료일', field: 'endDate' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '분할 사용', field: 'splitUse' },
        { label: '급여 신청', field: 'benefitApply' },
      ],
    },
    { kind: 'section', title: '분할 사용 계획' },
    { kind: 'text', field: 'splitPlan', minLines: 2 },
    { kind: 'section', title: '업무 인수인계' },
    { kind: 'text', field: 'handover', minLines: 3 },
    {
      kind: 'notice',
      text: '육아휴직 기간·급여 요건은 관련 법령과 회사 규정에 따라 달라질 수 있습니다.',
    },
    {
      kind: 'signature',
      roles: ['신청자', '팀장', '인사 담당'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values) => ({
    periodLabel:
      values.startDate && values.endDate
        ? `${daysBetween(values.startDate, values.endDate).toLocaleString('ko-KR')}일`
        : '',
  }),
  validate: (values) => {
    const errors: string[] = [];
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      errors.push('휴직 종료일은 시작일보다 빠를 수 없습니다.');
    }
    if (values.splitUse === '예' && (values.splitPlan ?? '').trim().length < 5) {
      errors.push('분할 사용 계획을 5자 이상 적어 주세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'ML-20261117-001',
    date: '2026-11-17',
    name: '김육아',
    employeeNo: '2021001',
    department: '개발팀',
    position: '대리',
    childName: '김아이',
    childBirth: '2024-05-10',
    leaveType: '육아휴직',
    startDate: '2026-12-01',
    endDate: '2027-11-30',
    splitUse: '아니요',
    benefitApply: '신청함',
    splitPlan: '해당 없음 — 분할 사용하지 않습니다.',
    handover:
      '진행 중인 문서 자동화 프로젝트는 이담당에게 인수인계합니다. 주간보고와 거래처 연락은 팀장이 대신 맡고, 복직 후 기존 업무로 복귀합니다.',
  },
  faq: [
    {
      q: '육아휴직은 얼마나 사용할 수 있나요?',
      a: '부모 각각 자녀 1명당 1년을 기본으로 사용할 수 있고, 부모가 함께 사용하는 경우 등 법령에 따라 기간이 달라질 수 있습니다. 고용노동부 안내를 확인하세요.',
    },
    {
      q: '분할 사용도 가능한가요?',
      a: '가능하지만 사업주와 협의가 필요할 수 있습니다. 분할 사용 계획에 각 기간을 구체적으로 적으세요.',
    },
    {
      q: '급여는 어디에 신청하나요?',
      a: '육아휴직급여는 고용센터에 신청하는 것이 일반적입니다. 회사에 제출하는 신청서와 별도로 급여 신청 절차를 확인하세요.',
    },
    {
      q: '복직은 언제 하나요?',
      a: '휴직 종료일 다음 날부터 복직하는 것이 일반적입니다. 회사 인사 규정과 복직 절차를 함께 확인하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 육아휴직 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '고용24 — 육아휴직급여 신청',
      href: 'https://www.work24.go.kr/',
    },
  ],
  related: [
    { label: '휴직 신청서 양식', href: '/forms/leave-of-absence/' },
    { label: '근태 정정 신청서 양식', href: '/forms/attendance-correction/' },
    { label: '근로계약서 양식', href: '/forms/employment-contract/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
