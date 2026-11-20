import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const people: RepeatGroup = {
  id: 'people',
  label: '명함 신청 명단',
  group: '명함 정보',
  help: '명함에 들어갈 이름·직위·영문명·연락처와 수량을 적습니다. 총 수량이 자동으로 계산됩니다.',
  minRows: 1,
  maxRows: 30,
  addLabel: '+ 명함 추가',
  required: true,
  summaryField: 'totalQuantityLabel',
  summaryLabel: '총 수량',
  columns: [
    {
      id: 'name',
      label: '이름',
      type: 'text',
      required: true,
      placeholder: '홍길동',
      maxLength: 30,
      width: 1.6,
    },
    {
      id: 'position',
      label: '직위',
      type: 'text',
      placeholder: '대리',
      maxLength: 30,
      width: 1.2,
    },
    {
      id: 'englishName',
      label: '영문명',
      type: 'text',
      placeholder: 'Gildong Hong',
      maxLength: 40,
      width: 2,
    },
    {
      id: 'phone',
      label: '연락처',
      type: 'text',
      placeholder: '010-1234-5678',
      maxLength: 30,
      width: 1.8,
    },
    {
      id: 'email',
      label: '이메일',
      type: 'text',
      placeholder: 'name@example.com',
      maxLength: 60,
      width: 2.2,
    },
    {
      id: 'quantity',
      label: '수량',
      type: 'number',
      required: true,
      placeholder: '1',
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
    placeholder: 'BC-20261117-001',
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
    id: 'department',
    label: '신청 부서',
    type: 'text',
    group: '신청 정보',
    required: true,
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'requester',
    label: '신청자',
    type: 'text',
    group: '신청 정보',
    required: true,
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'contact',
    label: '신청자 연락처',
    type: 'text',
    group: '신청 정보',
    placeholder: '010-1234-5678',
    maxLength: 40,
  },
  {
    id: 'cardType',
    label: '인쇄 형태',
    type: 'select',
    group: '신청 정보',
    options: ['일반 명함', '영문 병기', '양면 인쇄'],
    defaultValue: '일반 명함',
    required: true,
  },
  {
    id: 'company',
    label: '회사명',
    type: 'text',
    group: '명함 정보',
    required: true,
    placeholder: '예: 옷깃',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'address',
    label: '회사 주소',
    type: 'text',
    group: '명함 정보',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 3,
  },
  {
    id: 'delivery',
    label: '배송지',
    type: 'text',
    group: '배송·비고',
    placeholder: '받으실 곳 (사무실·집)',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'totalQuantityLabel',
    label: '총 수량',
    type: 'computed',
    group: '배송·비고',
    help: '명함별 수량의 합계입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '배송·비고',
    placeholder: '로고 파일, 색상, 납기 요청 등',
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['신청인', '팀장', '부서장', '본부장', '대표'],
    defaultValue: JSON.stringify([
      { label: '신청인', enabled: true },
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

const peopleOf = (rows: FormRows): FormRows['people'] =>
  (rows.people ?? []).filter((row) => (row.name ?? '').trim());

const quantityOf = (row: Record<string, string>): number => {
  const quantity = Number((row.quantity ?? '').replace(/,/g, ''));
  return Number.isFinite(quantity) ? quantity : 0;
};

export const businessCardRequest: FormTemplate = {
  slug: 'business-card-request',
  title: '명함 신청서',
  family: 'hr',
  category: 'people',
  description:
    '직원 명함을 한 번에 신청하는 명함 신청서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 이름·직위·연락처와 수량을 표로 정리하고 총 수량이 자동 계산됩니다.',
  keywords: [
    '명함 신청서',
    '명함 신청서 양식',
    '명함 주문서',
    '사내 명함 신청',
    '명함 인쇄 신청',
    '명함 신청 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'BC',
  lead: '여러 직원의 명함을 한 번에 신청하는 문서입니다. 이름·직위·영문명·연락처와 수량을 표로 정리하고 총 수량을 자동으로 계산합니다.',
  useCases: [
    '신규 입사자의 명함을 신청할 때',
    '부서 인원의 명함을 한 번에 주문할 때',
    '직위·연락처가 바뀌어 명함을 다시 만들 때',
    '명함 인쇄 업체에 정보를 전달할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 신청 부서를 확인합니다.',
    '회사명과 주소, 인쇄 형태, 배송지를 적습니다.',
    '명함을 받을 사람의 이름·직위·영문명·연락처·이메일·수량을 입력합니다.',
    '총 수량을 확인하고 PDF로 내려받아 결재를 받습니다.',
  ],
  notes: [
    '명함에 들어갈 정보는 인쇄 업체의 규격과 회사 CI 가이드에 맞춰 확인하세요.',
    '개인 연락처·이메일은 명함에 표시해도 되는 정보인지 본인에게 확인하세요.',
    '영문명 표기와 로고 파일은 인쇄 전에 최종 확인이 필요합니다.',
  ],
  fields,
  groups: [people],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '명함 신청서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '신청 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '신청 부서', field: 'department' },
        { label: '신청자', field: 'requester' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '신청자 연락처', field: 'contact' },
        { label: '인쇄 형태', field: 'cardType' },
      ],
    },
    { kind: 'section', title: '명함 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '회사명', field: 'company' }] },
    { kind: 'kv', columns: 1, rows: [{ label: '회사 주소', field: 'address' }] },
    { kind: 'section', title: '신청 명단' },
    {
      kind: 'table',
      columns: [
        { label: '이름', width: 30 },
        { label: '직위', width: 20 },
        { label: '영문명', width: 36 },
        { label: '연락처', width: 34 },
        { label: '이메일', width: 42 },
        { label: '수량', width: 12, align: 'right' },
      ],
      rows: (_values, rows) =>
        peopleOf(rows).map((row) => [
          (row.name ?? '').trim(),
          (row.position ?? '').trim(),
          (row.englishName ?? '').trim(),
          (row.phone ?? '').trim(),
          (row.email ?? '').trim(),
          row.quantity ? String(quantityOf(row)) : '',
        ]),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [{ label: '총 수량', field: 'totalQuantityLabel', strong: true }],
      width: 60,
    },
    { kind: 'section', title: '배송·비고' },
    { kind: 'kv', columns: 1, rows: [{ label: '배송지', field: 'delivery' }] },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['신청인', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const total = peopleOf(rows).reduce((sum, row) => sum + quantityOf(row), 0);
    return { totalQuantityLabel: total > 0 ? `${total}매` : '' };
  },
  validate: (_values, rows) => {
    const list = peopleOf(rows);
    const errors: string[] = [];
    if (list.length === 0) {
      errors.push('명함을 신청할 사람을 한 명 이상 입력하세요.');
    }
    if (list.some((row) => quantityOf(row) <= 0)) {
      errors.push('명함 수량은 1 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'BC-20261117-001',
    date: '2026-11-17',
    department: '경영지원팀',
    requester: '김옷깃',
    contact: '010-1234-5678',
    cardType: '영문 병기',
    company: '옷깃',
    address: '서울시 강남구 테헤란로 1',
    delivery: '본사 3층 경영지원팀',
    note: '로고 파일은 회사 공용 폴더의 최신 CI 파일을 사용합니다.',
  },
  sampleRows: {
    people: [
      {
        name: '김옷깃',
        position: '대리',
        englishName: 'Gildong Kim',
        phone: '010-1234-5678',
        email: 'kim@example.com',
        quantity: '2',
      },
      {
        name: '이데이터',
        position: '과장',
        englishName: 'Dain Lee',
        phone: '010-2222-3333',
        email: 'lee@example.com',
        quantity: '2',
      },
      {
        name: '박표',
        position: '사원',
        englishName: 'Pyo Park',
        phone: '010-3333-4444',
        email: 'park@example.com',
        quantity: '1',
      },
    ],
  },
  faq: [
    {
      q: '명함 신청서에는 어떤 정보가 필요한가요?',
      a: '이름·직위·영문명·연락처·이메일과 인쇄 수량이 필요합니다. 회사명·주소·인쇄 형태도 함께 적으면 인쇄 업체에 바로 전달할 수 있습니다.',
    },
    {
      q: '여러 명을 한 번에 신청할 수 있나요?',
      a: '네. 명단에 한 줄씩 추가하면 총 수량이 자동으로 계산됩니다. 부서가 다르면 신청서를 나누는 편이 관리하기 쉽습니다.',
    },
    {
      q: '영문명은 어떻게 적나요?',
      a: '여권이나 회사 영문 표기 기준에 맞춰 적습니다. 인쇄 전에 본인에게 최종 확인을 받으세요.',
    },
    {
      q: '로고나 색상은 어디에 적나요?',
      a: '비고에 로고 파일 위치와 색상 조건을 적습니다. 이 양식은 인쇄 파일을 만들지 않으므로 실제 인쇄는 업체 규격에 맞춰 진행하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '대한인쇄문화협회 — 인쇄 정보',
      href: 'https://www.print.or.kr/',
    },
  ],
  related: [
    { label: '비품 신청서 양식', href: '/forms/supplies-request/' },
    { label: '교육 신청서 양식', href: '/forms/training-request/' },
    { label: '연차 사용계획서 양식', href: '/forms/leave-plan/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
