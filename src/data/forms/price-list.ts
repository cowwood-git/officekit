import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const items: RepeatGroup = {
  id: 'items',
  label: '품목별 단가',
  help: '품목과 규격, 단위, 단가를 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 3,
  maxRows: 40,
  addLabel: '+ 품목 추가',
  required: true,
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
      width: 2.4,
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
      id: 'unitPrice',
      label: '단가',
      type: 'money',
      required: true,
      placeholder: '0',
      width: 1.5,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '할인 조건 등',
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
    placeholder: 'PL-20261117-001',
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
    id: 'supplierContact',
    label: '연락처',
    type: 'text',
    group: '공급자',
    placeholder: '전화 또는 이메일',
    maxLength: 60,
    span: 1,
  },
  {
    id: 'validFrom',
    label: '적용 시작일',
    type: 'date',
    group: '적용 조건',
    required: true,
  },
  {
    id: 'validTo',
    label: '적용 종료일',
    type: 'date',
    group: '적용 조건',
    help: '기한 없이 적용할 때는 비워 두어도 됩니다.',
  },
  {
    id: 'vatMode',
    label: '부가세',
    type: 'select',
    group: '적용 조건',
    options: ['부가세 별도', '부가세 포함', '부가세 없음'],
    defaultValue: '부가세 별도',
    required: true,
  },
  {
    id: 'itemCount',
    label: '품목 수',
    type: 'computed',
    group: '적용 조건',
    help: '등록한 품목 줄 수입니다.',
  },
  {
    id: 'terms',
    label: '거래 조건',
    type: 'textarea',
    group: '조건',
    placeholder: '결제 기한, 배송비, 최소 주문 수량, 유효 조건 등',
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '조건',
    placeholder: '단가 변동 안내, 담당자 연락처 등',
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['공급자', '구매 담당자'],
    defaultValue: JSON.stringify([
      { label: '공급자', enabled: true },
      { label: '구매 담당자', enabled: false },
    ]),
    maxSelected: 2,
    editable: true,
    help: '확인자 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.name ?? '').trim());

const tableColumns = [
  { label: 'No', width: 10, align: 'center' },
  { label: '품목', width: 56 },
  { label: '규격', width: 38 },
  { label: '단위', width: 16, align: 'center' },
  { label: '단가', width: 30, align: 'right' },
  { label: '비고', width: 24 },
] as const;

export const priceList: FormTemplate = {
  slug: 'price-list',
  title: '단가표',
  family: 'sales',
  category: 'money',
  description:
    '거래 품목의 규격과 단가를 한 장에 정리하는 단가표를 브라우저에서 작성하고 A4 PDF로 저장합니다. 적용 기간과 부가세 기준을 함께 적을 수 있습니다.',
  keywords: ['단가표', '단가표 양식', '거래처 단가표', '품목 단가표', '단가표 PDF', '공급 단가표'],
  updated: '2026-11-17',
  docPrefix: 'PL',
  companyParty: 'supplier',
  lead: '거래처에 제공할 품목별 단가를 정리하는 표입니다. 규격·단위·단가를 한눈에 보여 주고, 적용 기간과 부가세 기준을 함께 남길 수 있습니다.',
  useCases: [
    '거래처에 품목별 공급 단가를 안내할 때',
    '연간·반기 단가를 정리해 공유할 때',
    '견적서 작성의 기준 단가를 만들 때',
    '단가 인상·변경 내역을 문서로 남길 때',
  ],
  howTo: [
    '문서 번호와 작성일을 확인합니다.',
    '공급자 정보와 적용 시작일·종료일, 부가세 기준을 적습니다.',
    '품목·규격·단위·단가를 한 줄씩 입력합니다.',
    '거래 조건과 비고를 적고 PDF로 내려받아 거래처에 보냅니다.',
  ],
  notes: [
    '이 단가표는 참고용입니다. 실제 거래 단가는 계약·발주 내용에 따라 달라질 수 있습니다.',
    '부가세 별도·포함 여부를 반드시 표시해 금액 오해가 없도록 하세요.',
    '단가를 바꾸면 적용 시작일을 새로 적고 이전 단가표와 구분해 보관하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '단가표',
      docNoField: 'docNo',
      dateField: 'date',
      logo: true,
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
        { label: '연락처', field: 'supplierContact' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '주소', field: 'supplierAddress' }] },
    { kind: 'section', title: '적용 조건' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '적용 시작일', field: 'validFrom' },
        { label: '적용 종료일', field: 'validTo' },
        { label: '부가세', field: 'vatMode' },
      ],
    },
    { kind: 'section', title: '품목별 단가' },
    {
      kind: 'table',
      columns: tableColumns,
      rows: (_values, rows) =>
        itemsOf(rows).map((row, index) => [
          String(index + 1),
          (row.name ?? '').trim(),
          (row.spec ?? '').trim(),
          (row.unit ?? '').trim(),
          parseAmount(row.unitPrice ?? '') > 0 ? formatWon(parseAmount(row.unitPrice ?? '')) : '',
          (row.note ?? '').trim(),
        ]),
      minRows: 4,
      blankMinRows: 6,
    },
    { kind: 'section', title: '거래 조건' },
    { kind: 'text', field: 'terms', minLines: 3 },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['공급자', '구매 담당자'],
      rolesField: 'approvalRoles',
      bottom: true,
      seal: true,
    },
  ],
  compute: (_values, rows) => {
    const count = itemsOf(rows).length;
    return { itemCount: count > 0 ? `${count}개 품목` : '' };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) {
      errors.push('단가를 적을 품목을 한 줄 이상 입력하세요.');
    }
    if (list.some((row) => parseAmount(row.unitPrice ?? '') <= 0)) {
      errors.push('품목별 단가를 입력하세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'PL-20261117-001',
    date: '2026-11-17',
    supplierCompany: '옷깃',
    supplierBiz: '123-45-67891',
    supplierCeo: '홍길동',
    supplierAddress: '서울시 강남구 테헤란로 1',
    supplierContact: '010-1234-5678',
    validFrom: '2026-12-01',
    validTo: '2027-11-30',
    vatMode: '부가세 별도',
    terms:
      '결제: 납품 후 14일 이내 계좌 이체\n배송: 10만 원 이상 무료, 미만 시 3,000원\n최소 주문: 1박스',
    note: '원자재 가격 변동 시 30일 전에 안내합니다.',
  },
  sampleRows: {
    items: [
      { name: 'A4 복사용지', spec: '80g 2,500매', unit: '박스', unitPrice: '28000' },
      { name: '토너 카트리지', spec: '검정', unit: '개', unitPrice: '82000' },
      { name: '볼펜', spec: '0.7mm', unit: '박스', unitPrice: '6000' },
      { name: '포스트잇', spec: '76×76mm', unit: '묶음', unitPrice: '3500' },
    ],
  },
  faq: [
    {
      q: '단가표와 견적서는 무엇이 다른가요?',
      a: '단가표는 거래 품목의 기준 단가를 미리 정해 공유하는 문서이고, 견적서는 특정 거래의 품목·수량·금액을 제안하는 문서입니다. 단가표를 기준으로 견적서를 작성하면 편합니다.',
    },
    {
      q: '부가세는 어떻게 표시하나요?',
      a: '부가세 별도·포함·없음 중 하나를 고르면 문서에 그대로 표시됩니다. 실제 청구 금액과 같은 기준으로 적어 주세요.',
    },
    {
      q: '적용 종료일을 비워도 되나요?',
      a: '네. 기한을 정하지 않은 단가표라면 종료일을 비워 두면 됩니다. 다만 단가 변경 시 새 문서를 만들어 이전 문서와 구분하세요.',
    },
    {
      q: '품목이 많으면 한 장에 다 들어가나요?',
      a: '표가 길어지면 다음 페이지로 자동으로 넘어갑니다. 품목이 아주 많으면 분기·품목군별로 나누어 여러 장으로 만드는 것도 좋습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '공정거래위원회 — 계약·거래 안내',
      href: 'https://www.ftc.go.kr/',
    },
    {
      label: '국세청 — 부가가치세 안내',
      href: 'https://www.nts.go.kr/',
    },
  ],
  related: [
    { label: '견적서 양식', href: '/forms/quote/' },
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: '발주서 양식', href: '/forms/purchase-order/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
