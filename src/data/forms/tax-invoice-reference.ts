import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { computeTotals, formatWon, itemAmount, parseAmount } from '@/lib/quote';

const items: RepeatGroup = {
  id: 'items',
  label: '거래 품목',
  help: '품목·규격·수량·단가를 적습니다. 공급가액·부가세·합계가 자동으로 계산됩니다.',
  minRows: 2,
  maxRows: 40,
  addLabel: '+ 품목 추가',
  required: true,
  group: '거래 정보',
  columns: [
    {
      id: 'name',
      label: '품목',
      type: 'text',
      required: true,
      placeholder: '예: A4 복사용지',
      maxLength: 60,
      width: 2.8,
    },
    {
      id: 'spec',
      label: '규격',
      type: 'text',
      placeholder: '예: 80g 2,500매',
      maxLength: 60,
      width: 2,
    },
    { id: 'quantity', label: '수량', type: 'number', required: true, placeholder: '1', width: 1 },
    { id: 'unitPrice', label: '단가', type: 'money', placeholder: '0', width: 1.5 },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'TI-20261117-001',
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
    id: 'supplierCompany',
    label: '공급자 상호',
    type: 'text',
    group: '공급자',
    required: true,
    placeholder: '예: 옷깃',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'supplierBiz',
    label: '사업자번호',
    type: 'text',
    group: '공급자',
    placeholder: '000-00-00000',
    maxLength: 20,
  },
  {
    id: 'supplierCeo',
    label: '대표자',
    type: 'text',
    group: '공급자',
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: 'supplierAddress',
    label: '주소',
    type: 'text',
    group: '공급자',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'buyerCompany',
    label: '공급받는자 상호',
    type: 'text',
    group: '공급받는자',
    required: true,
    placeholder: '예: 거래처 주식회사',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'buyerBiz',
    label: '사업자번호',
    type: 'text',
    group: '공급받는자',
    placeholder: '000-00-00000',
    maxLength: 20,
  },
  {
    id: 'buyerCeo',
    label: '대표자',
    type: 'text',
    group: '공급받는자',
    placeholder: '김대표',
    maxLength: 30,
  },
  {
    id: 'buyerAddress',
    label: '주소',
    type: 'text',
    group: '공급받는자',
    placeholder: '부산시 해운대구 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'tradeDate',
    label: '거래일',
    type: 'date',
    group: '거래 정보',
    required: true,
  },
  {
    id: 'supplyLabel',
    label: '공급가액',
    type: 'computed',
    group: '거래 정보',
    help: '품목 금액의 합계입니다.',
  },
  {
    id: 'vatLabel',
    label: '부가세',
    type: 'computed',
    group: '거래 정보',
    help: '공급가액의 10%입니다.',
  },
  {
    id: 'totalLabel',
    label: '합계',
    type: 'computed',
    group: '거래 정보',
    help: '공급가액과 부가세를 합한 금액입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '거래 조건, 참고 사항',
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명',
    type: 'roles',
    group: '서명',
    options: ['공급자'],
    defaultValue: JSON.stringify([{ label: '공급자', enabled: true }]),
    maxSelected: 1,
    editable: true,
    help: '공급자 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows) =>
  (rows.items ?? [])
    .filter((row) => (row.name ?? '').trim())
    .map((row) => ({
      name: (row.name ?? '').trim(),
      quantity: Number(row.quantity ?? 0),
      unitPrice: parseAmount(row.unitPrice ?? ''),
    }));

export const taxInvoiceReference: FormTemplate = {
  slug: 'tax-invoice-reference',
  title: '세금계산서(참고용)',
  family: 'finance',
  category: 'money',
  description:
    '거래 품목과 공급가액·부가세를 정리하는 참고용 세금계산서 양식입니다. 실제 세금계산서 발행은 홈택스나 회계 프로그램을 이용해야 합니다.',
  keywords: [
    '세금계산서 양식',
    '세금계산서 참고용',
    '거래 세금계산서',
    '부가세 계산서',
    '세금계산서 PDF',
    '세금계산서 미리보기',
  ],
  updated: '2026-11-17',
  docPrefix: 'TI',
  lead: '거래 품목과 공급가액·부가세를 미리 정리해 보는 참고용 세금계산서입니다. 실제 발행은 국세청 홈택스나 회계 프로그램에서 진행하세요.',
  useCases: [
    '거래처와 세금계산서 금액을 사전에 확인할 때',
    '품목·수량·단가를 정리해 발행 담당자에게 전달할 때',
    '부가세 포함 금액을 미리 계산할 때',
    '내부 정산 자료로 거래 내역을 남길 때',
  ],
  howTo: [
    '문서 번호와 작성일, 공급자·공급받는자 정보를 확인합니다.',
    '거래일과 품목·수량·단가를 입력합니다.',
    '공급가액·부가세·합계를 확인합니다.',
    'PDF로 내려받아 내부 확인용으로 사용하고, 실제 발행은 홈택스에서 진행합니다.',
  ],
  notes: [
    '이 문서는 참고용이며 세금계산서로 발행할 수 없습니다. 실제 발행은 국세청 홈택스 또는 회계 프로그램을 이용하세요.',
    '사업자번호·상호·주소는 사업자등록증과 일치해야 합니다.',
    '부가세는 공급가액의 10%로 계산한 참고 금액입니다. 세율·과세 구분은 거래 내용에 따라 달라질 수 있습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '세금계산서 (참고용)',
      docNoField: 'docNo',
      dateField: 'date',
    },
    {
      kind: 'notice',
      text: '본 문서는 참고용입니다. 세금계산서로 발행할 수 없으며, 실제 발행은 국세청 홈택스 또는 회계 프로그램을 이용하세요.',
    },
    {
      kind: 'parties',
      left: {
        label: '공급자',
        lines: (values) =>
          [
            values.supplierCompany ?? '',
            values.supplierBiz ? `사업자 ${values.supplierBiz}` : '',
            values.supplierCeo ? `대표 ${values.supplierCeo}` : '',
            values.supplierAddress ?? '',
          ].filter(Boolean),
      },
      right: {
        label: '공급받는자',
        lines: (values) =>
          [
            values.buyerCompany ?? '',
            values.buyerBiz ? `사업자 ${values.buyerBiz}` : '',
            values.buyerCeo ? `대표 ${values.buyerCeo}` : '',
            values.buyerAddress ?? '',
          ].filter(Boolean),
      },
    },
    { kind: 'section', title: '거래 정보' },
    { kind: 'kv', columns: 2, rows: [{ label: '거래일', field: 'tradeDate' }] },
    { kind: 'section', title: '거래 품목' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '품목', width: 54 },
        { label: '규격', width: 36 },
        { label: '수량', width: 14, align: 'right' },
        { label: '단가', width: 30, align: 'right' },
        { label: '금액', width: 30, align: 'right' },
      ],
      rows: (_values, rows) =>
        (rows.items ?? [])
          .filter((row) => (row.name ?? '').trim())
          .map((row, index) => {
            const item = {
              name: row.name ?? '',
              quantity: Number(row.quantity ?? 0),
              unitPrice: parseAmount(row.unitPrice ?? ''),
            };
            const amount = itemAmount(item);
            return [
              String(index + 1),
              item.name,
              (row.spec ?? '').trim(),
              String(item.quantity),
              item.unitPrice > 0 ? formatWon(item.unitPrice) : '',
              amount > 0 ? formatWon(amount) : '',
            ];
          }),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [
        { label: '공급가액', field: 'supplyLabel' },
        { label: '부가세', field: 'vatLabel' },
        { label: '합계', field: 'totalLabel', strong: true },
      ],
      width: 84,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['공급자'],
      rolesField: 'approvalRoles',
      bottom: true,
      seal: true,
    },
  ],
  compute: (_values, rows) => {
    const list = itemsOf(rows);
    const totals = computeTotals(list, 'excluded');
    return {
      supplyLabel: list.length > 0 ? formatWon(totals.supply) : '',
      vatLabel: list.length > 0 ? formatWon(totals.vat) : '',
      totalLabel: list.length > 0 ? formatWon(totals.total) : '',
    };
  },
  validate: (_values, rows) =>
    itemsOf(rows).length === 0 ? ['거래 품목을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'TI-20261117-001',
    date: '2026-11-17',
    supplierCompany: '옷깃',
    supplierBiz: '123-45-67891',
    supplierCeo: '홍길동',
    supplierAddress: '서울시 강남구 테헤란로 1',
    buyerCompany: '거래처 주식회사',
    buyerBiz: '220-81-62517',
    buyerCeo: '김대표',
    buyerAddress: '부산시 해운대구 1',
    tradeDate: '2026-11-17',
    note: '11월 정기 납품분. 실제 세금계산서는 홈택스에서 발행합니다.',
  },
  sampleRows: {
    items: [
      { name: 'A4 복사용지', spec: '80g 2,500매', quantity: '10', unitPrice: '28000' },
      { name: '토너 카트리지', spec: '검정', quantity: '2', unitPrice: '82000' },
    ],
  },
  faq: [
    {
      q: '이 양식으로 세금계산서를 발행할 수 있나요?',
      a: '아니요. 참고용 계산서입니다. 실제 발행은 국세청 홈택스 또는 회계 프로그램에서 사업자 인증을 거쳐 진행해야 합니다.',
    },
    {
      q: '부가세는 어떻게 계산되나요?',
      a: '공급가액의 10%로 계산합니다. 실제 세율·과세 구분은 거래 내용과 세법에 따라 달라질 수 있습니다.',
    },
    {
      q: '사업자번호가 맞는지 어떻게 확인하나요?',
      a: '사업자등록증과 대조하고, 국세청 홈택스의 사업자 상태 조회로 확인할 수 있습니다.',
    },
    {
      q: '거래명세서와 무엇이 다른가요?',
      a: '거래명세서는 거래 품목과 수량·금액을 확인하는 문서이고, 세금계산서는 부가세 신고·증빙을 위한 세무 문서입니다. 이 양식은 세금계산서의 참고용입니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국세청 홈택스 — 전자세금계산서',
      href: 'https://www.hometax.go.kr/',
    },
    {
      label: '국세청 — 부가가치세 안내',
      href: 'https://www.nts.go.kr/',
    },
  ],
  related: [
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: '견적서 양식', href: '/forms/quote/' },
    { label: '미수금내역 양식', href: '/forms/outstanding-balance/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
