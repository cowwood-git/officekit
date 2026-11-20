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
    placeholder: 'V-20261115-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다.',
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
    group: '출장자',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '출장자',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'destination',
    label: '출장지',
    type: 'text',
    group: '출장 정보',
    placeholder: '예: 부산',
    required: true,
    maxLength: 60,
  },
  {
    id: 'from',
    label: '시작일',
    type: 'date',
    group: '출장 정보',
    required: true,
  },
  {
    id: 'to',
    label: '종료일',
    type: 'date',
    group: '출장 정보',
    required: true,
  },
  {
    id: 'advance',
    label: '지급받은 금액',
    type: 'text',
    group: '정산',
    placeholder: '예: 300,000',
    maxLength: 20,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '정산',
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
  group: '출장 정보',
  help: '사용일·구분·항목·금액을 입력하면 합계와 잔액이 자동으로 계산됩니다.',
  minRows: 3,
  maxRows: 30,
  addLabel: '+ 지출 항목 추가',
  required: true,
  summaryField: 'totalLabel',
  summaryLabel: '지출 합계',
  columns: [
    { id: 'date', label: '사용일', type: 'date', width: 1.3 },
    {
      id: 'category',
      label: '구분',
      type: 'select',
      options: ['교통비', '숙박비', '식비', '통신비', '기타'],
      width: 1.2,
    },
    {
      id: 'item',
      label: '항목',
      type: 'text',
      required: true,
      placeholder: '예: KTX 왕복',
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
      maxLength: 40,
      width: 1.5,
    },
  ],
};

const tableColumns = [
  { label: 'No', width: 12, align: 'center' },
  { label: '사용일', width: 28 },
  { label: '구분', width: 24 },
  { label: '항목', width: 58 },
  { label: '금액', width: 30, align: 'right' },
  { label: '비고', width: 22 },
] as const;

const itemRows = (rows: FormRows, limit?: number): readonly (readonly string[])[] => {
  const items = (rows.expenses ?? []).filter(
    (row) => (row.item ?? '').trim() || (row.amount ?? '').trim(),
  );
  const list = typeof limit === 'number' ? items.slice(0, limit) : items;
  return list.map((row, index) => [
    String(index + 1),
    row.date ? formatDateDot(row.date) : '',
    (row.category ?? '').trim(),
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
    return [...top, ['', '', '', `외 ${items.length - 3}건`, '', '']];
  }
  return top;
};

const totalsBlock: FormBlock = {
  kind: 'totals',
  rows: [
    { label: '지출 합계', field: 'totalLabel' },
    { label: '지급액', field: 'advanceLabel' },
    { label: '잔액', field: 'balanceLabel', strong: true },
  ],
};

const signatureBlock: FormBlock = {
  kind: 'signature',
  roles: ['신청인', '부서장', '대표'],
  rolesField: 'approvalRoles',
  bottom: true,
};

const bodyBlocks: FormBlock[] = [
  {
    kind: 'header',
    variant: 'editorial',
    title: '출장비 정산서',
    docNoField: 'docNo',
    dateField: 'date',
    logo: true,
  },
  { kind: 'section', title: '출장자' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '성명', field: 'name' },
      { label: '부서', field: 'department' },
    ],
  },
  { kind: 'section', title: '출장 정보' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '출장지', field: 'destination' },
      { label: '기간', field: 'period' },
    ],
  },
  { kind: 'section', title: '지출 내역' },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => itemRows(rows),
    minRows: 3,
  },
  totalsBlock,
  {
    kind: 'kv',
    columns: 1,
    rows: [{ label: '일금', field: 'amountKorean' }],
  },
  { kind: 'text', label: '비고', field: 'note', minLines: 2 },
  signatureBlock,
];

const summaryBlocks: FormBlock[] = [
  {
    kind: 'header',
    title: '출장비 정산서',
    docNoField: 'docNo',
    dateField: 'date',
    logo: true,
  },
  { kind: 'section', title: '출장자' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '성명', field: 'name' },
      { label: '부서', field: 'department' },
    ],
  },
  { kind: 'section', title: '출장 정보' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '출장지', field: 'destination' },
      { label: '기간', field: 'period' },
    ],
  },
  { kind: 'section', title: '지출 내역' },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => summaryRows(rows),
    minRows: 0,
  },
  totalsBlock,
  {
    kind: 'kv',
    columns: 1,
    rows: [{ label: '일금', field: 'amountKorean' }],
  },
  { kind: 'text', label: '비고', field: 'note', minLines: 2 },
  { kind: 'notice', text: '붙임 1. 지출 내역서 1부.' },
  signatureBlock,
];

const attachmentBlocks: FormBlock[] = [
  {
    kind: 'pageBreak',
    title: '붙임 1. 지출 내역서',
    note: '본 붙임은 본문 출장비 정산서의 일부입니다.',
  },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => itemRows(rows),
    minRows: 3,
  },
  totalsBlock,
  {
    kind: 'kv',
    columns: 1,
    rows: [{ label: '일금', field: 'amountKorean' }],
  },
];

export const travelExpense: FormTemplate = {
  slug: 'travel-expense',
  title: '출장비 정산서',
  family: 'hr',
  category: 'people',
  description:
    '출장 중 사용한 교통비·숙박비·식비를 정리해 출장비 정산서를 만들고 A4 PDF로 저장합니다. 입력한 내용은 서버로 전송되지 않습니다.',
  keywords: ['출장비 정산서', '출장비 정산서 양식', '출장 정산서 PDF', '출장 경비 정산'],
  updated: '2026-11-15',
  docPrefix: 'TE',
  lead: '출장 중 사용한 경비와 지급받은 금액을 정리하는 출장비 정산서입니다. 지출 항목을 입력하면 합계와 잔액(반납·추가 지급)이 자동으로 계산됩니다.',
  useCases: [
    '출장 후 교통비·숙박비·식비를 정산할 때',
    '지급받은 출장비와 실제 사용액을 맞출 때',
    '영수증과 함께 정산 증빙을 남길 때',
    '출장보고서와 함께 제출할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 출장자·출장 정보를 확인합니다.',
    '지급받은 금액이 있으면 입력합니다.',
    '사용일·구분·항목·금액을 입력하면 지출 합계와 잔액이 자동으로 계산됩니다.',
    '잔액이 양수면 반납, 음수면 추가 지급입니다. 결재선을 확인하고 PDF로 내려받습니다.',
  ],
  notes: [
    '이 문서는 참고용입니다. 출장비 정산 기준과 증빙 요건은 회사의 규정을 따르세요.',
    '영수증은 출력 후 붙이거나 PDF 합치기로 이 문서 뒤에 붙일 수 있습니다.',
    '잔액이 양수면 반납, 음수면 추가 지급으로 표시됩니다.',
  ],
  fields,
  groups: [expenses],
  blocks: bodyBlocks,
  buildBlocks: ({ attachment }) =>
    attachment ? [...summaryBlocks, ...attachmentBlocks] : bodyBlocks,
  sample: {
    docNo: 'V-20261115-001',
    date: '2026-11-15',
    name: '김옷깃',
    department: '경영지원팀',
    destination: '부산',
    from: '2026-11-20',
    to: '2026-11-21',
    advance: '300000',
    note: '영수증 3매 첨부',
  },
  sampleRows: {
    expenses: [
      {
        date: '2026-11-20',
        category: '교통비',
        item: 'KTX 왕복',
        amount: '120000',
        note: '영수증 1',
      },
      {
        date: '2026-11-20',
        category: '숙박비',
        item: '호텔 1박',
        amount: '150000',
        note: '영수증 2',
      },
      { date: '2026-11-21', category: '식비', item: '식사 2회', amount: '60000', note: '영수증 3' },
    ],
  },
  compute: (values, rows) => {
    const total = (rows.expenses ?? []).reduce(
      (sum, row) => sum + parseAmount(row.amount ?? ''),
      0,
    );
    const advance = parseAmount(values.advance ?? '');
    const balance = advance - total;
    return {
      period:
        values.from && values.to
          ? `${formatDateDot(values.from)} ~ ${formatDateDot(values.to)}`
          : '',
      totalLabel: formatWon(total),
      advanceLabel: formatWon(advance),
      balanceLabel:
        balance === 0
          ? '0원'
          : balance > 0
            ? `${formatWon(balance)} 반납`
            : `${formatWon(-balance)} 추가 지급`,
      amountKorean: total > 0 ? formatKoreanAmount(total) : '',
    };
  },
  validate: (_values, rows) => {
    const filled = (rows.expenses ?? []).filter(
      (row) => (row.item ?? '').trim() || (row.amount ?? '').trim(),
    );
    return filled.some((row) => parseAmount(row.amount ?? '') <= 0)
      ? ['지출 금액은 1원 이상이어야 합니다.']
      : [];
  },
  faq: [
    {
      q: '지급받은 금액이 없으면 어떻게 하나요?',
      a: '지급받은 금액을 비워 두면 지급액 0원, 잔액은 지출 합계만큼 추가 지급으로 표시됩니다. 실제 정산 기준에 맞춰 입력하세요.',
    },
    {
      q: '잔액은 어떻게 계산되나요?',
      a: '지급받은 금액에서 지출 합계를 뺀 값입니다. 양수면 반납, 음수면 추가 지급으로 표시됩니다.',
    },
    {
      q: '영수증은 어떻게 붙이나요?',
      a: '출력 후 영수증을 붙이거나, PDF 합치기로 이 문서 뒤에 영수증 이미지를 붙일 수 있습니다.',
    },
    {
      q: '결재선은 어떻게 바꾸나요?',
      a: '최대 5명까지 체크하고 이름을 직접 고칠 수 있습니다.',
    },
  ],
  sources: [
    { label: '국세청 — 증빙서류 안내', href: 'https://www.nts.go.kr/' },
    { label: '행정안전부 — 문서 관리 안내', href: 'https://www.mois.go.kr/' },
  ],
  related: [
    { label: '출장신청서', href: '/forms/travel-request/' },
    { label: '출장보고서', href: '/forms/travel-report/' },
    { label: 'PDF 합치기', href: '/tools/pdf-merge/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
