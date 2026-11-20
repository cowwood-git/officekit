import { formatDateDot } from '@/lib/doc/format';
import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const items: RepeatGroup = {
  id: 'items',
  label: '미수금 내역',
  help: '거래일·계산서 번호·청구 금액·입금 금액을 적습니다. 미수금과 합계가 자동으로 계산됩니다.',
  minRows: 2,
  maxRows: 40,
  addLabel: '+ 거래 추가',
  required: true,
  group: '거래처 정보',
  summaryField: 'outstandingLabel',
  summaryLabel: '미수금',
  columns: [
    {
      id: 'issuedAt',
      label: '거래일',
      type: 'date',
      width: 1.3,
    },
    {
      id: 'invoiceNo',
      label: '계산서 번호',
      type: 'text',
      placeholder: '예: 2026-11-001',
      maxLength: 40,
      width: 2,
    },
    {
      id: 'billed',
      label: '청구 금액',
      type: 'money',
      required: true,
      placeholder: '0',
      width: 1.5,
    },
    {
      id: 'paid',
      label: '입금 금액',
      type: 'money',
      placeholder: '0',
      width: 1.5,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '부분 입금 등',
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
    placeholder: 'OB-20261117-001',
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
    id: 'client',
    label: '거래처',
    type: 'text',
    group: '거래처 정보',
    required: true,
    placeholder: '예: 거래처 주식회사',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'manager',
    label: '담당자',
    type: 'text',
    group: '거래처 정보',
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'baseDate',
    label: '기준일',
    type: 'date',
    group: '거래처 정보',
    required: true,
  },
  {
    id: 'countLabel',
    label: '거래 건수',
    type: 'computed',
    group: '거래처 정보',
    help: '입력한 거래 줄 수입니다.',
  },
  {
    id: 'billedLabel',
    label: '청구 합계',
    type: 'computed',
    group: '거래처 정보',
    help: '청구 금액의 합계입니다.',
  },
  {
    id: 'paidLabel',
    label: '입금 합계',
    type: 'computed',
    group: '거래처 정보',
    help: '입금 금액의 합계입니다.',
  },
  {
    id: 'outstandingLabel',
    label: '미수금',
    type: 'computed',
    group: '거래처 정보',
    help: '청구 합계에서 입금 합계를 뺀 금액입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '입금 예정일, 독촉 이력, 분쟁 사항 등',
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

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.invoiceNo ?? '').trim() || (row.billed ?? '').trim());

const outstandingOf = (row: Record<string, string>): number =>
  parseAmount(row.billed ?? '') - parseAmount(row.paid ?? '');

export const outstandingBalance: FormTemplate = {
  slug: 'outstanding-balance',
  title: '미수금내역',
  family: 'finance',
  category: 'money',
  description:
    '거래처별 청구 금액과 입금 금액을 대조해 미수금을 정리하는 미수금내역을 브라우저에서 작성하고 A4 PDF로 저장합니다. 합계가 자동 계산됩니다.',
  keywords: [
    '미수금내역',
    '미수금내역 양식',
    '미수금 관리',
    '외상 매출금',
    '청구 입금 대조',
    '미수금내역 PDF',
  ],
  updated: '2026-11-21',
  docPrefix: 'AR',
  lead: '거래처의 청구·입금 내역을 대조해 남은 미수금을 정리하는 표입니다. 청구 합계와 입금 합계, 미수금을 자동으로 계산합니다.',
  useCases: [
    '거래처별 미수금을 월말에 정리할 때',
    '세금계산서와 입금 내역을 대조할 때',
    '입금 독촉·정산 일정을 계획할 때',
    '회계·감사 자료로 미수금 현황을 남길 때',
  ],
  howTo: [
    '문서 번호와 작성일, 거래처를 확인합니다.',
    '기준일을 적고 거래일·계산서 번호·청구·입금 금액을 입력합니다.',
    '청구 합계·입금 합계·미수금을 확인합니다.',
    '비고에 입금 예정일을 적고 PDF로 내려받습니다.',
  ],
  notes: [
    '금액은 세금계산서·통장 거래내역과 대조해 확인하세요. 이 문서만으로 채권이 확정되지는 않습니다.',
    '부분 입금은 입금 금액과 비고에 따로 적습니다.',
    '장기 미수금은 독촉·내용증명 등 회사의 채권 관리 절차를 따르세요.',
    '상인이 판 상품 대금과 공사 대금은 3년(민법 제163조), 그 밖의 상거래 채권은 5년(상법 제64조) 안에 청구하지 않으면 소멸시효가 완성됩니다. 거래처에서 잔액 확인서를 받거나(승인) 소송·지급명령·가압류를 하면 시효가 중단됩니다(민법 제168조).',
    '시효가 완성됐거나 거래처 파산 등으로 받을 수 없게 된 채권은 요건을 갖춰 대손금으로 비용 처리할 수 있습니다(법인세법 시행령 제19조의2).',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '미수금내역',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '거래처 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '거래처', field: 'client' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '담당자', field: 'manager' },
        { label: '기준일', field: 'baseDate' },
      ],
    },
    { kind: 'kv', columns: 2, rows: [{ label: '거래 건수', field: 'countLabel' }] },
    { kind: 'section', title: '미수금 내역' },
    {
      kind: 'table',
      columns: [
        { label: '거래일', width: 24 },
        { label: '계산서 번호', width: 40 },
        { label: '청구 금액', width: 30, align: 'right' },
        { label: '입금 금액', width: 30, align: 'right' },
        { label: '미수금', width: 26, align: 'right' },
        { label: '비고', width: 24 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row) => [
          row.issuedAt ? formatDateDot(row.issuedAt) : '',
          (row.invoiceNo ?? '').trim(),
          parseAmount(row.billed ?? '') > 0 ? formatWon(parseAmount(row.billed ?? '')) : '',
          parseAmount(row.paid ?? '') > 0 ? formatWon(parseAmount(row.paid ?? '')) : '',
          outstandingOf(row) !== 0 ? formatWon(outstandingOf(row)) : '',
          (row.note ?? '').trim(),
        ]),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [
        { label: '청구 합계', field: 'billedLabel' },
        { label: '입금 합계', field: 'paidLabel' },
        { label: '미수금 합계', field: 'outstandingLabel', strong: true },
      ],
      width: 84,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = itemsOf(rows);
    const billed = list.reduce((sum, row) => sum + parseAmount(row.billed ?? ''), 0);
    const paid = list.reduce((sum, row) => sum + parseAmount(row.paid ?? ''), 0);
    return {
      countLabel: list.length > 0 ? `${list.length}건` : '',
      billedLabel: billed > 0 ? formatWon(billed) : '',
      paidLabel: paid > 0 ? formatWon(paid) : '',
      outstandingLabel: billed > 0 ? formatWon(billed - paid) : '',
    };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) errors.push('미수금 내역을 한 줄 이상 입력하세요.');
    if (list.some((row) => outstandingOf(row) < 0)) {
      errors.push('입금 금액이 청구 금액보다 클 수 없습니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'OB-20261117-001',
    date: '2026-11-17',
    client: '거래처 주식회사',
    manager: '김옷깃',
    baseDate: '2026-11-17',
    note: '10월분은 11월 25일 입금 예정이며, 9월분은 담당자와 분할 입금을 협의 중입니다.',
  },
  sampleRows: {
    items: [
      {
        issuedAt: '2026-09-30',
        invoiceNo: '2026-09-001',
        billed: '3300000',
        paid: '2000000',
        note: '분할 입금',
      },
      {
        issuedAt: '2026-10-31',
        invoiceNo: '2026-10-001',
        billed: '4180000',
        paid: '0',
        note: '11/25 예정',
      },
      {
        issuedAt: '2026-11-10',
        invoiceNo: '2026-11-001',
        billed: '1250000',
        paid: '1250000',
        note: '완료',
      },
    ],
  },
  faq: [
    {
      q: '미수금내역은 어떻게 계산되나요?',
      a: '청구 금액에서 입금 금액을 뺀 값이 미수금입니다. 청구·입금 합계와 전체 미수금도 자동으로 계산됩니다.',
    },
    {
      q: '부분 입금은 어떻게 적나요?',
      a: '입금 금액에 실제 받은 금액을 적고 비고에 “부분 입금”이나 잔금 예정일을 남깁니다.',
    },
    {
      q: '세금계산서와 금액이 다르면 어떻게 하나요?',
      a: '세금계산서·통장 내역을 먼저 대조해 차이 원인을 확인하세요. 이 문서에는 확인된 금액을 적고 차이는 비고에 남깁니다.',
    },
    {
      q: '미수금이 오래되면 어떻게 하나요?',
      a: '회사의 채권 관리 절차에 따라 독촉·내용증명 등을 진행하세요. 이 양식은 현황 정리용입니다.',
    },
  ],
  sources: [
    {
      label: '국세청 — 부가가치세 신고 안내',
      href: 'https://www.nts.go.kr/',
    },
    {
      label: '국세청 홈택스',
      href: 'https://www.hometax.go.kr/',
    },
  ],
  related: [
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: '입금확인서 양식', href: '/forms/payment-confirmation/' },
    { label: '발주서 양식', href: '/forms/purchase-order/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
