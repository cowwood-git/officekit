import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import {
  computeTotals,
  formatWon,
  itemAmount,
  parseAmount,
  type QuoteItem,
  type VatMode,
} from '@/lib/quote';

const VAT_OPTIONS = ['부가세 별도', '부가세 포함', '부가세 없음'] as const;

const toVatMode = (value: string | undefined): VatMode => {
  if (value === '부가세 포함') return 'included';
  if (value === '부가세 없음') return 'none';
  return 'excluded';
};

const items: RepeatGroup = {
  id: 'items',
  label: '공급 품목',
  help: '품목·규격·수량·단가를 적습니다. 금액과 합계가 자동으로 계산됩니다.',
  minRows: 2,
  maxRows: 40,
  addLabel: '+ 품목 추가',
  required: true,
  group: '계약 개요',
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
    placeholder: 'SU-20261117-001',
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
    group: '당사자',
    required: true,
    placeholder: '예: 옷깃',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'supplierCeo',
    label: '공급자 대표자',
    type: 'text',
    group: '당사자',
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: 'supplierAddress',
    label: '공급자 주소',
    type: 'text',
    group: '당사자',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'buyerCompany',
    label: '구매자 상호',
    type: 'text',
    group: '당사자',
    required: true,
    placeholder: '예: 거래처 주식회사',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'buyerCeo',
    label: '구매자 대표자',
    type: 'text',
    group: '당사자',
    placeholder: '김대표',
    maxLength: 30,
  },
  {
    id: 'buyerAddress',
    label: '구매자 주소',
    type: 'text',
    group: '당사자',
    placeholder: '부산시 해운대구 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'periodFrom',
    label: '시작일',
    type: 'date',
    group: '계약 개요',
    required: true,
  },
  {
    id: 'periodTo',
    label: '종료일',
    type: 'date',
    group: '계약 개요',
    required: true,
  },
  {
    id: 'vatMode',
    label: '부가세',
    type: 'select',
    group: '계약 개요',
    options: VAT_OPTIONS,
    defaultValue: '부가세 별도',
  },
  {
    id: 'supplyLabel',
    label: '공급가액',
    type: 'computed',
    group: '공급 조건',
    help: '품목 금액의 합계입니다.',
  },
  {
    id: 'vatLabel',
    label: '부가세',
    type: 'computed',
    group: '공급 조건',
    help: '부가세 기준에 따라 계산합니다.',
  },
  {
    id: 'totalLabel',
    label: '합계',
    type: 'computed',
    group: '공급 조건',
    help: '공급가액과 부가세를 합한 금액입니다.',
  },
  {
    id: 'paymentTerms',
    label: '공급 조건',
    type: 'textarea',
    group: '공급 조건',
    placeholder: '대금 지급, 납품 장소·기한, 검수·반품 방법 등',
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명 당사자',
    type: 'roles',
    group: '서명',
    options: ['공급자', '구매자'],
    defaultValue: JSON.stringify([
      { label: '공급자', enabled: true },
      { label: '구매자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '서명란에 표시할 당사자 이름입니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows): QuoteItem[] =>
  (rows.items ?? [])
    .filter((row) => (row.name ?? '').trim())
    .map((row) => ({
      name: (row.name ?? '').trim(),
      quantity: Number(row.quantity ?? 0),
      unitPrice: parseAmount(row.unitPrice ?? ''),
    }));

export const supplyContract: FormTemplate = {
  slug: 'supply-contract',
  title: '물품공급계약서',
  family: 'sales',
  category: 'money',
  description:
    '물품을 정기적으로 공급하는 거래에서 품목·수량·단가·납품·대금 조건을 정리하는 물품공급계약서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '물품공급계약서',
    '물품공급계약서 양식',
    '공급계약서',
    '납품 계약서',
    '물품 공급 계약',
    '물품공급계약서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'SU',
  lead: '물품을 지속적으로 공급하는 거래의 기본 조건을 정하는 계약서입니다. 품목별 수량·단가와 납품·대금 지급 조건을 한 장에 정리합니다.',
  useCases: [
    '거래처와 정기 납품 계약을 맺을 때',
    '품목·단가를 정해 두고 반복 공급할 때',
    '납품 기한과 대금 지급 조건을 정할 때',
    '연간 공급 계약의 기준 문서를 만들 때',
  ],
  howTo: [
    '문서 번호와 작성일, 공급자·구매자 정보를 확인합니다.',
    '계약 기간과 공급 품목·수량·단가를 입력합니다.',
    '부가세 기준과 공급가액·합계를 확인합니다.',
    '대금 지급·납품 조건을 적고 PDF로 내려받아 서명합니다.',
  ],
  notes: [
    '이 양식은 참고용 표준안입니다. 계약의 효력·범위는 거래 내용과 준거법에 따라 달라질 수 있으므로 서명 전 법률 검토를 권장합니다.',
    '품목·단가·수량은 실제 공급 조건과 일치해야 하며, 단가 변동 시 변경 합의서를 작성하세요.',
    '검수 기준과 불량·반품 처리 방법을 납품 조건에 명시하면 분쟁을 줄일 수 있습니다.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '물품공급계약서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    {
      kind: 'paragraph',
      text: '공급자와 구매자는 아래와 같이 물품공급계약을 체결한다.',
      align: 'center',
      before: 2,
      after: 2,
    },
    {
      kind: 'parties',
      left: {
        label: '공급자',
        lines: (values) =>
          [
            values.supplierCompany ?? '',
            values.supplierCeo ? `대표 ${values.supplierCeo}` : '',
            values.supplierAddress ?? '',
          ].filter(Boolean),
      },
      right: {
        label: '구매자',
        lines: (values) =>
          [
            values.buyerCompany ?? '',
            values.buyerCeo ? `대표 ${values.buyerCeo}` : '',
            values.buyerAddress ?? '',
          ].filter(Boolean),
      },
    },
    { kind: 'section', title: '계약 개요' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '시작일', field: 'periodFrom' },
        { label: '종료일', field: 'periodTo' },
        { label: '부가세', field: 'vatMode' },
      ],
    },
    { kind: 'section', title: '공급 품목' },
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
    { kind: 'section', title: '공급 조건' },
    { kind: 'text', field: 'paymentTerms', minLines: 3 },
    {
      kind: 'notice',
      text: '본 양식은 참고용입니다. 서명 전 계약 내용과 법률 검토를 확인하세요.',
    },
    {
      kind: 'signature',
      roles: ['공급자', '구매자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values, rows) => {
    const list = itemsOf(rows);
    const totals = computeTotals(list, toVatMode(values.vatMode));
    return {
      supplyLabel: list.length > 0 ? formatWon(totals.supply) : '',
      vatLabel: list.length > 0 ? formatWon(totals.vat) : '',
      totalLabel: list.length > 0 ? formatWon(totals.total) : '',
    };
  },
  validate: (values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) errors.push('공급 품목을 한 줄 이상 입력하세요.');
    if (list.some((item) => item.quantity <= 0)) {
      errors.push('수량은 1 이상이어야 합니다.');
    }
    if (values.periodFrom && values.periodTo && values.periodTo < values.periodFrom) {
      errors.push('종료일은 시작일보다 빠를 수 없습니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'SU-20261117-001',
    date: '2026-11-17',
    supplierCompany: '옷깃',
    supplierCeo: '홍길동',
    supplierAddress: '서울시 강남구 테헤란로 1',
    buyerCompany: '거래처 주식회사',
    buyerCeo: '김대표',
    buyerAddress: '부산시 해운대구 1',
    periodFrom: '2026-12-01',
    periodTo: '2027-11-30',
    vatMode: '부가세 별도',
    paymentTerms:
      '대금: 매월 말일까지 세금계산서 발행 후 14일 이내 계좌 이체.\n납품: 주문 후 3영업일 이내 납품. 파손·수량 부족 시 7일 이내 교환.',
  },
  sampleRows: {
    items: [
      { name: 'A4 복사용지', spec: '80g 2,500매', quantity: '100', unitPrice: '28000' },
      { name: '토너 카트리지', spec: '검정', quantity: '20', unitPrice: '82000' },
      { name: '볼펜', spec: '0.7mm', quantity: '50', unitPrice: '6000' },
    ],
  },
  faq: [
    {
      q: '물품공급계약서는 언제 쓰나요?',
      a: '정기적으로 물품을 공급할 때 품목·단가·납품·대금 조건을 미리 정해 두는 계약서입니다. 단발성 거래는 발주서·거래명세서로 충분할 수 있습니다.',
    },
    {
      q: '단가가 바뀌면 어떻게 하나요?',
      a: '계약 변경 합의서로 단가와 적용일을 정하고 양쪽이 서명하세요. 기존 계약서와 함께 보관합니다.',
    },
    {
      q: '부가세는 어떻게 계산되나요?',
      a: '부가세 별도는 공급가액에 10%를 더하고, 포함은 입력 금액에서 공급가액과 부가세를 역산합니다.',
    },
    {
      q: '검수·반품 조건도 넣어야 하나요?',
      a: '납품 조건에 검수 기준과 불량·반품 처리 기한을 적으면 분쟁을 줄일 수 있습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국가법령정보센터 — 민법',
      href: 'https://www.law.go.kr/',
    },
    {
      label: '공정거래위원회 — 계약·거래 안내',
      href: 'https://www.ftc.go.kr/',
    },
  ],
  related: [
    { label: '발주서 양식', href: '/forms/purchase-order/' },
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: '계약 변경 합의서 양식', href: '/forms/contract-amendment/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
