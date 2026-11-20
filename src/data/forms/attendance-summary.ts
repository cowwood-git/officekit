import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const employees: RepeatGroup = {
  id: 'employees',
  label: '직원별 집계',
  help: '직원별 근무일수와 소정·연장·휴일·결근 시간을 적습니다.',
  minRows: 2,
  maxRows: 30,
  addLabel: '+ 직원 추가',
  required: true,
  group: '집계 정보',
  summaryField: 'totalWorkDaysLabel',
  summaryLabel: '근무일수 합계',
  columns: [
    {
      id: 'name',
      label: '성명',
      type: 'text',
      required: true,
      placeholder: '김근로',
      maxLength: 30,
      width: 1.7,
    },
    {
      id: 'department',
      label: '부서',
      type: 'text',
      placeholder: '개발팀',
      maxLength: 40,
      width: 1.8,
    },
    {
      id: 'workDays',
      label: '근무일수',
      type: 'number',
      placeholder: '20',
      width: 1,
    },
    {
      id: 'regularHours',
      label: '소정시간',
      type: 'number',
      placeholder: '160',
      width: 1,
    },
    {
      id: 'overtimeHours',
      label: '연장',
      type: 'number',
      placeholder: '0',
      width: 0.9,
    },
    {
      id: 'holidayHours',
      label: '휴일',
      type: 'number',
      placeholder: '0',
      width: 0.9,
    },
    {
      id: 'absenceDays',
      label: '결근',
      type: 'number',
      placeholder: '0',
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
    placeholder: 'ASU-20261118-001',
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
    label: '사업장명',
    type: 'text',
    group: '집계 정보',
    placeholder: '옷깃 주식회사',
    required: true,
    maxLength: 60,
    span: 2,
  },
  {
    id: 'period',
    label: '집계 기간',
    type: 'text',
    group: '집계 정보',
    placeholder: '예: 2026-11',
    required: true,
    maxLength: 30,
  },
  {
    id: 'totalWorkDaysLabel',
    label: '근무일수 합계',
    type: 'computed',
    group: '집계 정보',
    help: '직원별 근무일수의 합계입니다.',
  },
  {
    id: 'totalOvertimeLabel',
    label: '연장시간 합계',
    type: 'computed',
    group: '집계 정보',
    help: '직원별 연장근로 시간의 합계입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '집계 기준, 휴일·결근 처리, 확인 사항 등',
    maxLength: 400,
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

const employeesOf = (rows: FormRows): FormRows['employees'] =>
  (rows.employees ?? []).filter((row) => (row.name ?? '').trim());

const numberValue = (value: string | undefined): number => {
  const number = Number((value ?? '').replace(/,/g, ''));
  return Number.isFinite(number) ? number : 0;
};

export const attendanceSummary: FormTemplate = {
  slug: 'attendance-summary',
  title: '월별 출퇴근 집계표',
  family: 'hr',
  category: 'people',
  description:
    '직원별 월 근무일수와 소정·연장·휴일근로·결근 시간을 정리하는 월별 출퇴근 집계표를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '월별 출퇴근 집계표',
    '출퇴근 집계표 양식',
    '근태 집계표',
    '월 근무시간',
    '출퇴근 기록 집계',
    '출퇴근 집계표 PDF',
  ],
  updated: '2026-11-18',
  docPrefix: 'ASU',
  lead: '직원별 월 근무일수와 소정·연장·휴일근로, 결근 내역을 한 표에 정리하는 집계표입니다. 합계를 자동으로 계산합니다.',
  useCases: [
    '월별 근태를 급여 계산 전에 정리할 때',
    '부서별 근무시간과 연장근로를 확인할 때',
    '휴일·결근 내역을 한눈에 볼 때',
    '노무·급여 자료로 월 근태를 남길 때',
  ],
  howTo: [
    '집계 기간과 사업장을 적습니다.',
    '직원별 근무일수와 소정시간을 입력합니다.',
    '연장·휴일근로와 결근 일수를 적습니다.',
    '합계를 확인하고 PDF로 내려받아 보관합니다.',
  ],
  notes: [
    '출퇴근 기록과 급여 계산의 기준이 일치하는지 확인하세요.',
    '연장·휴일근로는 가산수당과 근로시간 기록 기준을 함께 확인하세요.',
    '직원별 근태 정보는 개인정보이므로 접근 권한을 제한하세요.',
  ],
  fields,
  groups: [employees],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '월별 출퇴근 집계표',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '집계 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '사업장명', field: 'company' },
        { label: '집계 기간', field: 'period' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '근무일수 합계', field: 'totalWorkDaysLabel' },
        { label: '연장시간 합계', field: 'totalOvertimeLabel' },
      ],
    },
    { kind: 'section', title: '직원별 집계' },
    {
      kind: 'table',
      columns: [
        { label: '성명', width: 32 },
        { label: '부서', width: 36 },
        { label: '근무일수', width: 24, align: 'right' },
        { label: '소정시간', width: 26, align: 'right' },
        { label: '연장', width: 22, align: 'right' },
        { label: '휴일', width: 22, align: 'right' },
        { label: '결근', width: 22, align: 'right' },
      ],
      rows: (_values, rows) =>
        employeesOf(rows).map((row) => [
          (row.name ?? '').trim(),
          (row.department ?? '').trim(),
          row.workDays ? String(numberValue(row.workDays)) : '',
          row.regularHours ? String(numberValue(row.regularHours)) : '',
          row.overtimeHours ? String(numberValue(row.overtimeHours)) : '',
          row.holidayHours ? String(numberValue(row.holidayHours)) : '',
          row.absenceDays ? String(numberValue(row.absenceDays)) : '',
        ]),
      minRows: 2,
    },
    {
      kind: 'totals',
      rows: [
        { label: '근무일수 합계', field: 'totalWorkDaysLabel' },
        { label: '연장시간 합계', field: 'totalOvertimeLabel', strong: true },
      ],
      width: 70,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장', '부서장', '본부장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = employeesOf(rows);
    const workDays = list.reduce((sum, row) => sum + numberValue(row.workDays), 0);
    const overtime = list.reduce((sum, row) => sum + numberValue(row.overtimeHours), 0);
    return {
      totalWorkDaysLabel: workDays > 0 ? `${workDays.toLocaleString('ko-KR')}일` : '',
      totalOvertimeLabel: overtime > 0 ? `${overtime.toLocaleString('ko-KR')}시간` : '',
    };
  },
  validate: (_values, rows) =>
    employeesOf(rows).length === 0 ? ['직원별 집계를 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'ASU-20261118-001',
    date: '2026-11-18',
    company: '옷깃 주식회사',
    period: '2026-11',
    note: '11월 근태 마감은 12월 2일이며, 연장·휴일근로는 사내 출퇴근 기록과 대조해 확인합니다.',
  },
  sampleRows: {
    employees: [
      {
        name: '김옷깃',
        department: '경영지원팀',
        workDays: '20',
        regularHours: '160',
        overtimeHours: '8',
        holidayHours: '0',
        absenceDays: '0',
      },
      {
        name: '이개발',
        department: '개발팀',
        workDays: '20',
        regularHours: '160',
        overtimeHours: '12',
        holidayHours: '4',
        absenceDays: '0',
      },
      {
        name: '박계약',
        department: '서비스기획팀',
        workDays: '19',
        regularHours: '152',
        overtimeHours: '4',
        holidayHours: '0',
        absenceDays: '1',
      },
      {
        name: '최인턴',
        department: '개발팀',
        workDays: '20',
        regularHours: '160',
        overtimeHours: '0',
        holidayHours: '0',
        absenceDays: '0',
      },
    ],
  },
  faq: [
    {
      q: '월별 출퇴근 집계표는 어디에 쓰나요?',
      a: '급여 계산 전 근무일수와 연장·휴일근로를 확인하고, 부서별 근태 현황을 공유할 때 사용합니다.',
    },
    {
      q: '근무일수는 어떻게 세나요?',
      a: '실제 근무한 날짜 수를 적습니다. 휴일·연차·결근은 구분해 기록하고, 회사 규정에 따라 처리하세요.',
    },
    {
      q: '연장·휴일근로는 어떻게 적나요?',
      a: '출퇴근 기록과 승인 내역을 기준으로 시간을 적습니다. 가산수당과 근로시간 한도는 근로기준법을 확인하세요.',
    },
    {
      q: '결근과 휴가를 구분해야 하나요?',
      a: '네. 결근, 연차, 병가, 공가 등은 사유가 다르므로 구분해 기록해야 급여·인사 처리에 혼동이 없습니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 근로시간·근태 관리 안내',
      href: 'https://www.moel.go.kr/',
    },
  ],
  related: [
    { label: '근태 정정 신청서 양식', href: '/forms/attendance-correction/' },
    { label: '임금대장 양식', href: '/forms/wage-ledger/' },
    { label: '근로자 명부 양식', href: '/forms/employee-register/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
