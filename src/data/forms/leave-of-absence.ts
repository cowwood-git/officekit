import type { FormField, FormTemplate } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'LOA-20261117-001',
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
    placeholder: '김휴직',
    required: true,
    maxLength: 30,
  },
  {
    id: 'employeeNo',
    label: '사번',
    type: 'text',
    group: '신청자',
    placeholder: '2021002',
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
    placeholder: '과장',
    maxLength: 30,
  },
  {
    id: 'reasonType',
    label: '휴직 사유',
    type: 'select',
    group: '휴직 정보',
    options: ['질병·치료', '유학·연수', '가족 돌봄', '개인 사정', '기타'],
    defaultValue: '질병·치료',
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
    id: 'returnDate',
    label: '복직 예정일',
    type: 'date',
    group: '휴직 정보',
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
    id: 'reasonDetail',
    label: '휴직 사유 상세',
    type: 'textarea',
    group: '휴직 사유',
    placeholder: '휴직이 필요한 이유와 기간을 구체적으로 적습니다.',
    required: true,
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'handover',
    label: '업무 인수인계',
    type: 'textarea',
    group: '업무 인수인계',
    placeholder: '인수인계 담당자, 주요 업무, 진행 중인 일정을 적습니다.',
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

export const leaveOfAbsence: FormTemplate = {
  slug: 'leave-of-absence',
  title: '휴직 신청서',
  family: 'hr',
  category: 'people',
  description:
    '질병·유학·가족 돌봄 등으로 휴직이 필요할 때 기간과 사유, 복직 예정일을 정리하는 휴직 신청서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '휴직 신청서',
    '휴직 신청서 양식',
    '휴직원',
    '휴직 사유서',
    '복직 예정일',
    '휴직 신청서 PDF',
  ],
  updated: '2026-11-20',
  docPrefix: 'LOA',
  lead: '질병·유학·가족 돌봄 등으로 휴직이 필요할 때 기간과 사유를 정리하는 신청서입니다. 복직 예정일과 업무 인수인계까지 한 장에 담습니다.',
  useCases: [
    '질병 치료나 요양을 위해 휴직할 때',
    '유학·연수 등 장기 교육을 위해 휴직할 때',
    '가족 돌봄이 필요해 휴직할 때',
    '복직 일정과 업무 인수인계를 회사에 알릴 때',
  ],
  howTo: [
    '신청일과 신청자 정보를 확인합니다.',
    '휴직 사유와 시작일·종료일을 적습니다.',
    '복직 예정일과 업무 인수인계를 정리합니다.',
    'PDF로 내려받아 결재를 받고 회사 규정에 따라 제출합니다.',
  ],
  notes: [
    '휴직 가능 기간과 급여·복직 조건은 회사 취업규칙과 관련 법령에 따라 다릅니다.',
    '질병 휴직은 진단서·소견서 등 증빙이 필요할 수 있으니 인사 담당자에게 확인하세요.',
    '회사 사정으로 쉬게 하는 것은 근로자가 신청하는 휴직이 아니라 휴업이며, 평균임금의 70% 이상 휴업수당을 줘야 합니다(근로기준법 제46조). 출산·육아 휴직은 전용 양식을 쓰세요.',
    '업무 인수인계를 구체적으로 적으면 복직 후 업무 공백을 줄일 수 있습니다.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '휴직 신청서',
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
    { kind: 'section', title: '휴직 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '휴직 사유', field: 'reasonType' },
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
    { kind: 'kv', columns: 1, rows: [{ label: '복직 예정일', field: 'returnDate' }] },
    { kind: 'section', title: '휴직 사유' },
    { kind: 'text', field: 'reasonDetail', minLines: 3 },
    { kind: 'section', title: '업무 인수인계' },
    { kind: 'text', field: 'handover', minLines: 3 },
    {
      kind: 'notice',
      text: '휴직 기간·급여·복직 조건은 회사 규정과 관련 법령에 따라 달라질 수 있습니다.',
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
    if (values.endDate && values.returnDate && values.returnDate < values.endDate) {
      errors.push('복직 예정일은 휴직 종료일보다 빠를 수 없습니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'LOA-20261117-001',
    date: '2026-11-17',
    name: '김휴직',
    employeeNo: '2021002',
    department: '경영지원팀',
    position: '과장',
    reasonType: '질병·치료',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    returnDate: '2027-03-01',
    reasonDetail:
      '허리 디스크 치료와 재활을 위해 3개월간 휴직이 필요합니다. 담당 의사의 치료 계획서와 진단서를 함께 제출합니다.',
    handover:
      '급여·4대보험 업무는 이담당에게, 진행 중인 계약 검토는 팀장이 맡습니다. 복직 후 재개할 일정은 인수인계 문서에 정리했습니다.',
  },
  faq: [
    {
      q: '휴직과 연차휴가의 차이는 무엇인가요?',
      a: '연차휴가는 근로 제공 의무가 유지되는 유급휴가이고, 휴직은 일정 기간 근로를 제공하지 않는 제도입니다. 기간·급여·복직 조건은 회사 규정을 따릅니다.',
    },
    {
      q: '질병 휴직에는 어떤 서류가 필요한가요?',
      a: '회사 규정에 따라 진단서·소견서·치료 계획서 등이 필요할 수 있습니다. 인사 담당자에게 제출 서류를 확인하세요.',
    },
    {
      q: '복직 예정일은 어떻게 정하나요?',
      a: '휴직 종료일 다음 날을 복직일로 정하는 경우가 일반적입니다. 회사 규정과 본인의 치료·일정을 함께 고려하세요.',
    },
    {
      q: '휴직 중 급여는 나오나요?',
      a: '휴직 사유와 회사 규정에 따라 다릅니다. 무급휴직, 질병휴직, 육아휴직 등 제도별로 급여와 신청 절차가 다르니 확인하세요.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 휴직·복직 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '국가법령정보센터 — 근로기준법',
      href: 'https://www.law.go.kr/',
    },
  ],
  related: [
    { label: '육아휴직 신청서 양식', href: '/forms/parental-leave/' },
    { label: '근태 정정 신청서 양식', href: '/forms/attendance-correction/' },
    { label: '휴가신청서 양식', href: '/forms/leave-request/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
