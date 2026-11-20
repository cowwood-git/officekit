import { formatDateDot, formatKoreanAmount } from '@/lib/doc/format';
import type { FormBlock, FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const approvalDefault = JSON.stringify([
  { label: '신청인', enabled: true },
  { label: '팀장', enabled: false },
  { label: '부서장', enabled: true },
  { label: '본부장', enabled: false },
  { label: '대표', enabled: true },
]);

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'E-20261115-001',
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
    group: '지출자',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '지출자',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'position',
    label: '직위',
    type: 'text',
    group: '지출자',
    placeholder: '대리',
    maxLength: 30,
  },
  {
    id: 'payee',
    label: '지급처',
    type: 'text',
    group: '지출 정보',
    placeholder: '예: 옷깃마트',
    maxLength: 60,
  },
  {
    id: 'payMethod',
    label: '지급 방법',
    type: 'select',
    group: '지출 정보',
    options: ['계좌이체', '법인카드', '현금', '기타'],
    defaultValue: '법인카드',
  },
  {
    id: 'account',
    label: '계정과목',
    type: 'text',
    group: '지출 정보',
    placeholder: '예: 복리후생비',
    maxLength: 40,
  },
  {
    id: 'purpose',
    label: '지출 사유',
    type: 'textarea',
    group: '사유',
    placeholder: '예: 11월 팀 회의 다과 및 사무용품 구입',
    required: true,
    rows: 3,
    maxLength: 500,
    span: 3,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '사유',
    placeholder: '영수증 매수, 특이 사항',
    rows: 2,
    maxLength: 300,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['신청인', '팀장', '부서장', '본부장', '대표'],
    defaultValue: approvalDefault,
    required: true,
    maxSelected: 5,
    editable: true,
    help: '5칸 중 필요한 단계만 켜고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const expenses: RepeatGroup = {
  id: 'expenses',
  label: '지출 내역',
  group: '지출 정보',
  help: '사용일·항목·금액을 입력하면 합계와 일금이 자동으로 계산됩니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 3,
  maxRows: 20,
  addLabel: '+ 지출 항목 추가',
  required: true,
  summaryField: 'totalLabel',
  summaryLabel: '합계',
  columns: [
    { id: 'date', label: '사용일', type: 'date', width: 1.4 },
    {
      id: 'item',
      label: '지출 항목',
      type: 'text',
      required: true,
      placeholder: '예: 회의 다과',
      maxLength: 60,
      width: 3,
    },
    {
      id: 'amount',
      label: '금액',
      type: 'money',
      required: true,
      placeholder: '0',
      width: 1.4,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '영수증 번호',
      maxLength: 60,
      width: 1.8,
    },
  ],
};

const tableColumns = [
  { label: 'No', width: 12, align: 'center' },
  { label: '사용일', width: 28 },
  { label: '지출 항목', width: 72 },
  { label: '금액', width: 32, align: 'right' },
  { label: '비고', width: 30 },
] as const;

const itemRows = (rows: FormRows, limit?: number): readonly (readonly string[])[] => {
  const items = (rows.expenses ?? []).filter(
    (row) => (row.item ?? '').trim() || (row.amount ?? '').trim(),
  );
  const list = typeof limit === 'number' ? items.slice(0, limit) : items;
  return list.map((row, index) => [
    String(index + 1),
    row.date ? formatDateDot(row.date) : '',
    (row.item ?? '').trim(),
    row.amount ? formatWon(parseAmount(row.amount)) : '',
    (row.note ?? '').trim(),
  ]);
};

const summaryRows = (rows: FormRows): readonly (readonly string[])[] => {
  const items = (rows.expenses ?? []).filter(
    (row) => (row.item ?? '').trim() || (row.amount ?? '').trim(),
  );
  const top = itemRows(rows, 3);
  if (items.length > 3) {
    return [...top, ['', '', `외 ${items.length - 3}건`, '', '']];
  }
  return top;
};

const headerBlock: FormBlock = {
  kind: 'header',
  variant: 'editorial',
  title: '지출결의서',
  docNoField: 'docNo',
  dateField: 'date',
  logo: true,
};

const payeeBlock: FormBlock = {
  kind: 'kv',
  columns: 3,
  rows: [
    { label: '지급처', field: 'payee' },
    { label: '지급 방법', field: 'payMethod' },
    { label: '계정과목', field: 'account' },
  ],
};

const totalsBlock: FormBlock = {
  kind: 'totals',
  rows: [{ label: '합계', field: 'totalLabel', strong: true }],
};

const amountBlock: FormBlock = {
  kind: 'kv',
  columns: 1,
  rows: [{ label: '일금', field: 'amountKorean' }],
};

const purposeBlocks: FormBlock[] = [
  { kind: 'section', title: '사유' },
  { kind: 'text', field: 'purpose', minLines: 3 },
  { kind: 'text', label: '비고', field: 'note', minLines: 2 },
];

const signatureBlock: FormBlock = {
  kind: 'signature',
  roles: ['신청인', '부서장', '대표'],
  rolesField: 'approvalRoles',
  bottom: true,
};

const bodyBlocks: FormBlock[] = [
  headerBlock,
  { kind: 'section', title: '지출자' },
  {
    kind: 'kv',
    columns: 3,
    rows: [
      { label: '성명', field: 'name' },
      { label: '부서', field: 'department' },
      { label: '직위', field: 'position' },
    ],
  },
  { kind: 'section', title: '지출 정보' },
  payeeBlock,
  { kind: 'section', title: '지출 내역' },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => itemRows(rows),
    minRows: 3,
  },
  totalsBlock,
  amountBlock,
  ...purposeBlocks,
  signatureBlock,
];

const summaryBlocks: FormBlock[] = [
  headerBlock,
  { kind: 'section', title: '지출자' },
  {
    kind: 'kv',
    columns: 3,
    rows: [
      { label: '성명', field: 'name' },
      { label: '부서', field: 'department' },
      { label: '직위', field: 'position' },
    ],
  },
  { kind: 'section', title: '지출 정보' },
  payeeBlock,
  { kind: 'section', title: '지출 내역' },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => summaryRows(rows),
    minRows: 0,
  },
  totalsBlock,
  amountBlock,
  ...purposeBlocks,
  { kind: 'notice', text: '붙임 1. 지출 내역서 1부.' },
  signatureBlock,
];

const attachmentBlocks: FormBlock[] = [
  {
    kind: 'pageBreak',
    title: '붙임 1. 지출 내역서',
    note: '본 붙임은 본문 지출결의서의 일부입니다.',
  },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => itemRows(rows),
    minRows: 3,
  },
  totalsBlock,
  amountBlock,
];

export const expenseReport: FormTemplate = {
  slug: 'expense-report',
  title: '지출결의서',
  family: 'finance',
  category: 'money',
  description:
    '지출 일자·내역·금액을 줄 단위로 입력하면 합계가 자동 계산되고 결재선이 들어간 지출결의서를 A4 PDF로 만듭니다. 입력한 내용은 서버로 전송되지 않습니다.',
  keywords: [
    '지출결의서 양식',
    '지출결의서 PDF',
    '지출결의서 만들기',
    '법인카드 지출결의서',
    '회의비 지출결의서',
  ],
  updated: '2026-11-15',
  docPrefix: 'EX',
  lead: '회의비·소모품비·택시비 같은 지출을 한 장에 정리하는 지출결의서입니다. 사용일·항목·금액을 입력하면 합계와 일금이 자동으로 계산되고, 결재선은 1~5명까지 이름을 직접 고칠 수 있습니다.',
  useCases: [
    '회의비·다과비·소모품비를 결재받을 때',
    '법인카드 사용 내역을 한 장으로 정리할 때',
    '부서 지출을 증빙과 함께 올릴 때',
    '인쇄해서 서명·날인 후 보관할 때',
  ],
  howTo: [
    '문서 번호와 작성일을 확인합니다. 문서 번호는 작성일에 맞춰 자동으로 바뀝니다.',
    '지출자와 지급처·지급 방법·계정과목을 입력합니다.',
    '지출 내역에 사용일·항목·금액을 입력합니다. 합계와 일금은 자동으로 계산됩니다.',
    '결재선을 1~5명까지 선택하고 이름을 직접 고친 뒤 PDF로 내려받습니다.',
  ],
  notes: [
    '이 문서는 참고용입니다. 회사의 회계·증빙 규정과 세법상 적격증빙 요건을 따르세요.',
    '영수증 이미지는 PDF 합치기나 PDF 서명 도구로 이 문서 뒤에 붙일 수 있습니다.',
    '부가세 포함·별도 구분이 필요하면 비고에 적고, 회계 프로그램의 기준에 맞춰 처리하세요.',
  ],
  fields,
  groups: [expenses],
  blocks: bodyBlocks,
  buildBlocks: ({ attachment }) =>
    attachment ? [...summaryBlocks, ...attachmentBlocks] : bodyBlocks,
  sample: {
    docNo: 'E-20261115-001',
    date: '2026-11-15',
    name: '김옷깃',
    department: '경영지원팀',
    position: '대리',
    payee: '옷깃마트',
    payMethod: '법인카드',
    account: '복리후생비',
    purpose: '11월 팀 회의 다과 및 사무용품 구입',
    note: '영수증 2매 첨부',
  },
  sampleRows: {
    expenses: [
      {
        date: '2026-11-12',
        item: '회의 다과',
        amount: '45000',
        note: '영수증 1',
      },
      {
        date: '2026-11-13',
        item: '사무용품',
        amount: '32000',
        note: '영수증 2',
      },
      { date: '2026-11-14', item: '택시비', amount: '18000', note: '' },
    ],
  },
  compute: (_values, rows) => {
    const total = (rows.expenses ?? []).reduce(
      (sum, row) => sum + parseAmount(row.amount ?? ''),
      0,
    );
    return {
      totalLabel: formatWon(total),
      amountKorean: total > 0 ? formatKoreanAmount(total) : '',
    };
  },
  validate: (_values, rows) => {
    const filled = (rows.expenses ?? []).filter(
      (row) => (row.item ?? '').trim() || (row.amount ?? '').trim(),
    );
    const errors: string[] = [];
    if (filled.some((row) => parseAmount(row.amount ?? '') <= 0)) {
      errors.push('지출 금액은 1원 이상이어야 합니다.');
    }
    return errors;
  },
  faq: [
    {
      q: '영수증은 어떻게 첨부하나요?',
      a: '이 양식은 지출 내역과 결재란을 PDF로 만듭니다. 영수증 사진은 ‘JPG → PDF’로 PDF를 만든 뒤 ‘PDF 합치기’로 이 문서 뒤에 붙이면 한 파일로 제출할 수 있습니다.',
    },
    {
      q: '부가세는 어떻게 처리해야 하나요?',
      a: '이 양식은 입력한 지출 금액을 그대로 합산합니다. 부가세 포함·별도 구분이나 적격증빙 처리는 회사의 회계 기준과 세법을 따르세요.',
    },
    {
      q: '결재선은 몇 명까지 넣을 수 있나요?',
      a: '최대 5명까지 체크할 수 있고, 각 줄의 이름을 직접 고칠 수 있습니다. 체크한 순서대로 문서 서명란에 표시됩니다.',
    },
    {
      q: '법적 효력이 있나요?',
      a: '이 양식은 참고용입니다. 회사의 회계·증빙 규정과 세법상 적격증빙 요건을 따르세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국세청 — 적격증빙·증빙서류 안내',
      href: 'https://www.nts.go.kr/',
    },
    {
      label: '국세청 홈택스',
      href: 'https://www.hometax.go.kr/',
    },
  ],
  related: [
    { label: '휴가신청서', href: '/forms/leave-request/' },
    { label: '회의록', href: '/forms/meeting-minutes/' },
    { label: 'PDF 합치기', href: '/tools/pdf-merge/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
