import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const items: RepeatGroup = {
  id: 'items',
  label: '비교 품목',
  group: '비교 업체',
  help: '품목·수량과 업체별 단가를 적으면 업체별 합계가 자동으로 계산됩니다.',
  minRows: 3,
  maxRows: 20,
  addLabel: '+ 품목 추가',
  required: true,
  columns: [
    {
      id: 'item',
      label: '품목',
      type: 'text',
      required: true,
      placeholder: '예: A4 복사용지',
      maxLength: 60,
      width: 3,
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
      id: 'price1',
      label: '업체1 단가',
      type: 'money',
      placeholder: '0',
      width: 1.4,
    },
    {
      id: 'price2',
      label: '업체2 단가',
      type: 'money',
      placeholder: '0',
      width: 1.4,
    },
    {
      id: 'price3',
      label: '업체3 단가',
      type: 'money',
      placeholder: '0',
      width: 1.4,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '기본 정보',
    placeholder: 'QC-20261117-001',
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
    id: 'title',
    label: '건명',
    type: 'text',
    group: '비교 정보',
    placeholder: '예: 사무용품 3사 견적 비교',
    required: true,
    maxLength: 100,
    span: 3,
  },
  {
    id: 'name',
    label: '작성자',
    type: 'text',
    group: '비교 정보',
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '비교 정보',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'vendor1',
    label: '업체 1',
    type: 'text',
    group: '비교 업체',
    placeholder: '예: 옷깃마트',
    required: true,
    maxLength: 40,
  },
  {
    id: 'vendor2',
    label: '업체 2',
    type: 'text',
    group: '비교 업체',
    placeholder: '예: 한빛오피스',
    required: true,
    maxLength: 40,
  },
  {
    id: 'vendor3',
    label: '업체 3',
    type: 'text',
    group: '비교 업체',
    placeholder: '예: 새길문구',
    required: true,
    maxLength: 40,
  },
  {
    id: 'total1',
    label: '업체1 합계',
    type: 'computed',
    group: '비교 합계',
    help: '수량 × 업체1 단가의 합계입니다.',
  },
  {
    id: 'total2',
    label: '업체2 합계',
    type: 'computed',
    group: '비교 합계',
    help: '수량 × 업체2 단가의 합계입니다.',
  },
  {
    id: 'total3',
    label: '업체3 합계',
    type: 'computed',
    group: '비교 합계',
    help: '수량 × 업체3 단가의 합계입니다.',
  },
  {
    id: 'bestLabel',
    label: '최저가',
    type: 'computed',
    group: '비교 합계',
    help: '합계가 가장 낮은 업체를 표시합니다.',
    span: 3,
  },
  {
    id: 'comment',
    label: '비교 의견',
    type: 'textarea',
    group: '의견',
    placeholder: '가격 외 납기·품질·거래 조건을 함께 고려한 의견을 적습니다.',
    maxLength: 600,
    rows: 3,
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

const lineTotal = (row: Record<string, string>, key: string): number => {
  const quantity = Number((row.quantity ?? '').replace(/,/g, ''));
  const price = parseAmount(row[key] ?? '');
  return Number.isFinite(quantity) ? quantity * price : 0;
};

const sumFor = (rows: FormRows, key: string): number =>
  (rows.items ?? []).reduce((sum, row) => sum + lineTotal(row, key), 0);

const vendorName = (name: string, fallback: string): string => name.trim() || fallback;

const comparisonRows = (rows: FormRows): readonly (readonly string[])[] => {
  const list = (rows.items ?? []).filter((row) => (row.item ?? '').trim());
  return list.map((row) => [
    (row.item ?? '').trim(),
    (row.quantity ?? '').trim(),
    lineTotal(row, 'price1') > 0 ? formatWon(lineTotal(row, 'price1')) : '',
    lineTotal(row, 'price2') > 0 ? formatWon(lineTotal(row, 'price2')) : '',
    lineTotal(row, 'price3') > 0 ? formatWon(lineTotal(row, 'price3')) : '',
  ]);
};

export const quoteComparison: FormTemplate = {
  slug: 'quote-comparison',
  title: '견적 비교표',
  family: 'sales',
  category: 'money',
  description:
    '여러 업체의 견적을 품목·수량·단가로 나란히 비교하는 견적 비교표를 브라우저에서 작성하고 A4 PDF로 저장합니다. 업체별 합계와 최저가가 자동으로 계산됩니다.',
  keywords: [
    '견적 비교표',
    '견적 비교표 양식',
    '업체 비교표',
    '거래처 견적 비교',
    '최저가 비교표',
    '견적 비교 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'QC',
  lead: '세 업체의 견적을 같은 품목·수량 기준으로 비교하는 표입니다. 업체별 합계와 최저가를 자동으로 계산해 구매·발주 판단을 돕습니다.',
  useCases: [
    '사무용품·비품 구매 전에 3사 견적을 비교할 때',
    '외주·용역 견적을 같은 기준으로 정리할 때',
    '구매 담당자에게 비교 결과를 보고할 때',
    '최저가 업체 선정 근거를 남길 때',
  ],
  howTo: [
    '문서 번호와 작성일, 건명을 확인합니다.',
    '비교할 업체 3곳의 이름을 적습니다.',
    '품목·수량과 업체별 단가를 입력합니다. 업체별 합계가 자동으로 계산됩니다.',
    '가격 외 조건을 비교 의견에 적고 결재선을 골라 PDF로 내려받습니다.',
  ],
  notes: [
    '이 양식은 입력한 단가를 기준으로 합계만 계산합니다. 부가세·배송비·설치비 등 추가 조건은 비교 의견에 적어 주세요.',
    '최저가가 항상 최선은 아닙니다. 납기·품질·A/S·거래 조건을 함께 검토하세요.',
    '견적서 원본은 PDF 합치기로 이 문서 뒤에 붙여 보관할 수 있습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '견적 비교표',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '비교 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '건명', field: 'title' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '작성자', field: 'name' },
        { label: '부서', field: 'department' },
      ],
    },
    { kind: 'section', title: '비교 업체' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '업체 1', field: 'vendor1' },
        { label: '업체 2', field: 'vendor2' },
        { label: '업체 3', field: 'vendor3' },
      ],
    },
    { kind: 'section', title: '품목별 비교' },
    {
      kind: 'table',
      columns: [
        { label: '품목', width: 68 },
        { label: '수량', width: 18, align: 'right' },
        { label: '업체 1', width: 30, align: 'right', labelField: 'vendor1' },
        { label: '업체 2', width: 30, align: 'right', labelField: 'vendor2' },
        { label: '업체 3', width: 28, align: 'right', labelField: 'vendor3' },
      ],
      rows: (_values, rows) => comparisonRows(rows),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [
        { label: '업체 1 합계', field: 'total1' },
        { label: '업체 2 합계', field: 'total2' },
        { label: '업체 3 합계', field: 'total3' },
      ],
      width: 84,
    },
    { kind: 'kv', columns: 1, rows: [{ label: '최저가', field: 'bestLabel' }] },
    { kind: 'section', title: '비교 의견' },
    { kind: 'text', field: 'comment', minLines: 3 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values, rows) => {
    const total1 = sumFor(rows, 'price1');
    const total2 = sumFor(rows, 'price2');
    const total3 = sumFor(rows, 'price3');
    const vendors = [
      { name: vendorName(values.vendor1 ?? '', '업체 1'), total: total1 },
      { name: vendorName(values.vendor2 ?? '', '업체 2'), total: total2 },
      { name: vendorName(values.vendor3 ?? '', '업체 3'), total: total3 },
    ].filter((vendor) => vendor.total > 0);
    vendors.sort((a, b) => a.total - b.total);
    const best = vendors[0];
    return {
      total1: total1 > 0 ? formatWon(total1) : '',
      total2: total2 > 0 ? formatWon(total2) : '',
      total3: total3 > 0 ? formatWon(total3) : '',
      bestLabel: best ? `${best.name} · ${formatWon(best.total)}` : '',
    };
  },
  validate: (_values, rows) => {
    const errors: string[] = [];
    const filled = (rows.items ?? []).filter((row) => (row.item ?? '').trim());
    if (filled.length === 0) {
      errors.push('비교할 품목을 한 줄 이상 입력하세요.');
    }
    if (filled.some((row) => Number((row.quantity ?? '').replace(/,/g, '')) <= 0)) {
      errors.push('수량은 1 이상이어야 합니다.');
    }
    if (
      filled.every(
        (row) =>
          parseAmount(row.price1 ?? '') <= 0 &&
          parseAmount(row.price2 ?? '') <= 0 &&
          parseAmount(row.price3 ?? '') <= 0,
      )
    ) {
      errors.push('업체별 단가를 한 곳 이상 입력하세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'QC-20261117-001',
    date: '2026-11-17',
    title: '사무용품 3사 견적 비교',
    name: '김옷깃',
    department: '경영지원팀',
    vendor1: '옷깃마트',
    vendor2: '한빛오피스',
    vendor3: '새길문구',
    comment:
      '옷깃마트가 총액은 가장 낮지만 배송비가 별도입니다. 한빛오피스는 무료 배송과 당일 납품이 가능해 함께 검토합니다.',
  },
  sampleRows: {
    items: [
      { item: 'A4 복사용지', quantity: '10', price1: '28000', price2: '27500', price3: '29000' },
      { item: '토너 카트리지', quantity: '2', price1: '85000', price2: '82000', price3: '88000' },
      { item: '볼펜', quantity: '5', price1: '6000', price2: '6500', price3: '5800' },
    ],
  },
  faq: [
    {
      q: '견적 비교표에는 무엇을 적어야 하나요?',
      a: '같은 품목·수량을 기준으로 업체별 단가와 합계를 적고, 가격 외 납기·품질·배송 조건을 비교 의견에 정리하면 좋습니다.',
    },
    {
      q: '부가세는 포함인가요?',
      a: '이 표는 입력한 단가를 그대로 합산합니다. 부가세 포함·별도 여부를 업체별로 확인해 비교 의견이나 비고에 적어 주세요.',
    },
    {
      q: '업체를 2곳만 비교해도 되나요?',
      a: '이 양식은 3곳을 기준으로 만들었습니다. 2곳만 비교하려면 세 번째 업체 칸과 단가를 비워 두면 합계와 최저가에서 제외됩니다.',
    },
    {
      q: '최저가 업체를 자동으로 선택하나요?',
      a: '합계가 가장 낮은 업체를 표시만 합니다. 납기·품질·A/S를 함께 검토해 최종 업체를 결정하세요.',
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
      label: '공정거래위원회 — 계약·거래 안내',
      href: 'https://www.ftc.go.kr/',
    },
  ],
  related: [
    { label: '견적서 양식', href: '/forms/quote/' },
    { label: '발주서 양식', href: '/forms/purchase-order/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
