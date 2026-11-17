import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '재고 항목',
  help: '품목별 장부 수량과 실물 수량을 적습니다. 차이와 불일치 건수가 자동으로 계산됩니다.',
  minRows: 3,
  maxRows: 40,
  addLabel: '+ 품목 추가',
  required: true,
  group: '조사 정보',
  summaryField: 'diffCountLabel',
  summaryLabel: '불일치',
  columns: [
    {
      id: 'item',
      label: '품목',
      type: 'text',
      required: true,
      placeholder: '예: A4 복사용지',
      maxLength: 60,
      width: 2.6,
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
      id: 'book',
      label: '장부 수량',
      type: 'number',
      required: true,
      placeholder: '0',
      width: 1.1,
    },
    {
      id: 'actual',
      label: '실물 수량',
      type: 'number',
      required: true,
      placeholder: '0',
      width: 1.1,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '차이 사유',
      maxLength: 40,
      width: 1.6,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'IC-20261117-001',
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
    id: 'countDate',
    label: '조사일',
    type: 'date',
    group: '조사 정보',
    required: true,
  },
  {
    id: 'manager',
    label: '조사자',
    type: 'text',
    group: '조사 정보',
    required: true,
    placeholder: '김재고',
    maxLength: 30,
  },
  {
    id: 'place',
    label: '조사 장소',
    type: 'text',
    group: '조사 정보',
    required: true,
    placeholder: '예: 본사 1층 창고',
    maxLength: 80,
  },
  {
    id: 'itemCountLabel',
    label: '조사 품목 수',
    type: 'computed',
    group: '조사 정보',
    help: '입력한 품목 줄 수입니다.',
  },
  {
    id: 'diffCountLabel',
    label: '불일치',
    type: 'computed',
    group: '조사 정보',
    help: '장부 수량과 실물 수량이 다른 품목 수입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '차이 원인, 조정 요청, 재조사 계획 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['조사자', '창고 담당', '팀장', '부서장', '대표'],
    defaultValue: JSON.stringify([
      { label: '조사자', enabled: true },
      { label: '창고 담당', enabled: true },
      { label: '팀장', enabled: false },
      { label: '부서장', enabled: false },
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
  (rows.items ?? []).filter((row) => (row.item ?? '').trim());

const number = (value: string | undefined): number => {
  const parsed = Number((value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const diffOf = (row: Record<string, string>): number => number(row.actual) - number(row.book);

const formatDiff = (value: number): string => (value > 0 ? `+${value}` : String(value));

export const inventoryCount: FormTemplate = {
  slug: 'inventory-count',
  title: '재고조사표',
  family: 'operations',
  category: 'report',
  description:
    '창고·매장의 재고를 장부 수량과 실물 수량으로 대조하는 재고조사표를 브라우저에서 작성하고 A4 PDF로 저장합니다. 차이와 불일치 건수가 자동 계산됩니다.',
  keywords: [
    '재고조사표',
    '재고조사표 양식',
    '재고 실사',
    '장부 실물 대조',
    '재고 차이',
    '재고조사표 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'IC',
  lead: '장부상 재고와 실제 재고를 품목별로 대조하는 표입니다. 차이를 자동으로 계산하고 불일치 품목 수를 세어 조정 대상을 빠르게 찾습니다.',
  useCases: [
    '월말·분기 재고 실사를 기록할 때',
    '장부와 실물 수량 차이를 확인할 때',
    '창고 이전·폐기 품목을 정리할 때',
    '회계·감사 자료로 재고 조사 결과를 남길 때',
  ],
  howTo: [
    '문서 번호와 작성일, 조사 정보를 확인합니다.',
    '품목별 장부 수량과 실물 수량을 입력합니다.',
    '차이와 불일치 건수를 확인합니다.',
    '비고에 차이 원인을 적고 PDF로 내려받아 서명합니다.',
  ],
  notes: [
    '실물 수량은 실제로 세어 확인한 수량을 적습니다. 차이가 나면 원인과 조정 여부를 비고에 남기세요.',
    '재고 조정은 회사의 회계·재고 관리 절차와 승인에 따라 처리하세요.',
    '조사일과 장소를 정확히 적어 이후 재조사·감사와 비교할 수 있게 합니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '재고조사표',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '조사 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '조사일', field: 'countDate' },
        { label: '조사자', field: 'manager' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '조사 장소', field: 'place' },
        { label: '조사 품목 수', field: 'itemCountLabel' },
      ],
    },
    { kind: 'kv', columns: 2, rows: [{ label: '불일치', field: 'diffCountLabel' }] },
    { kind: 'section', title: '재고 항목' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '품목', width: 46 },
        { label: '규격', width: 34 },
        { label: '장부', width: 20, align: 'right' },
        { label: '실물', width: 20, align: 'right' },
        { label: '차이', width: 18, align: 'right' },
        { label: '비고', width: 26 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row, index) => [
          String(index + 1),
          (row.item ?? '').trim(),
          (row.spec ?? '').trim(),
          row.book ? String(number(row.book)) : '',
          row.actual ? String(number(row.actual)) : '',
          row.book || row.actual ? formatDiff(diffOf(row)) : '',
          (row.note ?? '').trim(),
        ]),
      minRows: 3,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['조사자', '창고 담당', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = itemsOf(rows);
    const diff = list.filter((row) => diffOf(row) !== 0).length;
    return {
      itemCountLabel: list.length > 0 ? `${list.length}개` : '',
      diffCountLabel: list.length > 0 ? `${diff}건` : '',
    };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) {
      errors.push('재고 항목을 한 줄 이상 입력하세요.');
    }
    if (list.some((row) => number(row.book) < 0 || number(row.actual) < 0)) {
      errors.push('수량은 0 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'IC-20261117-001',
    date: '2026-11-17',
    countDate: '2026-11-17',
    manager: '김재고',
    place: '본사 1층 창고',
    note: '복사용지는 입고 지연분 2박스가 장부에 먼저 반영되어 차이가 발생했습니다. 토너는 파손 1개를 폐기 처리 예정입니다.',
  },
  sampleRows: {
    items: [
      { item: 'A4 복사용지', spec: '80g 2,500매', book: '10', actual: '8', note: '입고 지연' },
      { item: '토너 카트리지', spec: '검정', book: '5', actual: '4', note: '파손 1개' },
      { item: '볼펜', spec: '0.7mm', book: '12', actual: '12', note: '' },
      { item: '포스트잇', spec: '76×76mm', book: '20', actual: '20', note: '' },
    ],
  },
  faq: [
    {
      q: '재고조사표와 재고 실사는 어떻게 다른가요?',
      a: '재고 실사는 실제 수량을 세는 과정이고, 재고조사표는 그 결과를 장부 수량과 대조해 기록하는 문서입니다.',
    },
    {
      q: '차이는 어떻게 계산되나요?',
      a: '실물 수량에서 장부 수량을 뺀 값입니다. +는 실물이 많고, -는 실물이 적다는 뜻입니다.',
    },
    {
      q: '불일치 건수는 무엇인가요?',
      a: '차이가 0이 아닌 품목 수입니다. 조정이 필요한 항목을 빠르게 확인할 수 있습니다.',
    },
    {
      q: '차이가 나면 바로 조정하나요?',
      a: '원인을 확인하고 회사의 승인 절차를 거쳐 조정합니다. 조사표에는 차이와 사유를 먼저 기록하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '중소벤처기업부 — 재고·물류 관리 안내',
      href: 'https://www.mss.go.kr/',
    },
  ],
  related: [
    { label: '비품대장 양식', href: '/forms/supplies-ledger/' },
    { label: '자산관리대장 양식', href: '/forms/asset-ledger/' },
    { label: '비품 신청서 양식', href: '/forms/supplies-request/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
