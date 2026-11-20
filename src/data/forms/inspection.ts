import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '검수 품목',
  help: '납품받은 품목의 주문 수량과 검수 수량, 판정을 적습니다.',
  minRows: 3,
  maxRows: 30,
  addLabel: '+ 품목 추가',
  required: true,
  group: '검수 정보',
  summaryField: 'totalQuantityLabel',
  summaryLabel: '검수 수량',
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
    {
      id: 'ordered',
      label: '주문 수량',
      type: 'number',
      placeholder: '1',
      width: 1,
    },
    {
      id: 'inspected',
      label: '검수 수량',
      type: 'number',
      required: true,
      placeholder: '1',
      width: 1,
    },
    {
      id: 'result',
      label: '판정',
      type: 'select',
      options: ['합격', '불합격', '수량 부족', '파손'],
      width: 1.4,
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
    label: '검수 번호',
    type: 'text',
    group: '문서',
    placeholder: 'INS-20261117-001',
    help: '검수일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '검수일',
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
    id: 'orderNo',
    label: '주문 번호',
    type: 'text',
    group: '검수 정보',
    placeholder: 'PO-20261110-001',
    maxLength: 40,
  },
  {
    id: 'deliveryDate',
    label: '납품일',
    type: 'date',
    group: '검수 정보',
  },
  {
    id: 'inspector',
    label: '검수자',
    type: 'text',
    group: '검수 정보',
    required: true,
    placeholder: '김검수',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '검수 정보',
    placeholder: '구매팀',
    maxLength: 40,
  },
  {
    id: 'result',
    label: '종합 판정',
    type: 'select',
    group: '검수 정보',
    options: ['합격', '조건부 합격', '불합격'],
    defaultValue: '합격',
    required: true,
  },
  {
    id: 'itemCountLabel',
    label: '검수 품목 수',
    type: 'computed',
    group: '검수 정보',
    help: '아래 표에 입력한 품목 수입니다.',
  },
  {
    id: 'totalQuantityLabel',
    label: '검수 수량 합계',
    type: 'computed',
    group: '검수 정보',
    help: '품목별 검수 수량의 합계입니다.',
  },
  {
    id: 'note',
    label: '검수 의견',
    type: 'textarea',
    group: '검수 의견',
    placeholder: '수량 차이·파손·교환 요청 등 특이 사항',
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['검수자', '확인자'],
    defaultValue: JSON.stringify([
      { label: '검수자', enabled: true },
      { label: '확인자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.name ?? '').trim());

const numberOrZero = (value: string | undefined): number => {
  const number = Number((value ?? '').replace(/,/g, ''));
  return Number.isFinite(number) ? number : 0;
};

export const inspection: FormTemplate = {
  slug: 'inspection',
  title: '검수확인서',
  family: 'sales',
  category: 'money',
  description:
    '납품받은 품목의 수량과 상태를 검수하고 합격·불합격 판정을 남기는 검수확인서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '검수확인서',
    '검수확인서 양식',
    '납품 검수 확인서',
    '물품 검수 결과',
    '구매 검수서',
    '검수확인서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'INS',
  lead: '납품받은 물품이 주문대로 도착했는지 수량과 상태를 확인하는 검수확인서입니다. 품목별 판정과 검수 의견, 확인 서명을 한 장에 남깁니다.',
  useCases: [
    '납품 물품의 수량과 상태를 확인할 때',
    '검수 결과를 거래처에 공식 통보할 때',
    '대금 지급 전 검수 증빙을 갖출 때',
    '파손·수량 부족에 대한 교환·반품 근거를 남길 때',
  ],
  howTo: [
    '검수일과 공급자, 주문 번호를 확인합니다.',
    '검수자와 부서, 종합 판정을 적습니다.',
    '품목별 주문 수량·검수 수량과 판정을 입력합니다.',
    '검수 의견을 적고 PDF로 내려받아 확인 서명을 받습니다.',
  ],
  notes: [
    '검수는 납품 직후 가능한 한 빨리 하고, 파손·수량 차이는 사진으로 남기세요.',
    '불합격·조건부 합격은 사유와 후속 조치(교환·반품·할인)를 검수 의견에 구체적으로 적으세요.',
    '이 문서는 수량·상태 확인용입니다. 금액·세금계산서는 거래명세서로 확인하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '검수확인서',
      docNoField: 'docNo',
      dateField: 'date',
      docNoLabel: '검수번호',
      dateLabel: '검수일',
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
    { kind: 'section', title: '검수 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '주문 번호', field: 'orderNo' },
        { label: '납품일', field: 'deliveryDate' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '검수자', field: 'inspector' },
        { label: '부서', field: 'department' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '종합 판정', field: 'result' },
        { label: '검수 품목 수', field: 'itemCountLabel' },
      ],
    },
    { kind: 'section', title: '검수 품목' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '품목', width: 50 },
        { label: '규격', width: 34 },
        { label: '주문', width: 14, align: 'right' },
        { label: '검수', width: 14, align: 'right' },
        { label: '판정', width: 28 },
        { label: '비고', width: 36 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row, index) => [
          String(index + 1),
          (row.name ?? '').trim(),
          (row.spec ?? '').trim(),
          row.ordered ? String(numberOrZero(row.ordered)) : '',
          row.inspected ? String(numberOrZero(row.inspected)) : '',
          (row.result ?? '').trim(),
          (row.note ?? '').trim(),
        ]),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [{ label: '검수 수량', field: 'totalQuantityLabel', strong: true }],
      width: 64,
    },
    { kind: 'section', title: '검수 의견' },
    { kind: 'text', field: 'note', minLines: 3 },
    {
      kind: 'signature',
      roles: ['검수자', '확인자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = itemsOf(rows);
    const total = list.reduce((sum, row) => sum + numberOrZero(row.inspected), 0);
    return {
      itemCountLabel: list.length > 0 ? `${list.length}개` : '',
      totalQuantityLabel: total > 0 ? `${total.toLocaleString('ko-KR')}개` : '',
    };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) errors.push('검수할 품목을 한 줄 이상 입력하세요.');
    if (list.some((row) => numberOrZero(row.inspected) <= 0)) {
      errors.push('검수 수량은 1 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'INS-20261117-001',
    date: '2026-11-17',
    supplierCompany: '옷깃',
    supplierBiz: '123-45-67891',
    orderNo: 'PO-20261110-001',
    deliveryDate: '2026-11-16',
    inspector: '김검수',
    department: '구매팀',
    result: '조건부 합격',
    note: '복사용지 1박스 수량 부족분은 2026-11-20까지 추가 납품받기로 했습니다. 토너 카트리지 외관 이상 없음.',
  },
  sampleRows: {
    items: [
      {
        name: 'A4 복사용지',
        spec: '80g 2,500매',
        ordered: '10',
        inspected: '9',
        result: '수량 부족',
        note: '1박스 부족',
      },
      {
        name: '토너 카트리지',
        spec: '검정',
        ordered: '2',
        inspected: '2',
        result: '합격',
        note: '',
      },
      {
        name: '볼펜',
        spec: '0.7mm',
        ordered: '5',
        inspected: '5',
        result: '합격',
        note: '검정·파랑',
      },
    ],
  },
  faq: [
    {
      q: '검수확인서와 물품인수증은 무엇이 다른가요?',
      a: '물품인수증은 물품을 받았다는 사실을 확인하는 문서이고, 검수확인서는 수량·상태가 주문 조건에 맞는지 판정하는 문서입니다. 검수가 필요한 거래에서는 검수확인서를 함께 쓰세요.',
    },
    {
      q: '검수 수량이 주문 수량보다 적으면 어떻게 하나요?',
      a: '해당 품목의 판정을 “수량 부족”으로 고르고, 부족 수량과 추가 납품 일정을 검수 의견에 적습니다.',
    },
    {
      q: '조건부 합격은 어떤 경우인가요?',
      a: '일부 수량 부족이나 경미한 외관 문제가 있지만 교환·추가 납품으로 해결할 수 있을 때 사용합니다. 조건과 기한을 반드시 적으세요.',
    },
    {
      q: '대금 지급 전에 꼭 필요한가요?',
      a: '회사 규정에 따라 다르지만, 검수 결과를 남겨 두면 대금 지급·반품·클레임의 근거가 됩니다.',
    },
  ],
  sources: [
    {
      label: '조달청 — 물품 검수·대금 지급 안내',
      href: 'https://www.g2b.go.kr/',
    },
  ],
  related: [
    { label: '물품인수증 양식', href: '/forms/goods-receipt/' },
    { label: '견적 요청서 양식', href: '/forms/rfq/' },
    { label: '하자보수 요청서 양식', href: '/forms/defect-request/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
