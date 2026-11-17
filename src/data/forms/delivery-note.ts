import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

type PartyPrefix = 'supplier' | 'buyer';

const partyFields = (prefix: PartyPrefix, label: string): FormField[] => [
  {
    id: `${prefix}Company`,
    label: `${label} 상호`,
    type: 'text',
    group: label,
    required: true,
    placeholder: prefix === 'supplier' ? '예: 옷깃' : '예: 거래처',
    maxLength: 60,
    span: 2,
  },
  {
    id: `${prefix}Biz`,
    label: '사업자번호',
    type: 'text',
    group: label,
    placeholder: '000-00-00000',
    maxLength: 20,
  },
  {
    id: `${prefix}Ceo`,
    label: '대표자',
    type: 'text',
    group: label,
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: `${prefix}Address`,
    label: '주소',
    type: 'text',
    group: label,
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: `${prefix}Contact`,
    label: '연락처',
    type: 'text',
    group: label,
    placeholder: '전화 또는 이메일',
    maxLength: 60,
  },
];

const partyLines = (values: Record<string, string>, prefix: PartyPrefix, role: string): string[] =>
  [
    values[`${prefix}Company`] ?? '',
    values[`${prefix}Biz`] ? `사업자 ${values[`${prefix}Biz`]}` : '',
    values[`${prefix}Ceo`] ? `${role} ${values[`${prefix}Ceo`]}` : '',
    values[`${prefix}Address`] ?? '',
    values[`${prefix}Contact`] ?? '',
  ].filter((line) => line.trim() !== '');

const items: RepeatGroup = {
  id: 'items',
  label: '납품 품목',
  group: '납품 정보',
  help: '품목·규격·수량·단위를 적습니다. 수량 합계가 자동으로 계산되고 빈 줄은 문서에 나오지 않습니다.',
  minRows: 3,
  maxRows: 30,
  addLabel: '+ 품목 추가',
  required: true,
  summaryField: 'totalQuantityLabel',
  summaryLabel: '총 수량',
  columns: [
    {
      id: 'name',
      label: '품목',
      type: 'text',
      required: true,
      placeholder: '예: A4 복사용지',
      maxLength: 60,
      width: 3,
    },
    {
      id: 'spec',
      label: '규격',
      type: 'text',
      placeholder: '예: 80g 2,500매',
      maxLength: 60,
      width: 2.2,
    },
    {
      id: 'quantity',
      label: '수량',
      type: 'number',
      required: true,
      placeholder: '1',
      width: 1,
    },
    {
      id: 'unit',
      label: '단위',
      type: 'text',
      placeholder: '박스',
      maxLength: 10,
      width: 0.9,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '파손 주의 등',
      maxLength: 40,
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
    placeholder: 'DN-20261117-001',
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
  ...partyFields('supplier', '공급자'),
  ...partyFields('buyer', '납품처'),
  {
    id: 'deliveryDate',
    label: '납품일',
    type: 'date',
    group: '납품 정보',
    required: true,
  },
  {
    id: 'orderNo',
    label: '주문 번호',
    type: 'text',
    group: '납품 정보',
    placeholder: 'PO-20261110-001',
    maxLength: 40,
  },
  {
    id: 'deliveryContact',
    label: '인수 담당자',
    type: 'text',
    group: '납품 정보',
    placeholder: '김담당 과장',
    maxLength: 40,
  },
  {
    id: 'place',
    label: '납품 장소',
    type: 'text',
    group: '납품 정보',
    placeholder: '부산시 해운대구 1 물류센터',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'method',
    label: '납품 방법',
    type: 'select',
    group: '납품 정보',
    options: ['직접 배송', '택배', '방문 수령', '기타'],
    defaultValue: '직접 배송',
  },
  {
    id: 'totalQuantityLabel',
    label: '총 수량',
    type: 'computed',
    group: '납품 정보',
    help: '품목별 수량의 합계입니다.',
  },
  {
    id: 'note',
    label: '특이사항',
    type: 'textarea',
    group: '비고',
    placeholder: '납품 시 확인할 사항, 파손·누락 여부 등',
    maxLength: 400,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['공급자', '인수자'],
    defaultValue: JSON.stringify([
      { label: '공급자', enabled: true },
      { label: '인수자', enabled: true },
    ]),
    maxSelected: 2,
    editable: true,
    help: '인수자 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.name ?? '').trim());

const quantityOf = (row: Record<string, string>): number => {
  const quantity = Number((row.quantity ?? '').replace(/,/g, ''));
  return Number.isFinite(quantity) ? quantity : 0;
};

const tableColumns = [
  { label: 'No', width: 10, align: 'center' },
  { label: '품목', width: 58 },
  { label: '규격', width: 40 },
  { label: '수량', width: 16, align: 'right' },
  { label: '단위', width: 16, align: 'center' },
  { label: '비고', width: 34 },
] as const;

const itemRows = (rows: FormRows): readonly (readonly string[])[] =>
  itemsOf(rows).map((row, index) => [
    String(index + 1),
    (row.name ?? '').trim(),
    (row.spec ?? '').trim(),
    row.quantity ? String(quantityOf(row)) : '',
    (row.unit ?? '').trim(),
    (row.note ?? '').trim(),
  ]);

export const deliveryNote: FormTemplate = {
  slug: 'delivery-note',
  title: '납품서',
  family: 'sales',
  category: 'money',
  description:
    '납품한 품목과 수량을 확인받는 납품서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 금액 없이 품목·규격·수량만 정리해 인수 확인에 씁니다.',
  keywords: ['납품서', '납품서 양식', '납품 확인서', '물품 인수 확인', '납품서 PDF', '납품 명세'],
  updated: '2026-11-17',
  docPrefix: 'DN',
  companyParty: 'supplier',
  lead: '물품을 납품할 때 품목과 수량을 적어 인수자에게 확인받는 문서입니다. 금액 없이 수량만 정리해 거래명세서와 함께 쓰기 좋습니다.',
  useCases: [
    '물품을 납품하고 인수 확인을 받을 때',
    '택배·배송으로 보낸 물품의 도착을 확인할 때',
    '납품 수량이 주문과 같은지 대조할 때',
    '거래명세서·세금계산서와 함께 증빙을 갖출 때',
  ],
  howTo: [
    '문서 번호와 작성일을 확인합니다.',
    '공급자와 납품처 정보를 입력합니다. 회사 정보는 다음에 다시 쓸 수 있습니다.',
    '납품일·주문 번호·납품 장소와 담당자를 적습니다.',
    '품목·규격·수량·단위를 입력하고 PDF로 내려받아 인수자에게 확인받습니다.',
  ],
  notes: [
    '이 양식은 수량 확인용 납품서입니다. 금액·부가세가 필요한 거래는 거래명세서를 함께 쓰세요.',
    '인수자 확인을 받은 납품서는 납품·클레임 대응의 증빙이 됩니다. 사본을 보관하세요.',
    '수량과 단위는 주문서와 같은 기준으로 적어 혼동이 없도록 합니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '납품서',
      docNoField: 'docNo',
      dateField: 'date',
      logo: true,
    },
    {
      kind: 'parties',
      left: {
        label: '공급자',
        lines: (values) => partyLines(values, 'supplier', '대표'),
      },
      right: {
        label: '납품처',
        lines: (values) => partyLines(values, 'buyer', '담당'),
      },
    },
    { kind: 'section', title: '납품 정보' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '납품일', field: 'deliveryDate' },
        { label: '주문 번호', field: 'orderNo' },
        { label: '인수 담당자', field: 'deliveryContact' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '납품 장소', field: 'place' },
        { label: '납품 방법', field: 'method' },
      ],
    },
    { kind: 'section', title: '납품 품목' },
    {
      kind: 'table',
      columns: tableColumns,
      rows: (_values, rows) => itemRows(rows),
      minRows: 4,
    },
    {
      kind: 'totals',
      rows: [{ label: '총 수량', field: 'totalQuantityLabel', strong: true }],
      width: 60,
    },
    { kind: 'section', title: '특이사항' },
    { kind: 'text', field: 'note', minLines: 3 },
    {
      kind: 'signature',
      roles: ['공급자', '인수자'],
      rolesField: 'approvalRoles',
      bottom: true,
      seal: true,
    },
  ],
  compute: (_values, rows) => {
    const total = itemsOf(rows).reduce((sum, row) => sum + quantityOf(row), 0);
    return { totalQuantityLabel: total > 0 ? `${total.toLocaleString('ko-KR')}개` : '' };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) {
      errors.push('납품할 품목을 한 줄 이상 입력하세요.');
    }
    if (list.some((row) => quantityOf(row) <= 0)) {
      errors.push('수량은 1 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'DN-20261117-001',
    date: '2026-11-17',
    supplierCompany: '옷깃',
    supplierBiz: '123-45-67891',
    supplierCeo: '홍길동',
    supplierAddress: '서울시 강남구 테헤란로 1',
    supplierContact: '010-1234-5678',
    buyerCompany: '거래처 주식회사',
    buyerBiz: '220-81-62517',
    buyerCeo: '김담당',
    buyerAddress: '부산시 해운대구 1',
    buyerContact: '051-123-4567',
    deliveryDate: '2026-11-17',
    orderNo: 'PO-20261110-001',
    deliveryContact: '김담당 과장',
    place: '부산시 해운대구 1 물류센터',
    method: '직접 배송',
    note: '박스 2개로 나누어 납품합니다. 인수 시 외관 파손 여부를 확인해 주세요.',
  },
  sampleRows: {
    items: [
      { name: 'A4 복사용지', spec: '80g 2,500매', quantity: '10', unit: '박스' },
      { name: '토너 카트리지', spec: '검정', quantity: '2', unit: '개' },
      { name: '볼펜', spec: '0.7mm', quantity: '5', unit: '박스' },
    ],
  },
  faq: [
    {
      q: '납품서와 거래명세서는 무엇이 다른가요?',
      a: '납품서는 물품을 인수했다는 사실과 수량을 확인하는 문서이고, 거래명세서는 품목별 금액과 부가세까지 정리합니다. 납품서는 수량 확인용, 거래명세서는 정산용으로 함께 쓰면 좋습니다.',
    },
    {
      q: '금액도 적을 수 있나요?',
      a: '이 양식은 수량 확인에 집중해 금액 열을 두지 않았습니다. 금액·부가세가 필요하면 거래명세서나 납품확인서 양식을 사용하세요.',
    },
    {
      q: '인수자 확인은 어떻게 받나요?',
      a: 'PDF로 출력해 인수자에게 서명·날인을 받거나, PDF 서명 도구로 전자 서명을 넣을 수 있습니다.',
    },
    {
      q: '총 수량은 어떻게 계산되나요?',
      a: '품목별 수량을 그대로 더합니다. 단위가 다르면(박스·개) 숫자만 합산되므로 단위를 통일하거나 비고에 따로 적으세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국세청 홈택스 — 전자세금계산서 안내',
      href: 'https://www.hometax.go.kr/',
    },
    {
      label: '공정거래위원회 — 계약·거래 안내',
      href: 'https://www.ftc.go.kr/',
    },
  ],
  related: [
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: '납품확인서 양식', href: '/forms/delivery-confirmation/' },
    { label: '발주서 양식', href: '/forms/purchase-order/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
