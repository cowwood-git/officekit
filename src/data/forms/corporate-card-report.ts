import { formatDateDot } from '@/lib/doc/format';
import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const items: RepeatGroup = {
  id: 'items',
  label: '사용 내역',
  group: '사용 정보',
  help: '사용일·가맹점·내용·금액을 한 줄씩 적습니다. 합계와 건수가 자동으로 계산됩니다.',
  minRows: 3,
  maxRows: 40,
  addLabel: '+ 사용 내역 추가',
  required: true,
  summaryField: 'totalLabel',
  summaryLabel: '합계',
  columns: [
    {
      id: 'usedAt',
      label: '사용일',
      type: 'date',
      required: true,
      width: 1.2,
    },
    {
      id: 'merchant',
      label: '가맹점',
      type: 'text',
      required: true,
      placeholder: '예: 옷깃마트',
      maxLength: 60,
      width: 2.4,
    },
    {
      id: 'description',
      label: '사용 내역',
      type: 'text',
      placeholder: '예: 팀 회의 다과',
      maxLength: 60,
      width: 2.6,
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
      placeholder: '참석자 등',
      maxLength: 40,
      width: 1.4,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'CC-20261117-001',
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
    id: 'periodFrom',
    label: '사용 시작일',
    type: 'date',
    group: '사용 정보',
    required: true,
  },
  {
    id: 'periodTo',
    label: '사용 종료일',
    type: 'date',
    group: '사용 정보',
    required: true,
  },
  {
    id: 'cardCompany',
    label: '카드사',
    type: 'text',
    group: '사용 정보',
    required: true,
    placeholder: '예: 옷깃카드',
    maxLength: 40,
  },
  {
    id: 'cardLast4',
    label: '카드번호 끝 4자리',
    type: 'text',
    group: '사용 정보',
    placeholder: '1234',
    maxLength: 4,
  },
  {
    id: 'holder',
    label: '사용자',
    type: 'text',
    group: '사용 정보',
    required: true,
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '사용 정보',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'purpose',
    label: '사용 목적',
    type: 'text',
    group: '사용 정보',
    placeholder: '예: 11월 팀 운영비',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'totalLabel',
    label: '합계',
    type: 'computed',
    group: '집계',
    help: '사용 금액의 합계입니다.',
  },
  {
    id: 'countLabel',
    label: '사용 건수',
    type: 'computed',
    group: '집계',
    help: '입력한 사용 내역 줄 수입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '영수증 보관, 참석자, 정산 시 참고할 내용',
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['작성자', '팀장', '부서장'],
    defaultValue: JSON.stringify([
      { label: '작성자', enabled: true },
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

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.merchant ?? '').trim());

const amountOf = (row: Record<string, string>): number => parseAmount(row.amount ?? '');

export const corporateCardReport: FormTemplate = {
  slug: 'corporate-card-report',
  title: '법인카드 사용내역서',
  family: 'finance',
  category: 'money',
  description:
    '법인카드 사용 내역을 기간별로 정리하는 사용내역서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 사용 건수와 합계가 자동으로 계산됩니다.',
  keywords: [
    '법인카드 사용내역서',
    '법인카드 사용 내역',
    '법인카드 정산',
    '카드 사용내역 양식',
    '법인카드 PDF',
    '업무카드 정산',
  ],
  updated: '2026-11-17',
  docPrefix: 'CC',
  lead: '한 달 동안 법인카드로 쓴 내역을 가맹점·사용처·금액으로 정리하는 문서입니다. 사용 건수와 합계를 자동으로 계산해 정산·보고에 바로 쓸 수 있습니다.',
  useCases: [
    '월말 법인카드 사용 내역을 정산할 때',
    '팀 운영비·접대비 사용 내역을 보고할 때',
    '카드 명세서와 사용 목적을 대조할 때',
    '경비 처리에 필요한 증빙 목록을 만들 때',
  ],
  howTo: [
    '문서 번호와 작성일, 사용 기간을 확인합니다.',
    '카드사와 카드번호 끝 4자리, 사용자와 부서를 적습니다.',
    '사용일·가맹점·사용 내역·금액을 한 줄씩 입력합니다.',
    '합계와 건수를 확인하고 PDF로 내려받아 결재를 받습니다.',
  ],
  notes: [
    '이 문서는 사용 내역을 정리하는 보조 자료입니다. 실제 정산은 카드 명세서와 회사 경비 규정을 따르세요.',
    '접대비·출장비 등 증빙이 필요한 항목은 영수증과 참석자 정보를 함께 보관하세요.',
    '카드번호 전체를 적지 말고 끝 4자리만 적어 노출을 줄이세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '법인카드 사용내역서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '사용 정보' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '사용 시작일', field: 'periodFrom' },
        { label: '사용 종료일', field: 'periodTo' },
        { label: '카드사', field: 'cardCompany' },
      ],
    },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '카드번호 끝 4자리', field: 'cardLast4' },
        { label: '사용자', field: 'holder' },
        { label: '부서', field: 'department' },
      ],
    },
    { kind: 'kv', columns: 2, rows: [{ label: '사용 목적', field: 'purpose' }] },
    { kind: 'section', title: '사용 내역' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '사용일', width: 24 },
        { label: '가맹점', width: 50 },
        { label: '사용 내역', width: 44 },
        { label: '금액', width: 28, align: 'right' },
        { label: '비고', width: 18 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row, index) => [
          String(index + 1),
          row.usedAt ? formatDateDot(row.usedAt) : '',
          (row.merchant ?? '').trim(),
          (row.description ?? '').trim(),
          amountOf(row) > 0 ? formatWon(amountOf(row)) : '',
          (row.note ?? '').trim(),
        ]),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [
        { label: '사용 건수', field: 'countLabel' },
        { label: '합계', field: 'totalLabel', strong: true },
      ],
      width: 70,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장', '부서장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = itemsOf(rows);
    const total = list.reduce((sum, row) => sum + amountOf(row), 0);
    return {
      totalLabel: total > 0 ? formatWon(total) : '',
      countLabel: list.length > 0 ? `${list.length}건` : '',
    };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) {
      errors.push('법인카드 사용 내역을 한 줄 이상 입력하세요.');
    }
    if (list.some((row) => amountOf(row) <= 0)) {
      errors.push('사용 금액을 입력하세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'CC-20261117-001',
    date: '2026-11-17',
    periodFrom: '2026-11-01',
    periodTo: '2026-11-30',
    cardCompany: '옷깃카드',
    cardLast4: '1234',
    holder: '김옷깃',
    department: '경영지원팀',
    purpose: '11월 팀 운영비',
    note: '영수증 4매를 함께 보관합니다. 11월 20일 사용분은 참석자 3명입니다.',
  },
  sampleRows: {
    items: [
      {
        usedAt: '2026-11-05',
        merchant: '옷깃마트',
        description: '팀 회의 다과',
        amount: '45000',
        note: '참석 5명',
      },
      {
        usedAt: '2026-11-10',
        merchant: '한빛오피스',
        description: '복사용지·토너',
        amount: '164000',
        note: '',
      },
      {
        usedAt: '2026-11-18',
        merchant: '새길문구',
        description: '사무용품',
        amount: '32000',
        note: '',
      },
      {
        usedAt: '2026-11-24',
        merchant: '옷깃식당',
        description: '거래처 미팅 식사',
        amount: '89000',
        note: '참석 3명',
      },
    ],
  },
  faq: [
    {
      q: '법인카드 사용내역서는 어디에 쓰나요?',
      a: '월말 정산, 팀 운영비 보고, 경비 처리 증빙 목록으로 씁니다. 카드 명세서와 사용 목적을 함께 정리하면 회계·감사 대응이 쉬워집니다.',
    },
    {
      q: '카드번호를 모두 적어야 하나요?',
      a: '아니요. 보안을 위해 끝 4자리만 적습니다. 명세서와 대조할 때는 카드사·사용자·기간으로 구분하세요.',
    },
    {
      q: '합계와 건수는 자동인가요?',
      a: '네. 가맹점이 입력된 줄의 금액을 더하고 건수를 셉니다. 빈 줄은 집계에서 제외됩니다.',
    },
    {
      q: '부가세는 어떻게 처리하나요?',
      a: '이 양식은 결제 금액을 그대로 합산합니다. 부가세 공제·불공제 구분이 필요하면 비고에 표시하거나 회계 프로그램에서 처리하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국세청 — 적격증빙 안내',
      href: 'https://www.nts.go.kr/',
    },
    {
      label: '국세청 홈택스',
      href: 'https://www.hometax.go.kr/',
    },
  ],
  related: [
    { label: '지출결의서 양식', href: '/forms/expense-report/' },
    { label: '지출품의서 양식', href: '/forms/expense-request/' },
    { label: '출장비 정산서 양식', href: '/forms/travel-expense/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
