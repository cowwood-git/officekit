import { formatKoreanAmount } from '@/lib/doc/format';
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
    placeholder: 'T-20261115-001',
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
    id: 'position',
    label: '직위',
    type: 'text',
    group: '출장자',
    placeholder: '대리',
    maxLength: 30,
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
    id: 'transport',
    label: '교통편',
    type: 'text',
    group: '출장 정보',
    placeholder: '예: KTX',
    maxLength: 40,
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
    id: 'companion',
    label: '동행',
    type: 'text',
    group: '출장 정보',
    placeholder: '동행자 이름',
    maxLength: 60,
  },
  {
    id: 'purpose',
    label: '출장 목적',
    type: 'textarea',
    group: '출장 목적',
    placeholder: '출장 목적과 주요 일정을 적습니다.',
    required: true,
    rows: 4,
    maxLength: 500,
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

const costs: RepeatGroup = {
  id: 'costs',
  label: '예상 경비',
  group: '출장 목적',
  help: '교통비·숙박비·식비 등 예상 경비를 입력하면 합계가 자동으로 계산됩니다.',
  minRows: 3,
  maxRows: 20,
  addLabel: '+ 경비 항목 추가',
  required: true,
  summaryField: 'totalLabel',
  summaryLabel: '예상 합계',
  columns: [
    {
      id: 'category',
      label: '구분',
      type: 'select',
      options: ['교통비', '숙박비', '식비', '기타'],
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
      placeholder: '메모',
      maxLength: 40,
      width: 1.6,
    },
  ],
};

const tableColumns = [
  { label: 'No', width: 12, align: 'center' },
  { label: '구분', width: 26 },
  { label: '항목', width: 70 },
  { label: '금액', width: 34, align: 'right' },
  { label: '비고', width: 32 },
] as const;

const costRows = (rows: FormRows): readonly (readonly string[])[] => {
  const items = (rows.costs ?? []).filter(
    (row) => (row.item ?? '').trim() || (row.amount ?? '').trim(),
  );
  return items.map((row, index) => [
    String(index + 1),
    (row.category ?? '').trim(),
    (row.item ?? '').trim(),
    row.amount ? formatWon(parseAmount(row.amount)) : '',
    (row.note ?? '').trim(),
  ]);
};

const blocks: FormBlock[] = [
  {
    kind: 'header',
    variant: 'editorial',
    title: '출장신청서',
    docNoField: 'docNo',
    dateField: 'date',
    logo: true,
  },
  { kind: 'section', title: '출장자' },
  {
    kind: 'kv',
    columns: 3,
    rows: [
      { label: '성명', field: 'name' },
      { label: '부서', field: 'department' },
      { label: '직위', field: 'position' },
    ],
  },
  { kind: 'section', title: '출장 정보' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '출장지', field: 'destination' },
      { label: '교통편', field: 'transport' },
    ],
  },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '시작일', field: 'from' },
      { label: '종료일', field: 'to' },
    ],
  },
  {
    kind: 'kv',
    columns: 1,
    rows: [{ label: '동행', field: 'companion' }],
  },
  { kind: 'section', title: '출장 목적' },
  { kind: 'text', field: 'purpose', minLines: 4 },
  { kind: 'section', title: '예상 경비' },
  {
    kind: 'table',
    columns: tableColumns,
    rows: (_values, rows) => costRows(rows),
    minRows: 3,
  },
  {
    kind: 'totals',
    rows: [{ label: '예상 합계', field: 'totalLabel', strong: true }],
  },
  {
    kind: 'kv',
    columns: 1,
    rows: [{ label: '일금', field: 'amountKorean' }],
  },
  {
    kind: 'signature',
    roles: ['신청인', '부서장', '대표'],
    rolesField: 'approvalRoles',
    bottom: true,
  },
];

export const travelRequest: FormTemplate = {
  slug: 'travel-request',
  title: '출장신청서',
  family: 'hr',
  category: 'people',
  description:
    '출장지·기간·목적·동행자·예상 경비를 입력해 결재용 출장신청서를 A4 PDF로 만듭니다. 다녀온 뒤에는 출장보고서·출장비 정산서로 이어서 작성할 수 있습니다.',
  keywords: ['출장신청서 양식', '출장신청서 PDF', '출장 신청서', '출장비 예산'],
  updated: '2026-11-15',
  docPrefix: 'TQ',
  lead: '출장지와 기간, 목적, 예상 경비를 한 장에 정리하는 출장신청서입니다. 경비 항목을 입력하면 예상 합계와 일금이 자동으로 계산됩니다.',
  useCases: [
    '국내·해외 출장을 미리 신청할 때',
    '출장 예산을 결재받을 때',
    '출장 목적과 일정을 공유할 때',
    '출장보고서·정산서와 함께 보관할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 출장자 정보를 확인합니다.',
    '출장지·교통편·기간·동행을 입력합니다.',
    '예상 경비를 항목별로 입력하면 합계와 일금이 자동으로 계산됩니다.',
    '결재선을 선택하고 PDF로 내려받습니다.',
  ],
  notes: [
    '이 문서는 참고용입니다. 출장 규정·여비 기준은 회사의 규정을 따르세요.',
    '예상 경비는 참고값입니다. 실제 정산은 출장비 정산서에 영수증과 함께 정리하세요.',
    '출장이 끝나면 출장보고서와 정산서를 이어서 작성하면 좋습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  groups: [costs],
  blocks,
  sample: {
    docNo: 'T-20261115-001',
    date: '2026-11-15',
    name: '김옷깃',
    department: '경영지원팀',
    position: '대리',
    destination: '부산',
    transport: 'KTX',
    from: '2026-11-20',
    to: '2026-11-21',
    companion: '박출장',
    purpose: '부산 거래처 방문과 현장 미팅, 연말 납품 일정 협의',
  },
  sampleRows: {
    costs: [
      { category: '교통비', item: 'KTX 왕복', amount: '120000', note: '' },
      { category: '숙박비', item: '호텔 1박', amount: '150000', note: '법인카드' },
      { category: '식비', item: '식사 2회', amount: '60000', note: '' },
    ],
  },
  compute: (_values, rows) => {
    const total = (rows.costs ?? []).reduce((sum, row) => sum + parseAmount(row.amount ?? ''), 0);
    return {
      totalLabel: formatWon(total),
      amountKorean: total > 0 ? formatKoreanAmount(total) : '',
    };
  },
  validate: (_values, rows) => {
    const filled = (rows.costs ?? []).filter(
      (row) => (row.item ?? '').trim() || (row.amount ?? '').trim(),
    );
    return filled.some((row) => parseAmount(row.amount ?? '') <= 0)
      ? ['예상 경비는 1원 이상이어야 합니다.']
      : [];
  },
  faq: [
    {
      q: '출장신청서와 출장보고서는 무엇이 다른가요?',
      a: '출장신청서는 출장 전에 계획과 예산을 승인받는 문서이고, 출장보고서는 출장 후 활동과 결과를 정리하는 문서입니다.',
    },
    {
      q: '예상 경비는 어떻게 계산되나요?',
      a: '경비 항목과 금액을 입력하면 합계와 일금이 자동으로 계산됩니다. 실제 정산은 영수증을 기준으로 출장비 정산서에서 처리하세요.',
    },
    {
      q: '결재선은 어떻게 바꾸나요?',
      a: '최대 5명까지 체크하고 이름을 직접 고칠 수 있습니다. 선택한 순서대로 문서에 표시됩니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다.',
    },
  ],
  sources: [
    { label: '행정안전부 — 문서 관리 안내', href: 'https://www.mois.go.kr/' },
    { label: '국세청 — 증빙서류 안내', href: 'https://www.nts.go.kr/' },
  ],
  related: [
    { label: '출장보고서', href: '/forms/travel-report/' },
    { label: '출장비 정산서', href: '/forms/travel-expense/' },
    { label: 'PDF 합치기', href: '/tools/pdf-merge/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
