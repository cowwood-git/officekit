import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '요청 자료',
  help: '필요한 자료와 범위, 파일 형식을 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 2,
  maxRows: 20,
  addLabel: '+ 자료 추가',
  required: true,
  group: '사용 목적',
  columns: [
    {
      id: 'name',
      label: '자료명',
      type: 'text',
      required: true,
      placeholder: '예: 2026년 상반기 매출 내역',
      maxLength: 80,
      width: 2.8,
    },
    {
      id: 'range',
      label: '범위·기간',
      type: 'text',
      placeholder: '예: 2026. 01. ~ 06.',
      maxLength: 60,
      width: 2.2,
    },
    {
      id: 'format',
      label: '형식',
      type: 'select',
      options: ['Excel', 'PDF', '한글', 'CSV', '기타'],
      width: 1.2,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '가공 여부·기준일 등',
      maxLength: 60,
      width: 2,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'DRQ-20261117-001',
    help: '요청일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '요청일',
    type: 'date',
    group: '문서',
    defaultToday: true,
    required: true,
  },
  {
    id: 'title',
    label: '요청 건명',
    type: 'text',
    group: '요청 정보',
    placeholder: '예: 2026년 상반기 매출 자료 요청',
    required: true,
    maxLength: 100,
    span: 2,
  },
  {
    id: 'provider',
    label: '자료 제공자',
    type: 'text',
    group: '요청 정보',
    placeholder: '예: 재무팀 이담당',
    required: true,
    maxLength: 60,
  },
  {
    id: 'dueDate',
    label: '희망 수령일',
    type: 'date',
    group: '요청 정보',
    required: true,
  },
  {
    id: 'deliveryMethod',
    label: '전달 방법',
    type: 'select',
    group: '요청 정보',
    options: ['이메일', '공유 드라이브', '출력물', '기타'],
    defaultValue: '이메일',
    required: true,
  },
  {
    id: 'requester',
    label: '요청자',
    type: 'text',
    group: '요청자',
    placeholder: '김요청',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '요청자',
    placeholder: '경영기획팀',
    maxLength: 40,
  },
  {
    id: 'contact',
    label: '연락처',
    type: 'text',
    group: '요청자',
    placeholder: '02-123-4567',
    maxLength: 40,
  },
  {
    id: 'purpose',
    label: '사용 목적',
    type: 'textarea',
    group: '사용 목적',
    placeholder: '자료를 어떤 목적으로 사용하는지 적습니다.',
    required: true,
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'note',
    label: '유의 사항',
    type: 'textarea',
    group: '유의 사항',
    placeholder: '개인정보 포함 여부, 비밀 유지, 가공 기준 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['요청자', '팀장', '부서장', '본부장', '대표'],
    defaultValue: JSON.stringify([
      { label: '요청자', enabled: true },
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

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.name ?? '').trim());

export const dataRequest: FormTemplate = {
  slug: 'data-request',
  title: '자료 요청서',
  family: 'report',
  category: 'report',
  description:
    '업무에 필요한 자료와 범위, 형식, 사용 목적을 정리해 담당자에게 요청하는 자료 요청서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '자료 요청서',
    '자료 요청서 양식',
    '데이터 요청서',
    '업무 자료 요청',
    '자료 협조 요청',
    '자료 요청서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'DRQ',
  lead: '업무에 필요한 자료를 정확히 요청하기 위한 문서입니다. 자료명·범위·형식과 사용 목적, 희망 수령일을 한 장에 정리합니다.',
  useCases: [
    '다른 부서의 매출·운영·인사 자료가 필요할 때',
    '자료의 범위와 기준일을 명확히 지정할 때',
    '파일 형식과 전달 방법을 미리 정할 때',
    '개인정보·비밀 유지 조건을 함께 안내할 때',
  ],
  howTo: [
    '요청일과 요청 건명, 자료 제공자를 적습니다.',
    '희망 수령일과 전달 방법을 정합니다.',
    '사용 목적과 필요한 자료의 범위·형식을 입력합니다.',
    '유의 사항을 확인하고 PDF로 내려받아 요청합니다.',
  ],
  notes: [
    '자료의 기준일과 범위를 구체적으로 적으면 불필요한 재요청을 줄일 수 있습니다.',
    '개인정보가 포함된 자료는 수집 근거와 사용 목적, 보관·파기 기준을 확인하세요.',
    '받은 자료는 요청 목적에만 사용하고 외부 공유 시 담당자와 먼저 협의하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '자료 요청서',
      docNoField: 'docNo',
      dateField: 'date',
      docNoLabel: '요청번호',
      dateLabel: '요청일',
    },
    { kind: 'section', title: '요청 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '요청 건명', field: 'title' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '자료 제공자', field: 'provider' },
        { label: '희망 수령일', field: 'dueDate' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '전달 방법', field: 'deliveryMethod' }] },
    { kind: 'section', title: '요청자' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '성명', field: 'requester' },
        { label: '부서', field: 'department' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '연락처', field: 'contact' }] },
    { kind: 'section', title: '사용 목적' },
    { kind: 'text', field: 'purpose', minLines: 2 },
    { kind: 'section', title: '요청 자료' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '자료명', width: 62 },
        { label: '범위·기간', width: 44 },
        { label: '형식', width: 22, align: 'center' },
        { label: '비고', width: 36 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row, index) => [
          String(index + 1),
          (row.name ?? '').trim(),
          (row.range ?? '').trim(),
          (row.format ?? '').trim(),
          (row.note ?? '').trim(),
        ]),
      minRows: 2,
    },
    { kind: 'section', title: '유의 사항' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'notice',
      text: '개인정보가 포함된 자료는 관련 법령과 회사 개인정보 처리 기준을 따라 주세요.',
    },
    {
      kind: 'signature',
      roles: ['요청자', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  validate: (values, rows) => {
    const errors: string[] = [];
    if (values.date && values.dueDate && values.dueDate < values.date) {
      errors.push('희망 수령일은 요청일보다 빠를 수 없습니다.');
    }
    if ((values.purpose ?? '').trim().length < 10) {
      errors.push('사용 목적을 10자 이상 적어 주세요.');
    }
    if (itemsOf(rows).length === 0) {
      errors.push('요청할 자료를 한 줄 이상 입력하세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'DRQ-20261117-001',
    date: '2026-11-17',
    title: '2026년 상반기 매출·비용 자료 요청',
    provider: '재무팀 이담당',
    dueDate: '2026-11-21',
    deliveryMethod: '이메일',
    requester: '김요청',
    department: '경영기획팀',
    contact: '02-123-4567',
    purpose:
      '2027년 예산 편성과 상반기 실적 분석을 위해 매출·비용 자료가 필요합니다. 부서별·월별 합계와 주요 비용 항목을 확인할 예정입니다.',
    note: '개인 급여 정보는 제외하고 부서 단위 합계로 요청드립니다. 받은 자료는 예산 검토 목적으로만 사용합니다.',
  },
  sampleRows: {
    items: [
      {
        name: '2026년 상반기 매출 내역',
        range: '2026. 01. ~ 06.',
        format: 'Excel',
        note: '월별·부서별 합계',
      },
      {
        name: '2026년 상반기 비용 내역',
        range: '2026. 01. ~ 06.',
        format: 'Excel',
        note: '계정과목별',
      },
      {
        name: '예산 집행 현황',
        range: '2026. 06. 30. 기준',
        format: 'PDF',
        note: '부서별 요약',
      },
    ],
  },
  faq: [
    {
      q: '자료 요청서에 꼭 들어가야 할 내용은?',
      a: '자료명, 기준일과 범위, 원하는 파일 형식, 사용 목적, 희망 수령일, 담당자 연락처를 넣으면 정확하게 전달됩니다.',
    },
    {
      q: '개인정보가 포함된 자료도 요청할 수 있나요?',
      a: '업무상 필요한 범위에서만 요청하고, 수집 근거와 사용 목적, 보관·파기 기준을 확인해야 합니다. 가능하면 개인을 식별할 수 없는 형태로 요청하세요.',
    },
    {
      q: '자료 범위는 어떻게 정하나요?',
      a: '기준일과 기간, 포함할 항목과 제외할 항목을 구체적으로 적으세요. 예: “2026년 1~6월, 부서별 합계, 개인 급여 제외”.',
    },
    {
      q: '받은 자료를 외부에 공유해도 되나요?',
      a: '자료 제공자와 회사 규정에 따라 다릅니다. 외부 공유 전에 반드시 담당자와 협의하고, 개인정보·영업비밀이 포함되지 않도록 확인하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '개인정보보호위원회 — 개인정보 처리 안내',
      href: 'https://www.pipc.go.kr/',
    },
  ],
  related: [
    { label: '업무 협조 요청서 양식', href: '/forms/collaboration-request/' },
    { label: '검토 요청서 양식', href: '/forms/review-request/' },
    { label: '개인정보 동의서 양식', href: '/forms/privacy-consent/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
