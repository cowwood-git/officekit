import type { FormField, FormTemplate } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'AC-20261117-001',
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
    placeholder: '김근태',
    required: true,
    maxLength: 30,
  },
  {
    id: 'employeeNo',
    label: '사번',
    type: 'text',
    group: '신청자',
    placeholder: '2021004',
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
    placeholder: '사원',
    maxLength: 30,
  },
  {
    id: 'workDate',
    label: '대상 일자',
    type: 'date',
    group: '정정 정보',
    required: true,
  },
  {
    id: 'reasonType',
    label: '정정 사유',
    type: 'select',
    group: '정정 정보',
    options: ['출퇴근 기록 누락', '기기 오류', '업무상 외출·출장', '기타'],
    defaultValue: '출퇴근 기록 누락',
    required: true,
  },
  {
    id: 'originalIn',
    label: '원래 출근',
    type: 'text',
    group: '정정 정보',
    placeholder: '09:02',
    maxLength: 5,
  },
  {
    id: 'originalOut',
    label: '원래 퇴근',
    type: 'text',
    group: '정정 정보',
    placeholder: '18:05',
    maxLength: 5,
  },
  {
    id: 'correctedIn',
    label: '정정 출근',
    type: 'text',
    group: '정정 정보',
    placeholder: '09:00',
    required: true,
    maxLength: 5,
  },
  {
    id: 'correctedOut',
    label: '정정 퇴근',
    type: 'text',
    group: '정정 정보',
    placeholder: '18:30',
    required: true,
    maxLength: 5,
  },
  {
    id: 'evidence',
    label: '증빙',
    type: 'select',
    group: '정정 정보',
    options: ['없음', '출입 기록', '업무 메신저', '출장 승인', '기타'],
    defaultValue: '출입 기록',
  },
  {
    id: 'reasonDetail',
    label: '정정 사유 상세',
    type: 'textarea',
    group: '정정 사유',
    placeholder: '기록이 잘못된 이유와 실제 근무 상황을 적습니다.',
    required: true,
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '추가로 확인할 내용이나 담당자 메모',
    maxLength: 300,
    rows: 2,
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

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const attendanceCorrection: FormTemplate = {
  slug: 'attendance-correction',
  title: '근태 정정 신청서',
  family: 'hr',
  category: 'people',
  description:
    '출퇴근 기록이 누락되거나 잘못 입력됐을 때 원래 기록과 정정할 시간, 사유를 정리하는 근태 정정 신청서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '근태 정정 신청서',
    '근태 정정 신청서 양식',
    '출퇴근 정정',
    '근태 기록 정정',
    '출퇴근 기록 오류',
    '근태 정정 신청서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'AC',
  lead: '출퇴근 기록이 누락되거나 잘못 남았을 때 실제 근무 시간으로 정정을 요청하는 신청서입니다. 원래 기록과 정정 기록, 사유와 증빙을 한 장에 남깁니다.',
  useCases: [
    '출퇴근 기록이 누락됐을 때',
    '출퇴근 기기 오류로 시간이 잘못 찍혔을 때',
    '업무상 외출·출장으로 기록이 실제와 다를 때',
    '급여·연차 계산 전에 근태를 바로잡을 때',
  ],
  howTo: [
    '신청일과 신청자 정보를 확인합니다.',
    '정정할 일자와 사유를 고릅니다.',
    '원래 출퇴근과 정정할 출퇴근 시간을 적습니다.',
    '사유와 증빙을 정리하고 PDF로 내려받아 결재를 받습니다.',
  ],
  notes: [
    '정정은 실제 근무한 시간을 기준으로 하고, 가능하면 출입 기록·메신저·출장 승인 등 증빙을 함께 제출하세요.',
    '급여·연차 계산이 끝난 뒤에는 정정이 어려울 수 있으니 마감 전에 신청하세요.',
    '시간은 24시간제 HH:MM 형식(예: 09:00)으로 적습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '근태 정정 신청서',
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
    { kind: 'section', title: '정정 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '대상 일자', field: 'workDate' },
        { label: '정정 사유', field: 'reasonType' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '원래 출근', field: 'originalIn' },
        { label: '원래 퇴근', field: 'originalOut' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '정정 출근', field: 'correctedIn' },
        { label: '정정 퇴근', field: 'correctedOut' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '증빙', field: 'evidence' }] },
    { kind: 'section', title: '정정 사유' },
    { kind: 'text', field: 'reasonDetail', minLines: 3 },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'notice',
      text: '정정 내용은 실제 근무 기록과 증빙을 기준으로 확인합니다.',
    },
    {
      kind: 'signature',
      roles: ['신청자', '팀장', '인사 담당'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  validate: (values) => {
    const errors: string[] = [];
    const originalIn = (values.originalIn ?? '').trim();
    const originalOut = (values.originalOut ?? '').trim();
    const correctedIn = (values.correctedIn ?? '').trim();
    const correctedOut = (values.correctedOut ?? '').trim();

    for (const [label, time] of [
      ['원래 출근', originalIn],
      ['원래 퇴근', originalOut],
      ['정정 출근', correctedIn],
      ['정정 퇴근', correctedOut],
    ] as const) {
      if (time && !TIME.test(time)) {
        errors.push(`${label} 시간은 HH:MM 형식으로 입력하세요.`);
      }
    }
    if (correctedIn && correctedOut && correctedOut < correctedIn) {
      errors.push('정정 퇴근 시간은 출근 시간보다 빠를 수 없습니다.');
    }
    if (correctedIn === originalIn && correctedOut === originalOut && (originalIn || originalOut)) {
      errors.push('정정 내용이 원래 기록과 같습니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'AC-20261117-001',
    date: '2026-11-17',
    name: '김근태',
    employeeNo: '2021004',
    department: '경영지원팀',
    position: '사원',
    workDate: '2026-11-14',
    reasonType: '기기 오류',
    originalIn: '09:02',
    originalOut: '18:05',
    correctedIn: '09:00',
    correctedOut: '18:30',
    evidence: '출입 기록',
    reasonDetail:
      '11월 14일 출퇴근 기기 오류로 퇴근 기록이 실제보다 일찍 찍혔습니다. 사무실 출입 기록과 업무 메신저 종료 시각을 확인해 18:30으로 정정을 요청합니다.',
    note: '출입 기록 캡처를 첨부했습니다.',
  },
  faq: [
    {
      q: '근태 정정은 언제까지 신청해야 하나요?',
      a: '회사마다 급여·근태 마감일이 다릅니다. 급여 계산 전에 신청해야 반영되므로 인사 담당자에게 마감일을 확인하세요.',
    },
    {
      q: '어떤 증빙을 준비하면 좋나요?',
      a: '출입 기록, 업무 메신저, 출장 승인, 업무 일지 등 실제 근무 시간을 확인할 수 있는 자료를 준비하세요.',
    },
    {
      q: '원래 기록이 없어도 정정할 수 있나요?',
      a: '네. 기록이 누락된 경우 원래 기록을 비워 두고 정정할 출근·퇴근 시간과 사유를 적습니다.',
    },
    {
      q: '정정이 거절될 수도 있나요?',
      a: '실제 근무 사실과 증빙이 확인되지 않으면 승인이 어려울 수 있습니다. 사유와 자료를 구체적으로 준비하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 근로시간 기록·관리 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '국가법령정보센터 — 근로기준법',
      href: 'https://www.law.go.kr/',
    },
  ],
  related: [
    { label: '초과근무 신청서 양식', href: '/forms/overtime-request/' },
    { label: '연장·휴일근로 동의서 양식', href: '/forms/overtime-agreement/' },
    { label: '휴가신청서 양식', href: '/forms/leave-request/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
