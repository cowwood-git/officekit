import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '신청 품목',
  group: '신청 정보',
  help: '품명·규격·수량을 한 줄씩 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 3,
  maxRows: 20,
  addLabel: '+ 품목 추가',
  required: true,
  summaryField: 'totalCount',
  summaryLabel: '총 수량',
  columns: [
    {
      id: 'name',
      label: '품명',
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
      placeholder: '80g, 2,500매',
      maxLength: 40,
      width: 2,
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
      id: 'purpose',
      label: '용도·비고',
      type: 'text',
      placeholder: '부서 공용',
      maxLength: 60,
      width: 2,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '기본 정보',
    placeholder: 'SR-20261116-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '작성일',
    type: 'date',
    group: '기본 정보',
    defaultToday: true,
    required: true,
  },
  {
    id: 'name',
    label: '성명',
    type: 'text',
    group: '신청자',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '신청자',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'position',
    label: '직위',
    type: 'text',
    group: '신청자',
    placeholder: '대리',
    maxLength: 30,
  },
  {
    id: 'neededBy',
    label: '필요일',
    type: 'date',
    group: '신청 정보',
    help: '구매·배송 일정을 고려해 여유 있게 적습니다.',
  },
  {
    id: 'purpose',
    label: '신청 용도',
    type: 'select',
    group: '신청 정보',
    options: ['부서 공용', '행사·회의', '신규 입사자', '교체·보수', '기타'],
    defaultValue: '부서 공용',
    span: 2,
  },
  {
    id: 'totalCount',
    label: '총 수량',
    type: 'computed',
    group: '신청 정보',
    help: '품목 수량의 합계입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '납품 장소, 구매 희망처, 예산 등',
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['신청인', '팀장', '부서장', '본부장', '대표'],
    defaultValue: JSON.stringify([
      { label: '신청인', enabled: true },
      { label: '팀장', enabled: false },
      { label: '부서장', enabled: true },
      { label: '본부장', enabled: false },
      { label: '대표', enabled: true },
    ]),
    required: true,
    maxSelected: 5,
    editable: true,
    help: '최대 5개까지 선택할 수 있고, 이름을 직접 고칠 수 있습니다. 선택한 순서대로 문서에 표시됩니다.',
    span: 3,
  },
];

const itemRows = (rows: FormRows): readonly (readonly string[])[] => {
  const list = (rows.items ?? []).filter(
    (row) =>
      (row.name ?? '').trim() ||
      (row.spec ?? '').trim() ||
      (row.quantity ?? '').trim() ||
      (row.purpose ?? '').trim(),
  );
  return list.map((row) => [
    (row.name ?? '').trim(),
    (row.spec ?? '').trim(),
    (row.quantity ?? '').trim(),
    (row.purpose ?? '').trim(),
  ]);
};

export const suppliesRequest: FormTemplate = {
  slug: 'supplies-request',
  title: '비품 신청서',
  family: 'hr',
  category: 'people',
  description:
    '사무용품·비품이 필요할 때 품명과 수량을 정리해 신청하는 비품 신청서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '비품 신청서',
    '비품 신청서 양식',
    '사무용품 신청서',
    '소모품 신청서',
    '비품 구매 요청서',
    '비품 신청 PDF',
  ],
  updated: '2026-11-16',
  docPrefix: 'SR',
  lead: '필요한 비품을 품명·규격·수량으로 정리해 신청하는 비품 신청서입니다. 총 수량이 자동으로 계산되고, 결재선까지 넣어 바로 올릴 수 있습니다.',
  useCases: [
    '부서 공용 사무용품을 보충할 때',
    '행사·회의 준비물을 한 번에 신청할 때',
    '신규 입사자의 장비·비품을 요청할 때',
    '낡은 비품 교체를 결재받을 때',
  ],
  howTo: [
    '문서 번호와 작성일, 신청자 정보를 확인합니다.',
    '필요일과 신청 용도를 고릅니다.',
    '신청 품목에 품명·규격·수량·용도를 한 줄씩 적습니다. 총 수량은 자동으로 계산됩니다.',
    '결재선을 고른 뒤 PDF로 내려받습니다.',
  ],
  notes: [
    '이 양식은 신청서입니다. 구매·계약·예산 집행은 회사의 구매 규정과 예산 절차를 따르세요.',
    '가격 비교가 필요하면 발주서나 견적서와 함께 결재를 올리는 것이 좋습니다.',
    '수량과 규격을 구체적으로 적으면 구매 담당자가 확인하기 쉽습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '비품 신청서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '신청자' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '성명', field: 'name' },
        { label: '부서', field: 'department' },
        { label: '직위', field: 'position' },
      ],
    },
    { kind: 'section', title: '신청 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '필요일', field: 'neededBy' },
        { label: '신청 용도', field: 'purpose' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '총 수량', field: 'totalCount' }] },
    { kind: 'section', title: '신청 품목' },
    {
      kind: 'table',
      columns: [
        { label: '품명', width: 72 },
        { label: '규격', width: 44 },
        { label: '수량', width: 16, align: 'right' },
        { label: '용도·비고', width: 42 },
      ],
      rows: (_values, rows) => itemRows(rows),
      minRows: 3,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['신청인', '부서장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const total = (rows.items ?? []).reduce((sum, row) => {
      const value = Number((row.quantity ?? '').replace(/,/g, ''));
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    return { totalCount: total > 0 ? `${total}개` : '' };
  },
  validate: (_values, rows) => {
    const errors: string[] = [];
    const filled = (rows.items ?? []).filter(
      (row) => (row.name ?? '').trim() || (row.quantity ?? '').trim(),
    );
    if (filled.length === 0) {
      errors.push('신청 품목을 한 줄 이상 입력하세요.');
    }
    if (filled.some((row) => Number((row.quantity ?? '').replace(/,/g, '')) <= 0)) {
      errors.push('수량은 1 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'SR-20261116-001',
    date: '2026-11-16',
    name: '김옷깃',
    department: '경영지원팀',
    position: '대리',
    neededBy: '2026-11-24',
    purpose: '부서 공용',
    note: '3층 경영지원팀 사무실로 납품 요청',
  },
  sampleRows: {
    items: [
      { name: 'A4 복사용지', spec: '80g, 2,500매', quantity: '10', purpose: '부서 공용' },
      { name: '토너 카트리지', spec: '검정', quantity: '2', purpose: '프린터 교체' },
      { name: '볼펜', spec: '0.5mm 12자루', quantity: '5', purpose: '신규 입사자' },
    ],
  },
  faq: [
    {
      q: '비품 신청은 어디로 올리나요?',
      a: '회사의 구매·총무 담당 부서와 결재선에 따라 다릅니다. 이 양식으로 결재를 받은 뒤 구매 담당자에게 전달하세요.',
    },
    {
      q: '가격도 적어야 하나요?',
      a: '이 양식은 품명·규격·수량 중심입니다. 예산이나 단가가 필요하면 비고에 적거나, 발주서·견적서와 함께 결재를 올리세요.',
    },
    {
      q: '수량은 어떻게 계산되나요?',
      a: '품목별 수량을 더해 총 수량을 표시합니다. 수량을 바꾸면 자동으로 다시 계산됩니다.',
    },
    {
      q: '긴급하게 필요한 경우는요?',
      a: '필요일을 가까이 두고 비고에 사유를 적은 뒤, 회사의 긴급 구매 절차에 따라 담당자에게 알리세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '조달청 — 나라장터',
      href: 'https://www.g2b.go.kr/',
    },
    {
      label: '행정안전부 — 문서 관리 안내',
      href: 'https://www.mois.go.kr/',
    },
  ],
  related: [
    { label: '발주서 양식', href: '/forms/purchase-order/' },
    { label: '지출결의서 양식', href: '/forms/expense-report/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
