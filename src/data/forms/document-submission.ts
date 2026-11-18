import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const documents: RepeatGroup = {
  id: 'documents',
  label: '제출 서류',
  help: '제출할 서류와 부수를 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 2,
  maxRows: 20,
  addLabel: '+ 서류 추가',
  required: true,
  group: '제출 정보',
  summaryField: 'totalCountLabel',
  summaryLabel: '서류 수',
  columns: [
    {
      id: 'name',
      label: '서류명',
      type: 'text',
      required: true,
      placeholder: '예: 주민등록등본',
      maxLength: 80,
      width: 3,
    },
    { id: 'copies', label: '부수', type: 'number', placeholder: '1', width: 0.9 },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '원본·사본 여부',
      maxLength: 50,
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
    placeholder: 'DS-20261118-001',
    help: '제출일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다.',
  },
  { id: 'date', label: '제출일', type: 'date', group: '문서', defaultToday: true, required: true },
  {
    id: 'recipient',
    label: '제출처',
    type: 'text',
    group: '제출 정보',
    placeholder: '예: ○○구청',
    required: true,
    maxLength: 80,
    span: 2,
  },
  {
    id: 'submitter',
    label: '제출자',
    type: 'text',
    group: '제출 정보',
    placeholder: '김제출',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '제출 정보',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'purpose',
    label: '제출 목적',
    type: 'text',
    group: '제출 정보',
    placeholder: '예: 사업자 등록 신청',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'totalCountLabel',
    label: '서류 수',
    type: 'computed',
    group: '제출 정보',
    help: '제출 서류 줄 수입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '추가 안내·연락처 등',
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['제출자', '접수자'],
    defaultValue: JSON.stringify([
      { label: '제출자', enabled: true },
      { label: '접수자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const documentsOf = (rows: FormRows): FormRows['documents'] =>
  (rows.documents ?? []).filter((row) => (row.name ?? '').trim());

export const documentSubmission: FormTemplate = {
  slug: 'document-submission',
  title: '서류 제출 확인서',
  family: 'proof',
  category: 'proof',
  description:
    '기관·회사에 제출한 서류 목록과 부수를 확인하는 서류 제출 확인서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '서류 제출 확인서',
    '서류 제출 확인서 양식',
    '제출 서류 목록',
    '서류 접수 확인',
    '서류 제출 확인서 PDF',
  ],
  updated: '2026-11-18',
  docPrefix: 'DS',
  lead: '제출처에 어떤 서류를 몇 부 냈는지 확인하는 문서입니다. 제출자와 접수자 서명으로 접수 사실을 남길 수 있습니다.',
  useCases: [
    '관공서·회사에 서류를 제출할 때',
    '제출 서류 목록을 상대와 확인할 때',
    '접수 사실을 증빙으로 남길 때',
    '여러 부서에 같은 서류를 낼 때',
  ],
  howTo: [
    '제출일과 제출처, 제출자를 적습니다.',
    '제출할 서류와 부수를 입력합니다.',
    '비고를 확인하고 PDF로 내려받습니다.',
    '제출처에서 접수 확인을 받습니다.',
  ],
  notes: [
    '제출 서류의 원본·사본 여부를 비고에 적으면 확인이 쉽습니다.',
    '개인정보가 포함된 서류는 제출 목적과 보관 기간을 확인하세요.',
    '접수자 서명이나 접수 도장을 받으면 증빙력이 높아집니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  groups: [documents],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '서류 제출 확인서',
      docNoField: 'docNo',
      dateField: 'date',
      docNoLabel: '문서번호',
      dateLabel: '제출일',
    },
    { kind: 'section', title: '제출 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '제출처', field: 'recipient' },
        { label: '제출자', field: 'submitter' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '부서', field: 'department' },
        { label: '서류 수', field: 'totalCountLabel' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '제출 목적', field: 'purpose' }] },
    { kind: 'section', title: '제출 서류' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '서류명', width: 100 },
        { label: '부수', width: 18, align: 'right' },
        { label: '비고', width: 40 },
      ],
      rows: (_values, rows) =>
        documentsOf(rows).map((row, index) => [
          String(index + 1),
          (row.name ?? '').trim(),
          row.copies ? String(row.copies) : '',
          (row.note ?? '').trim(),
        ]),
      minRows: 2,
    },
    {
      kind: 'totals',
      rows: [{ label: '서류 수', field: 'totalCountLabel', strong: true }],
      width: 60,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    { kind: 'signature', roles: ['제출자', '접수자'], rolesField: 'approvalRoles', bottom: true },
  ],
  compute: (_values, rows) => ({
    totalCountLabel: documentsOf(rows).length > 0 ? `${documentsOf(rows).length}건` : '',
  }),
  validate: (_values, rows) =>
    documentsOf(rows).length === 0 ? ['제출 서류를 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'DS-20261118-001',
    date: '2026-11-18',
    recipient: '○○구청',
    submitter: '김제출',
    department: '경영지원팀',
    purpose: '사업자 등록 신청',
    note: '원본 제출 후 접수증을 받았습니다.',
  },
  sampleRows: {
    documents: [
      { name: '사업자등록 신청서', copies: '1', note: '원본' },
      { name: '임대차계약서 사본', copies: '1', note: '사본' },
      { name: '신분증 사본', copies: '1', note: '사본' },
    ],
  },
  faq: [
    {
      q: '서류 제출 확인서는 누가 작성하나요?',
      a: '제출자가 작성하고 제출처 담당자가 접수 확인을 하는 방식이 일반적입니다.',
    },
    {
      q: '접수자 서명이 꼭 필요한가요?',
      a: '필수는 아니지만 접수 사실을 증명하려면 서명이나 접수 도장을 받는 것이 좋습니다.',
    },
    {
      q: '원본과 사본을 구분해야 하나요?',
      a: '네. 비고에 원본·사본 여부를 적으면 나중에 서류를 확인할 때 혼동을 줄일 수 있습니다.',
    },
  ],
  sources: [{ label: '행정안전부 — 민원 서류 제출 안내', href: 'https://www.mois.go.kr/' }],
  related: [
    { label: '사실확인서 양식', href: '/forms/fact-confirmation/' },
    { label: '위임장 양식', href: '/forms/delegation/' },
    { label: '문서 배포·회수 대장', href: '/forms/document-distribution/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
