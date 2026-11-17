import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '요청 품목',
  help: '견적을 받을 품목과 수량을 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 3,
  maxRows: 30,
  addLabel: '+ 품목 추가',
  required: true,
  group: '요청 기관',
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
      placeholder: '납기·대체품 등',
      maxLength: 60,
      width: 2,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '요청 번호',
    type: 'text',
    group: '문서',
    placeholder: 'RFQ-20261117-001',
    help: '요청일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '요청일',
    type: 'date',
    group: '문서',
    defaultToday: true,
    required: true,
  },
  {
    id: 'title',
    label: '요청 건명',
    type: 'text',
    group: '요청 정보',
    placeholder: '예: 2026년 사무용품 정기 구매 견적 요청',
    required: true,
    maxLength: 100,
    span: 2,
  },
  {
    id: 'dueDate',
    label: '회신 기한',
    type: 'date',
    group: '요청 정보',
    required: true,
    help: '견적서를 받을 마감일입니다.',
  },
  {
    id: 'deliveryDate',
    label: '납기 희망일',
    type: 'date',
    group: '요청 정보',
  },
  {
    id: 'deliveryPlace',
    label: '납품 장소',
    type: 'text',
    group: '요청 정보',
    placeholder: '예: 서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'paymentTerms',
    label: '결제 조건',
    type: 'select',
    group: '요청 정보',
    options: ['현금', '계좌이체', '카드', '협의'],
    defaultValue: '계좌이체',
  },
  {
    id: 'company',
    label: '요청 기관',
    type: 'text',
    group: '요청 기관',
    placeholder: '옷깃 주식회사',
    required: true,
    maxLength: 60,
    span: 2,
  },
  {
    id: 'ceo',
    label: '대표자',
    type: 'text',
    group: '요청 기관',
    placeholder: '박대표',
    maxLength: 30,
  },
  {
    id: 'bizNo',
    label: '사업자번호',
    type: 'text',
    group: '요청 기관',
    placeholder: '000-00-00000',
    maxLength: 20,
  },
  {
    id: 'contact',
    label: '담당자',
    type: 'text',
    group: '요청 기관',
    placeholder: '김담당 · 02-123-4567',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'requestNote',
    label: '요청 사항',
    type: 'textarea',
    group: '요청 사항',
    placeholder: '견적서에 포함할 항목, 세금계산서 발행, 샘플 요청 등',
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'totalQuantityLabel',
    label: '총 수량',
    type: 'computed',
    group: '요청 정보',
    help: '요청 품목의 수량 합계입니다.',
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['담당자', '팀장', '대표'],
    defaultValue: JSON.stringify([
      { label: '담당자', enabled: true },
      { label: '팀장', enabled: true },
      { label: '대표', enabled: false },
    ]),
    required: true,
    maxSelected: 3,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.name ?? '').trim());

const quantityOf = (row: Record<string, string>): number => {
  const quantity = Number((row.quantity ?? '').replace(/,/g, ''));
  return Number.isFinite(quantity) ? quantity : 0;
};

export const rfq: FormTemplate = {
  slug: 'rfq',
  title: '견적 요청서',
  family: 'sales',
  category: 'money',
  description:
    '구매할 품목과 조건을 정리해 여러 거래처에 견적을 요청하는 견적 요청서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 품목 표와 납기·결제 조건을 한 장에 담습니다.',
  keywords: [
    '견적 요청서',
    '견적 요청서 양식',
    '견적 의뢰서',
    '구매 견적 요청',
    'RFQ 양식',
    '견적 요청서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'RFQ',
  lead: '구매할 품목과 수량, 납기·결제 조건을 정리해 거래처에 견적을 요청하는 문서입니다. 같은 조건으로 여러 업체에 보내 비교하기 좋습니다.',
  useCases: [
    '여러 거래처에 같은 조건으로 견적을 요청할 때',
    '구매 품목과 수량을 명확히 전달할 때',
    '납기·결제 조건을 미리 정해 비교할 때',
    '견적 비교표를 만들기 전에 요청 내용을 남길 때',
  ],
  howTo: [
    '요청일과 회신 기한, 요청 건명을 적습니다.',
    '납기 희망일과 납품 장소, 결제 조건을 정합니다.',
    '요청 기관과 담당자 정보를 입력합니다.',
    '품목·규격·수량을 적고 PDF로 내려받아 발송합니다.',
  ],
  notes: [
    '견적서에 포함해야 할 항목(운송비·부가세·설치비)을 요청 사항에 명확히 적으세요.',
    '회신 기한을 충분히 주고, 급한 경우 담당자에게 별도로 알리세요.',
    '받은 견적은 견적 비교표로 정리하면 조건을 한눈에 비교할 수 있습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '견적 요청서',
      docNoField: 'docNo',
      dateField: 'date',
      docNoLabel: '요청번호',
      dateLabel: '요청일',
    },
    { kind: 'section', title: '요청 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '요청 건명', field: 'title' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '회신 기한', field: 'dueDate' },
        { label: '납기 희망일', field: 'deliveryDate' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '납품 장소', field: 'deliveryPlace' },
        { label: '결제 조건', field: 'paymentTerms' },
      ],
    },
    { kind: 'section', title: '요청 기관' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '상호', field: 'company' },
        { label: '대표자', field: 'ceo' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '사업자번호', field: 'bizNo' },
        { label: '담당자', field: 'contact' },
      ],
    },
    { kind: 'section', title: '요청 품목' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '품목', width: 54 },
        { label: '규격', width: 38 },
        { label: '수량', width: 16, align: 'right' },
        { label: '단위', width: 16, align: 'center' },
        { label: '비고', width: 38 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row, index) => [
          String(index + 1),
          (row.name ?? '').trim(),
          (row.spec ?? '').trim(),
          row.quantity ? String(quantityOf(row)) : '',
          (row.unit ?? '').trim(),
          (row.note ?? '').trim(),
        ]),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [{ label: '총 수량', field: 'totalQuantityLabel', strong: true }],
      width: 60,
    },
    { kind: 'section', title: '요청 사항' },
    { kind: 'text', field: 'requestNote', minLines: 3 },
    {
      kind: 'signature',
      roles: ['담당자', '팀장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const total = itemsOf(rows).reduce((sum, row) => sum + quantityOf(row), 0);
    return { totalQuantityLabel: total > 0 ? `${total.toLocaleString('ko-KR')}개` : '' };
  },
  validate: (values, rows) => {
    const errors: string[] = [];
    if (values.dueDate && values.date && values.dueDate < values.date) {
      errors.push('회신 기한은 요청일보다 빠를 수 없습니다.');
    }
    const list = itemsOf(rows);
    if (list.length === 0) errors.push('요청할 품목을 한 줄 이상 입력하세요.');
    if (list.some((row) => quantityOf(row) <= 0)) {
      errors.push('수량은 1 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'RFQ-20261117-001',
    date: '2026-11-17',
    title: '2026년 사무용품 정기 구매 견적 요청',
    dueDate: '2026-11-24',
    deliveryDate: '2026-12-05',
    deliveryPlace: '서울시 강남구 테헤란로 1, 본사 1층 물류창고',
    paymentTerms: '계좌이체',
    company: '옷깃 주식회사',
    ceo: '박대표',
    bizNo: '123-45-67891',
    contact: '김담당 · 02-123-4567',
    requestNote:
      '운송비와 부가세를 포함한 총액으로 견적해 주세요. 납품 시 거래명세서와 세금계산서를 함께 보내 주시고, 복사용지는 샘플 1박스를 먼저 보내 주세요.',
  },
  sampleRows: {
    items: [
      {
        name: 'A4 복사용지',
        spec: '80g 2,500매',
        quantity: '10',
        unit: '박스',
        note: '샘플 요청',
      },
      { name: '토너 카트리지', spec: '검정', quantity: '2', unit: '개', note: '' },
      { name: '볼펜', spec: '0.7mm', quantity: '5', unit: '박스', note: '검정·파랑' },
    ],
  },
  faq: [
    {
      q: '견적 요청서와 견적서는 무엇이 다른가요?',
      a: '견적 요청서는 구매자가 “이 조건으로 견적을 주세요”라고 보내는 문서이고, 견적서는 공급자가 가격과 조건을 제시하는 문서입니다.',
    },
    {
      q: '여러 업체에 보낼 수 있나요?',
      a: '네. 같은 요청서를 여러 업체에 보내고, 받은 견적은 견적 비교표로 정리하면 조건을 쉽게 비교할 수 있습니다.',
    },
    {
      q: '견적서에 꼭 들어가야 할 항목은?',
      a: '품목·규격·수량, 단가와 총액, 부가세 포함 여부, 납기, 결제 조건, 유효 기간을 요청하세요. 운송·설치비도 별도로 적게 하세요.',
    },
    {
      q: '회신 기한은 얼마나 줘야 하나요?',
      a: '품목과 수량에 따라 다르지만 보통 3~7일을 줍니다. 급한 경우 담당자에게 먼저 연락하고 기한을 명확히 알리세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '조달청 — 나라장터 견적 요청 안내',
      href: 'https://www.g2b.go.kr/',
    },
    {
      label: '중소벤처기업부 — 구매·조달 지원 안내',
      href: 'https://www.mss.go.kr/',
    },
  ],
  related: [
    { label: '견적 비교표 양식', href: '/forms/quote-comparison/' },
    { label: '검수확인서 양식', href: '/forms/inspection/' },
    { label: '거래처 평가표 양식', href: '/forms/vendor-evaluation/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
