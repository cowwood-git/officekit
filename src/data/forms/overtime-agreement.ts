import type { FormField, FormTemplate } from '@/lib/doc/types';
import { hoursFrom, WEEKLY_OVERTIME_LIMIT } from '@/lib/labor-limits';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'OTA-20261117-001',
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
    id: 'company',
    label: '회사명',
    type: 'text',
    group: '회사 정보',
    placeholder: '옷깃 주식회사',
    required: true,
    maxLength: 60,
    span: 2,
  },
  {
    id: 'ceo',
    label: '대표자',
    type: 'text',
    group: '회사 정보',
    placeholder: '박대표',
    maxLength: 30,
  },
  {
    id: 'name',
    label: '근로자 성명',
    type: 'text',
    group: '근로자 정보',
    placeholder: '김근로',
    required: true,
    maxLength: 30,
  },
  {
    id: 'employeeNo',
    label: '사번',
    type: 'text',
    group: '근로자 정보',
    placeholder: '2021003',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '근로자 정보',
    placeholder: '개발팀',
    maxLength: 40,
  },
  {
    id: 'position',
    label: '직위',
    type: 'text',
    group: '근로자 정보',
    placeholder: '대리',
    maxLength: 30,
  },
  {
    id: 'periodStart',
    label: '적용 시작일',
    type: 'date',
    group: '동의 내용',
    required: true,
  },
  {
    id: 'periodEnd',
    label: '적용 종료일',
    type: 'date',
    group: '동의 내용',
    required: true,
  },
  {
    id: 'weeklyLimit',
    label: '주당 연장근로 한도',
    type: 'text',
    group: '동의 내용',
    placeholder: '예: 12시간',
    defaultValue: '12시간',
    help: '당사자가 합의해도 1주 12시간을 넘길 수 없습니다(근로기준법 제53조제1항).',
    required: true,
    maxLength: 30,
  },
  {
    id: 'agreeOvertime',
    label: '연장근로 동의',
    type: 'select',
    group: '동의 내용',
    options: ['동의함', '동의하지 않음'],
    defaultValue: '동의함',
    required: true,
  },
  {
    id: 'agreeHoliday',
    label: '휴일근로 동의',
    type: 'select',
    group: '동의 내용',
    options: ['동의함', '동의하지 않음'],
    defaultValue: '동의함',
    required: true,
  },
  {
    id: 'scope',
    label: '업무 범위·사유',
    type: 'textarea',
    group: '업무 범위',
    placeholder: '연장·휴일근로가 필요한 업무와 사유를 적습니다.',
    required: true,
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'note',
    label: '기타 조건',
    type: 'textarea',
    group: '기타 조건',
    placeholder: '근로시간 기록 방법, 대체휴일, 건강 보호 조치 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명',
    type: 'roles',
    group: '서명',
    options: ['근로자', '사업주'],
    defaultValue: JSON.stringify([
      { label: '근로자', enabled: true },
      { label: '사업주', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '서명란에 표시할 당사자 이름입니다.',
    span: 3,
  },
];

export const overtimeAgreement: FormTemplate = {
  slug: 'overtime-agreement',
  title: '연장·휴일근로 동의서',
  family: 'hr',
  category: 'people',
  description:
    '연장근로와 휴일근로의 적용 기간·한도·업무 범위를 정하고 근로자와 사업주가 서명하는 동의서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '연장근로 동의서',
    '연장근로 동의서 양식',
    '휴일근로 동의서',
    '연장근로 합의서',
    '근로시간 동의',
    '연장근로 동의서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'OTA',
  lead: '연장·휴일근로가 필요한 기간과 한도, 업무 범위를 정하고 근로자와 사업주가 서명하는 동의서입니다. 근로시간 기록과 건강 보호 조치도 함께 안내합니다.',
  useCases: [
    '프로젝트 마감 등으로 연장근로가 필요할 때',
    '휴일에 근로가 필요한 일정을 정할 때',
    '근로자와 연장근로 한도를 문서로 합의할 때',
    '근로시간 기록과 가산수당 지급 근거를 남길 때',
  ],
  howTo: [
    '작성일과 회사·근로자 정보를 확인합니다.',
    '적용 기간과 주당 연장근로 한도를 적습니다.',
    '연장근로·휴일근로 동의 여부를 고릅니다.',
    '업무 범위와 기타 조건을 적고 PDF로 내려받아 양쪽이 서명합니다.',
  ],
  notes: [
    '연장근로는 당사자 합의로 1주 12시간까지 할 수 있고(근로기준법 제53조제1항), 연장·야간·휴일근로에는 통상임금의 50% 이상을 가산해 지급합니다(제56조).',
    '동의는 근로자가 자유롭게 결정할 수 있어야 하며, 동의하지 않았다는 이유로 불이익을 주어서는 안 됩니다.',
    '연장·휴일근로 시간과 수당 지급 내역은 별도로 정확히 기록하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '연장·휴일근로 동의서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '회사 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '회사명', field: 'company' },
        { label: '대표자', field: 'ceo' },
      ],
    },
    { kind: 'section', title: '근로자 정보' },
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
    { kind: 'section', title: '동의 내용' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '적용 시작일', field: 'periodStart' },
        { label: '적용 종료일', field: 'periodEnd' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '주당 연장근로 한도', field: 'weeklyLimit' },
        { label: '연장근로 동의', field: 'agreeOvertime' },
      ],
    },
    {
      kind: 'kv',
      columns: 1,
      rows: [{ label: '휴일근로 동의', field: 'agreeHoliday' }],
    },
    {
      kind: 'paragraph',
      text: '본인은 위 기간과 범위에서 연장·휴일근로를 하는 것에 동의하며, 관련 법령에 따른 가산수당과 근로시간 기록이 적용됨을 확인합니다.',
      before: 1,
      after: 3,
    },
    { kind: 'section', title: '업무 범위·사유' },
    { kind: 'text', field: 'scope', minLines: 3 },
    { kind: 'section', title: '기타 조건' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'notice',
      text: '동의는 자유롭게 결정할 수 있고, 동의하지 않았다는 이유로 불이익을 받지 않습니다.',
    },
    {
      kind: 'signature',
      roles: ['근로자', '사업주'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  validate: (values) => {
    const errors: string[] = [];
    if (values.periodStart && values.periodEnd && values.periodEnd < values.periodStart) {
      errors.push('적용 종료일은 시작일보다 빠를 수 없습니다.');
    }
    if ((values.scope ?? '').trim().length < 10) {
      errors.push('업무 범위·사유를 10자 이상 적어 주세요.');
    }
    return errors;
  },
  warn: (values) => {
    const hours = hoursFrom(values.weeklyLimit);
    if (hours === null || hours <= WEEKLY_OVERTIME_LIMIT) return [];
    return [
      `주당 연장근로 한도 ${hours}시간은 근로기준법 제53조제1항의 1주 ${WEEKLY_OVERTIME_LIMIT}시간을 넘습니다. 특별한 사정에 따른 인가 연장 등 예외가 아니라면 12시간 이하로 정하세요.`,
    ];
  },
  sample: {
    docNo: 'OTA-20261117-001',
    date: '2026-11-17',
    company: '옷깃 주식회사',
    ceo: '박대표',
    name: '김근로',
    employeeNo: '2021003',
    department: '개발팀',
    position: '대리',
    periodStart: '2026-12-01',
    periodEnd: '2027-05-31',
    weeklyLimit: '12시간',
    agreeOvertime: '동의함',
    agreeHoliday: '동의함',
    scope:
      '분기 마감과 시스템 점검 기간에 배포·장애 대응 업무를 수행합니다. 긴급 장애가 발생한 주에 한해 주당 한도 안에서 연장근로를 합니다.',
    note: '근로시간은 사내 출퇴근 기록으로 관리하고, 휴일근로는 대체휴일 또는 가산수당으로 정산합니다.',
  },
  faq: [
    {
      q: '연장근로 동의서는 꼭 필요한가요?',
      a: '근로기준법은 연장근로에 대한 합의와 한도, 가산수당을 정하고 있습니다. 회사 규정과 법령에 따라 서면 동의를 받아 두는 것이 안전합니다.',
    },
    {
      q: '주당 연장근로 한도는 얼마인가요?',
      a: '당사자가 합의해도 1주 12시간을 넘을 수 없습니다(근로기준법 제53조제1항). 자연재해 등 특별한 사정의 인가 연장(제53조제4항)이나 근로시간 특례 업종(제59조) 같은 예외만 따로 있습니다. 12시간을 넘게 적으면 입력란 위에 안내가 나타납니다.',
    },
    {
      q: '동의를 거부할 수 있나요?',
      a: '네. 동의는 자유롭게 결정할 수 있어야 하며, 거부를 이유로 불이익을 주어서는 안 됩니다.',
    },
    {
      q: '휴일근로는 어떻게 보상하나요?',
      a: '근로기준법에 따라 가산수당을 지급하거나, 근로자와 합의해 대체휴일로 보상할 수 있습니다. 회사 규정과 법령을 확인하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 연장·휴일근로 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '국가법령정보센터 — 근로기준법',
      href: 'https://www.law.go.kr/',
    },
  ],
  related: [
    { label: '초과근무 신청서 양식', href: '/forms/overtime-request/' },
    { label: '근태 정정 신청서 양식', href: '/forms/attendance-correction/' },
    { label: '근로계약서 양식', href: '/forms/employment-contract/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
