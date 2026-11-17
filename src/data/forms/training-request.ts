import type { FormField, FormTemplate } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'TR-20261117-001',
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
    id: 'course',
    label: '과정명',
    type: 'text',
    group: '교육 정보',
    required: true,
    placeholder: '예: 데이터 분석 실무',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'institution',
    label: '교육 기관',
    type: 'text',
    group: '교육 정보',
    placeholder: '예: 옷깃교육원',
    maxLength: 60,
  },
  {
    id: 'method',
    label: '교육 방법',
    type: 'select',
    group: '교육 정보',
    options: ['집합교육', '온라인', '해외연수', '기타'],
    defaultValue: '집합교육',
    required: true,
  },
  {
    id: 'periodFrom',
    label: '시작일',
    type: 'date',
    group: '교육 정보',
    required: true,
  },
  {
    id: 'periodTo',
    label: '종료일',
    type: 'date',
    group: '교육 정보',
    required: true,
  },
  {
    id: 'hours',
    label: '교육 시간(시간)',
    type: 'number',
    group: '교육 정보',
    placeholder: '21',
    help: '총 교육 시간(시간 단위)입니다.',
  },
  {
    id: 'cost',
    label: '교육비',
    type: 'text',
    group: '교육 비용',
    placeholder: '450,000',
    maxLength: 20,
    help: '교재비·숙박비를 포함한 총비용을 적습니다.',
  },
  {
    id: 'costLabel',
    label: '교육비 표시',
    type: 'computed',
    group: '교육 비용',
    help: '입력한 교육비를 원 단위로 표시합니다.',
  },
  {
    id: 'purpose',
    label: '교육 목적',
    type: 'textarea',
    group: '내용',
    placeholder: '무엇을 배우고 어떤 문제를 해결하려는지 적습니다.',
    required: true,
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'relevance',
    label: '업무 연관성',
    type: 'textarea',
    group: '내용',
    placeholder: '현재 업무에 어떻게 적용할지 적습니다.',
    maxLength: 500,
    rows: 3,
    span: 3,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '대체 근무, 교육 후 보고 일정 등',
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['신청인', '팀장', '부서장'],
    defaultValue: JSON.stringify([
      { label: '신청인', enabled: true },
      { label: '팀장', enabled: true },
      { label: '부서장', enabled: false },
    ]),
    required: true,
    maxSelected: 3,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

export const trainingRequest: FormTemplate = {
  slug: 'training-request',
  title: '교육 신청서',
  family: 'hr',
  category: 'people',
  description:
    '직무 교육을 신청할 때 과정·기간·비용·목적을 정리하는 교육 신청서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 교육비가 자동으로 표시됩니다.',
  keywords: [
    '교육 신청서',
    '교육신청서 양식',
    '직무교육 신청',
    '교육비 지원 신청',
    '사내교육 신청서',
    '교육 신청서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'TR',
  lead: '직무 교육을 신청하며 과정과 기간, 비용, 교육 목적을 정리하는 문서입니다. 업무 연관성과 교육비를 함께 적어 결재를 받을 수 있습니다.',
  useCases: [
    '직무 교육·세미나 참가를 신청할 때',
    '교육비 지원을 승인받을 때',
    '장기 교육 전에 업무 대체 계획을 세울 때',
    '교육 후 성과 보고의 기준을 남길 때',
  ],
  howTo: [
    '문서 번호와 작성일, 신청자 정보를 확인합니다.',
    '과정명과 기관, 교육 기간·시간·방법을 적습니다.',
    '교육비를 입력하면 원 단위 금액이 자동으로 표시됩니다.',
    '교육 목적과 업무 연관성을 적고 PDF로 내려받아 결재를 받습니다.',
  ],
  notes: [
    '교육비 지원 범위와 의무 근속 기간은 회사의 교육 규정을 따르세요.',
    '교육 후 보고서·수료증 제출이 필요한 경우 비고에 일정을 적어 두세요.',
    '업무 연관성을 구체적으로 적으면 결재와 예산 심의에 도움이 됩니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '교육 신청서',
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
    { kind: 'section', title: '교육 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '과정명', field: 'course' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '교육 기관', field: 'institution' },
        { label: '교육 방법', field: 'method' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '시작일', field: 'periodFrom' },
        { label: '종료일', field: 'periodTo' },
      ],
    },
    { kind: 'kv', columns: 2, rows: [{ label: '교육 시간(시간)', field: 'hours' }] },
    { kind: 'section', title: '교육 비용' },
    {
      kind: 'totals',
      rows: [{ label: '교육비', field: 'costLabel', strong: true }],
      width: 70,
    },
    { kind: 'section', title: '교육 목적' },
    { kind: 'text', field: 'purpose', minLines: 3 },
    { kind: 'section', title: '업무 연관성' },
    { kind: 'text', field: 'relevance', minLines: 3 },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['신청인', '팀장', '부서장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values) => {
    const cost = parseAmount(values.cost ?? '');
    return { costLabel: cost > 0 ? formatWon(cost) : '' };
  },
  validate: (values) => {
    const errors: string[] = [];
    if (values.periodFrom && values.periodTo && values.periodTo < values.periodFrom) {
      errors.push('종료일은 시작일보다 빠를 수 없습니다.');
    }
    const cost = parseAmount(values.cost ?? '');
    if (values.cost?.trim() && cost <= 0) {
      errors.push('교육비는 1원 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'TR-20261117-001',
    date: '2026-11-17',
    name: '김옷깃',
    department: '경영지원팀',
    position: '대리',
    course: '데이터 분석 실무',
    institution: '옷깃교육원',
    method: '집합교육',
    periodFrom: '2026-12-01',
    periodTo: '2026-12-03',
    hours: '21',
    cost: '450000',
    purpose:
      '업무 보고에 쓰는 표 데이터를 직접 분석하고, 반복 보고서 작성을 줄이기 위해 교육을 신청합니다.',
    relevance:
      '매월 작성하는 운영 보고서의 데이터 정리·시각화에 바로 적용할 수 있습니다. 교육 후 팀 내 공유 세션을 진행할 예정입니다.',
    note: '교육 기간 동안 팀장이 결재 업무를 대행합니다.',
  },
  faq: [
    {
      q: '교육 신청서에는 무엇을 적어야 하나요?',
      a: '과정명과 기관, 기간·시간, 교육비, 교육 목적, 업무 연관성을 적습니다. 결재자가 판단할 수 있도록 교육 후 적용 계획을 함께 적으면 좋습니다.',
    },
    {
      q: '교육비는 자동으로 계산되나요?',
      a: '입력한 교육비를 원 단위로 표시합니다. 교재비·숙박비를 포함할지 여부는 회사 규정에 맞춰 총비용으로 적으세요.',
    },
    {
      q: '온라인 교육도 신청할 수 있나요?',
      a: '네. 교육 방법에서 온라인을 고르고 기간과 시간을 적으면 됩니다. 수료증 제출 여부는 비고에 남겨 두세요.',
    },
    {
      q: '교육 후 보고서도 필요한가요?',
      a: '회사 규정에 따라 다릅니다. 필요한 경우 비고에 보고 일정을 적고, 교육 후 결과보고서나 수료증을 함께 보관하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 직업능력개발 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '고용24 — 직업훈련 정보',
      href: 'https://www.work24.go.kr/',
    },
  ],
  related: [
    { label: '주간업무보고 양식', href: '/forms/weekly-report/' },
    { label: '연차 사용계획서 양식', href: '/forms/leave-plan/' },
    { label: '회의록 양식', href: '/forms/meeting-minutes/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
