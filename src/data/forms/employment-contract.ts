import type { FormField, FormTemplate } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'EC-20261117-001',
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
    label: '사업주 상호',
    type: 'text',
    group: '당사자',
    required: true,
    placeholder: '예: 옷깃',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'ceo',
    label: '사업주 대표자',
    type: 'text',
    group: '당사자',
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: 'companyAddress',
    label: '사업장 주소',
    type: 'text',
    group: '당사자',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'employee',
    label: '근로자 성명',
    type: 'text',
    group: '당사자',
    required: true,
    placeholder: '김근로',
    maxLength: 30,
  },
  {
    id: 'employeeBirth',
    label: '근로자 생년월일',
    type: 'text',
    group: '당사자',
    placeholder: '1995-01-01',
    maxLength: 20,
  },
  {
    id: 'employeeAddress',
    label: '근로자 주소',
    type: 'text',
    group: '당사자',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'employeeContact',
    label: '근로자 연락처',
    type: 'text',
    group: '당사자',
    placeholder: '010-1234-5678',
    maxLength: 40,
  },
  {
    id: 'startDate',
    label: '근로 시작일',
    type: 'date',
    group: '근로 조건',
    required: true,
  },
  {
    id: 'endDate',
    label: '근로 종료일',
    type: 'date',
    group: '근로 조건',
    help: '기간의 정함이 없는 계약이면 비워 둡니다.',
  },
  {
    id: 'workplace',
    label: '근무 장소',
    type: 'text',
    group: '근로 조건',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'job',
    label: '업무 내용',
    type: 'text',
    group: '근로 조건',
    required: true,
    placeholder: '예: 고객 상담·문서 관리',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'wage',
    label: '임금',
    type: 'text',
    group: '근로 조건',
    required: true,
    placeholder: '2,500,000',
    maxLength: 20,
  },
  {
    id: 'wageLabel',
    label: '임금 표시',
    type: 'computed',
    group: '근로 조건',
    help: '입력한 임금을 원 단위로 표시합니다.',
  },
  {
    id: 'wageCycle',
    label: '지급 주기',
    type: 'select',
    group: '근로 조건',
    options: ['월급', '시급', '일급'],
    defaultValue: '월급',
    required: true,
  },
  {
    id: 'workHours',
    label: '소정 근로시간',
    type: 'text',
    group: '근로 조건',
    placeholder: '예: 주 40시간, 09:00~18:00',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'holidays',
    label: '휴일·휴가',
    type: 'text',
    group: '근로 조건',
    placeholder: '예: 주휴일 일요일, 연차 별도',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'terms',
    label: '기타 조건',
    type: 'textarea',
    group: '기타 조건',
    placeholder: '수습 기간, 4대보험, 비밀유지, 근무 규칙 등',
    maxLength: 800,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명 당사자',
    type: 'roles',
    group: '서명',
    options: ['사업주', '근로자'],
    defaultValue: JSON.stringify([
      { label: '사업주', enabled: true },
      { label: '근로자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '서명란에 표시할 당사자 이름입니다.',
    span: 3,
  },
];

export const employmentContract: FormTemplate = {
  slug: 'employment-contract',
  title: '근로계약서',
  family: 'hr',
  category: 'people',
  description:
    '근로자와 근무 조건·임금·근로시간을 정하는 근로계약서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 법정 필수 사항을 확인할 수 있습니다.',
  keywords: [
    '근로계약서',
    '근로계약서 양식',
    '표준 근로계약서',
    '근로 조건',
    '임금 근로시간',
    '근로계약서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'EC',
  lead: '근로 조건과 임금, 근로시간을 정하는 기본 근로계약서입니다. 사업주와 근로자가 서명하기 전에 법정 필수 사항을 확인하세요.',
  useCases: [
    '신규 입사자의 근로계약을 작성할 때',
    '기간제·단시간 근로 조건을 정할 때',
    '임금·근무 시간 변경을 문서로 남길 때',
    '근로 조건의 서면 명시를 확인할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 사업주·근로자 정보를 확인합니다.',
    '근로 시작일·종료일, 근무 장소, 업무 내용을 적습니다.',
    '임금과 지급 주기, 소정 근로시간, 휴일을 입력합니다.',
    '기타 조건을 확인하고 PDF로 내려받아 양쪽이 서명합니다.',
  ],
  notes: [
    '이 양식은 참고용입니다. 근로기준법 제17조에 따라 임금·소정근로시간·휴일·연차 등 주요 조건을 서면으로 명시해야 하며, 구체적인 내용은 법률 검토를 권장합니다.',
    '최저임금·주휴수당·4대보험·연차휴가 등 법정 기준을 확인하세요.',
    '수습 기간·해고·손해배상 조항은 법적 제한이 있으므로 함부로 정하지 마세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '근로계약서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    {
      kind: 'paragraph',
      text: '사업주와 근로자는 아래와 같이 근로계약을 체결한다.',
      align: 'center',
      before: 2,
      after: 2,
    },
    {
      kind: 'parties',
      left: {
        label: '사업주',
        lines: (values) =>
          [
            values.company ?? '',
            values.ceo ? `대표 ${values.ceo}` : '',
            values.companyAddress ?? '',
          ].filter(Boolean),
      },
      right: {
        label: '근로자',
        lines: (values) =>
          [
            values.employee ?? '',
            values.employeeBirth ?? '',
            values.employeeAddress ?? '',
            values.employeeContact ?? '',
          ].filter(Boolean),
      },
    },
    { kind: 'section', title: '근로 조건' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '근로 시작일', field: 'startDate' },
        { label: '근로 종료일', field: 'endDate' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '근무 장소', field: 'workplace' },
        { label: '업무 내용', field: 'job' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '임금', field: 'wageLabel' },
        { label: '지급 주기', field: 'wageCycle' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '소정 근로시간', field: 'workHours' },
        { label: '휴일·휴가', field: 'holidays' },
      ],
    },
    { kind: 'section', title: '기타 조건' },
    { kind: 'text', field: 'terms', minLines: 3 },
    {
      kind: 'notice',
      text: '본 양식은 참고용입니다. 근로기준법 등 관련 법령과 법률 검토를 확인하세요.',
    },
    {
      kind: 'signature',
      roles: ['사업주', '근로자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values) => {
    const wage = parseAmount(values.wage ?? '');
    return { wageLabel: wage > 0 ? formatWon(wage) : '' };
  },
  validate: (values) => {
    const errors: string[] = [];
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      errors.push('근로 종료일은 시작일보다 빠를 수 없습니다.');
    }
    if (values.wage?.trim() && parseAmount(values.wage) <= 0) {
      errors.push('임금은 1원 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'EC-20261117-001',
    date: '2026-11-17',
    company: '옷깃',
    ceo: '홍길동',
    companyAddress: '서울시 강남구 테헤란로 1',
    employee: '김근로',
    employeeBirth: '1995-01-01',
    employeeAddress: '서울시 강남구 테헤란로 2',
    employeeContact: '010-1234-5678',
    startDate: '2026-12-01',
    endDate: '',
    workplace: '서울시 강남구 테헤란로 1',
    job: '고객 상담·문서 관리',
    wage: '2500000',
    wageCycle: '월급',
    workHours: '주 40시간, 09:00~18:00',
    holidays: '주휴일 일요일, 연차 별도',
    terms:
      '수습 기간 3개월, 4대보험 가입, 근무 규칙은 취업규칙을 따릅니다. 비밀유지 의무는 퇴사 후에도 적용됩니다.',
  },
  faq: [
    {
      q: '근로계약서에 꼭 들어가야 하는 항목은?',
      a: '임금, 소정근로시간, 휴일, 연차휴가, 근무 장소, 업무 내용 등을 서면으로 명시해야 합니다. 근로기준법 제17조를 확인하세요.',
    },
    {
      q: '기간제 근로자도 쓸 수 있나요?',
      a: '네. 근로 종료일을 적고 계약 기간을 명확히 합니다. 기간제·단시간 근로는 관련 법령의 제한을 확인하세요.',
    },
    {
      q: '수습 기간을 정해도 되나요?',
      a: '수습 기간을 둘 수 있지만 임금·해고 등에 법적 제한이 있습니다. 기간과 조건을 구체적으로 적고 법률 검토를 권장합니다.',
    },
    {
      q: '최저임금은 어떻게 확인하나요?',
      a: '매년 고시되는 최저임금과 주휴수당을 포함한 임금을 확인하세요. 시급·월급 환산 기준은 고용노동부 안내를 참고합니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 근로계약 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '국가법령정보센터 — 근로기준법',
      href: 'https://www.law.go.kr/',
    },
  ],
  related: [
    { label: '연차 사용계획서 양식', href: '/forms/leave-plan/' },
    { label: '급여명세서 양식', href: '/forms/payslip/' },
    { label: '퇴직증명서 양식', href: '/forms/resignation-certificate/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
