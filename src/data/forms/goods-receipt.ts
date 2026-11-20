import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '인수 품목',
  group: '인수 정보',
  help: '납품받은 품목과 수량, 상태를 적습니다. 총 수량이 자동으로 계산됩니다.',
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
      id: 'status',
      label: '상태',
      type: 'select',
      options: ['이상 없음', '파손', '수량 부족', '교환 필요'],
      width: 1.6,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '확인 사항',
      maxLength: 40,
      width: 1.8,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'GR-20261117-001',
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
    id: 'orderNo',
    label: '주문 번호',
    type: 'text',
    group: '인수 정보',
    placeholder: 'PO-20261110-001',
    maxLength: 40,
  },
  {
    id: 'deliveryDate',
    label: '납품일',
    type: 'date',
    group: '인수 정보',
    required: true,
  },
  {
    id: 'name',
    label: '인수자',
    type: 'text',
    group: '인수 정보',
    required: true,
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '인수 정보',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'place',
    label: '인수 장소',
    type: 'text',
    group: '인수 정보',
    placeholder: '본사 1층 물류창고',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'totalQuantityLabel',
    label: '총 수량',
    type: 'computed',
    group: '인수 정보',
    help: '품목별 수량의 합계입니다.',
  },
  {
    id: 'note',
    label: '확인 사항',
    type: 'textarea',
    group: '확인',
    placeholder: '파손·수량 차이, 교환 요청, 보관 위치 등',
    maxLength: 400,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['인수자', '확인자'],
    defaultValue: JSON.stringify([
      { label: '인수자', enabled: true },
      { label: '확인자', enabled: true },
    ]),
    maxSelected: 2,
    editable: true,
    help: '인수자와 확인자 이름을 직접 고칠 수 있습니다.',
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
  { label: '품목', width: 54 },
  { label: '규격', width: 38 },
  { label: '수량', width: 16, align: 'right' },
  { label: '단위', width: 16, align: 'center' },
  { label: '상태', width: 40 },
] as const;

export const goodsReceipt: FormTemplate = {
  slug: 'goods-receipt',
  title: '물품인수증',
  family: 'sales',
  category: 'money',
  description:
    '납품받은 물품의 품목·수량·상태를 확인하고 인수 사실을 남기는 물품인수증을 A4 PDF로 만듭니다. 파손·수량 차이는 비고에 적어 두면 반품·교환 요청 근거가 됩니다.',
  keywords: [
    '물품인수증',
    '물품 인수증 양식',
    '인수확인서',
    '납품 인수 확인',
    '물품인수증 PDF',
    '구매 물품 확인',
  ],
  updated: '2026-11-17',
  docPrefix: 'GR',
  lead: '물품을 받은 뒤 수량과 상태를 확인해 인수 사실을 남기는 문서입니다. 품목별 상태를 적고 총 수량을 자동으로 계산합니다.',
  useCases: [
    '납품받은 물품의 수량과 상태를 확인할 때',
    '파손·수량 부족을 납품 업체에 알릴 때',
    '구매 담당자에게 인수 결과를 보고할 때',
    '거래명세서·세금계산서와 함께 증빙을 갖출 때',
  ],
  howTo: [
    '문서 번호와 작성일, 공급자 정보를 확인합니다.',
    '주문 번호와 납품일, 인수자와 인수 장소를 적습니다.',
    '품목·규격·수량·단위와 상태를 한 줄씩 입력합니다.',
    '확인 사항을 적고 PDF로 내려받아 서명·날인합니다.',
  ],
  notes: [
    '인수 후 발견한 파손·수량 차이는 가능한 한 빨리 공급자에게 알리고 사진을 함께 보관하세요.',
    '이 양식은 수량·상태 확인용입니다. 금액·세금계산서는 거래명세서와 세금계산서로 확인하세요.',
    '서명·날인한 인수증은 클레임과 재고 확인의 증빙이 됩니다.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '물품인수증',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '공급자' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '상호', field: 'supplierCompany' },
        { label: '사업자번호', field: 'supplierBiz' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '대표자', field: 'supplierCeo' },
        { label: '주문 번호', field: 'orderNo' },
      ],
    },
    { kind: 'section', title: '인수 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '납품일', field: 'deliveryDate' },
        { label: '인수자', field: 'name' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '부서', field: 'department' },
        { label: '인수 장소', field: 'place' },
      ],
    },
    { kind: 'section', title: '인수 품목' },
    {
      kind: 'table',
      columns: tableColumns,
      rows: (_values, rows) =>
        itemsOf(rows).map((row, index) => [
          String(index + 1),
          (row.name ?? '').trim(),
          (row.spec ?? '').trim(),
          row.quantity ? String(quantityOf(row)) : '',
          (row.unit ?? '').trim(),
          (row.status ?? '').trim(),
        ]),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [{ label: '총 수량', field: 'totalQuantityLabel', strong: true }],
      width: 60,
    },
    { kind: 'section', title: '확인 사항' },
    { kind: 'text', field: 'note', minLines: 3 },
    {
      kind: 'signature',
      roles: ['인수자', '확인자'],
      rolesField: 'approvalRoles',
      bottom: true,
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
      errors.push('인수할 품목을 한 줄 이상 입력하세요.');
    }
    if (list.some((row) => quantityOf(row) <= 0)) {
      errors.push('수량은 1 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'GR-20261117-001',
    date: '2026-11-17',
    supplierCompany: '옷깃',
    supplierBiz: '123-45-67891',
    supplierCeo: '홍길동',
    orderNo: 'PO-20261110-001',
    deliveryDate: '2026-11-17',
    name: '김옷깃',
    department: '경영지원팀',
    place: '본사 1층 물류창고',
    note: '외관 파손 없이 인수했습니다. 복사용지는 창고 A-2 선반에 보관합니다.',
  },
  sampleRows: {
    items: [
      {
        name: 'A4 복사용지',
        spec: '80g 2,500매',
        quantity: '10',
        unit: '박스',
        status: '이상 없음',
      },
      {
        name: '토너 카트리지',
        spec: '검정',
        quantity: '2',
        unit: '개',
        status: '이상 없음',
      },
      {
        name: '볼펜',
        spec: '0.7mm',
        quantity: '5',
        unit: '박스',
        status: '수량 부족',
        note: '1박스 부족',
      },
    ],
  },
  faq: [
    {
      q: '물품인수증과 납품확인서는 무엇이 다른가요?',
      a: '납품확인서는 공급자가 납품 사실을 확인받는 문서이고, 물품인수증은 구매자가 받은 물품의 수량·상태를 확인하는 문서입니다. 거래 관계에 따라 둘 중 하나 또는 둘 다 쓸 수 있습니다.',
    },
    {
      q: '파손된 물품이 있으면 어떻게 적나요?',
      a: '해당 품목의 상태를 “파손”으로 고르고 확인 사항에 수량과 상태를 구체적으로 적습니다. 사진을 함께 보관하면 클레임에 도움이 됩니다.',
    },
    {
      q: '총 수량은 어떻게 계산되나요?',
      a: '품목별 수량을 더해 표시합니다. 박스·개처럼 단위가 섞이면 숫자만 합산되므로, 단위별 합계가 필요하면 확인 사항에 따로 적으세요.',
    },
    {
      q: '금액도 확인할 수 있나요?',
      a: '이 양식은 수량과 상태 확인에 집중합니다. 금액·부가세는 거래명세서나 세금계산서로 확인하세요.',
    },
  ],
  sources: [
    {
      label: '공정거래위원회 — 계약·거래 안내',
      href: 'https://www.ftc.go.kr/',
    },
    {
      label: '국세청 홈택스 — 전자세금계산서 안내',
      href: 'https://www.hometax.go.kr/',
    },
  ],
  related: [
    { label: '납품서 양식', href: '/forms/delivery-note/' },
    { label: '납품확인서 양식', href: '/forms/delivery-confirmation/' },
    { label: '발주서 양식', href: '/forms/purchase-order/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
