import { formatDateDot } from '@/lib/doc/format';
import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '비품 목록',
  help: '관리번호·품명·규격·구입일·수량·상태를 적습니다. 총 수량과 품목 수가 자동으로 계산됩니다.',
  minRows: 3,
  maxRows: 50,
  addLabel: '+ 비품 추가',
  required: true,
  group: '관리 정보',
  summaryField: 'totalQuantityLabel',
  summaryLabel: '총 수량',
  columns: [
    {
      id: 'code',
      label: '관리번호',
      type: 'text',
      placeholder: '예: SP-001',
      maxLength: 20,
      width: 1.2,
    },
    {
      id: 'name',
      label: '품명',
      type: 'text',
      required: true,
      placeholder: '예: 사무용 의자',
      maxLength: 60,
      width: 2.6,
    },
    {
      id: 'spec',
      label: '규격',
      type: 'text',
      placeholder: '예: 메쉬, 블랙',
      maxLength: 60,
      width: 2,
    },
    {
      id: 'purchasedAt',
      label: '구입일',
      type: 'date',
      width: 1.4,
    },
    {
      id: 'quantity',
      label: '수량',
      type: 'number',
      required: true,
      placeholder: '1',
      width: 0.9,
    },
    {
      id: 'status',
      label: '상태',
      type: 'select',
      options: ['사용 중', '보관', '폐기 예정', '수리 필요'],
      width: 1.4,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '위치·담당',
      maxLength: 30,
      width: 1.2,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'SL-20261117-001',
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
    id: 'department',
    label: '관리 부서',
    type: 'text',
    group: '관리 정보',
    required: true,
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'manager',
    label: '담당자',
    type: 'text',
    group: '관리 정보',
    required: true,
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'location',
    label: '보관 장소',
    type: 'text',
    group: '관리 정보',
    placeholder: '예: 본사 3층 비품실',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'itemCountLabel',
    label: '품목 수',
    type: 'computed',
    group: '관리 정보',
    help: '등록된 비품 품목 수입니다.',
  },
  {
    id: 'totalQuantityLabel',
    label: '총 수량',
    type: 'computed',
    group: '관리 정보',
    help: '비품별 수량의 합계입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '폐기·수리 예정, 구입 예산 등',
    maxLength: 400,
    rows: 2,
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

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.name ?? '').trim());

const quantityOf = (row: Record<string, string>): number => {
  const quantity = Number((row.quantity ?? '').replace(/,/g, ''));
  return Number.isFinite(quantity) ? quantity : 0;
};

export const suppliesLedger: FormTemplate = {
  slug: 'supplies-ledger',
  title: '비품대장',
  family: 'operations',
  category: 'report',
  description:
    '사무실·현장의 비품을 관리번호·품명·규격·구입일·수량·상태로 기록하는 비품대장을 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '비품대장',
    '비품대장 양식',
    '비품 관리대장',
    '사무용품 대장',
    '비품 목록',
    '비품대장 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'SL',
  lead: '비품의 구입과 보관, 폐기 상태를 한눈에 관리하는 대장입니다. 관리번호와 수량을 정리하고 총 수량을 자동으로 계산합니다.',
  useCases: [
    '부서 비품을 등록하고 관리번호를 부여할 때',
    '비품 실사·이전·폐기를 기록할 때',
    '구입 예산과 보유 수량을 확인할 때',
    '담당자 변경 시 비품 현황을 인계할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 관리 부서를 확인합니다.',
    '관리번호·품명·규격·구입일·수량·상태를 입력합니다.',
    '총 수량과 품목 수를 확인합니다.',
    '비고를 적고 PDF로 내려받아 보관합니다.',
  ],
  notes: [
    '관리번호는 부서·품목별로 겹치지 않게 정해 두면 실사와 이력 관리가 쉽습니다.',
    '폐기·수리 품목은 상태와 비고에 사유를 남기고, 회사 자산 규정에 따라 처리하세요.',
    '고가 비품은 구입 영수증과 함께 보관하는 것이 좋습니다.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '비품대장',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '관리 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '관리 부서', field: 'department' },
        { label: '담당자', field: 'manager' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '보관 장소', field: 'location' },
        { label: '품목 수', field: 'itemCountLabel' },
      ],
    },
    { kind: 'kv', columns: 2, rows: [{ label: '총 수량', field: 'totalQuantityLabel' }] },
    { kind: 'section', title: '비품 목록' },
    {
      kind: 'table',
      columns: [
        { label: '관리번호', width: 20 },
        { label: '품명', width: 44 },
        { label: '규격', width: 32 },
        { label: '구입일', width: 24 },
        { label: '수량', width: 12, align: 'right' },
        { label: '상태', width: 24, align: 'center' },
        { label: '비고', width: 18 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row) => [
          (row.code ?? '').trim(),
          (row.name ?? '').trim(),
          (row.spec ?? '').trim(),
          row.purchasedAt ? formatDateDot(row.purchasedAt) : '',
          row.quantity ? String(quantityOf(row)) : '',
          (row.status ?? '').trim(),
          (row.note ?? '').trim(),
        ]),
      minRows: 3,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = itemsOf(rows);
    const total = list.reduce((sum, row) => sum + quantityOf(row), 0);
    return {
      itemCountLabel: list.length > 0 ? `${list.length}개` : '',
      totalQuantityLabel: total > 0 ? `${total}개` : '',
    };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) errors.push('비품을 한 줄 이상 입력하세요.');
    if (list.some((row) => quantityOf(row) <= 0)) {
      errors.push('수량은 1 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'SL-20261117-001',
    date: '2026-11-17',
    department: '경영지원팀',
    manager: '김옷깃',
    location: '본사 3층 비품실',
    note: '수리 필요 항목은 11월 20일 업체 점검 예정입니다. 폐기 예정 품목은 연말 자산 정리 때 처리합니다.',
  },
  sampleRows: {
    items: [
      {
        code: 'SP-001',
        name: '사무용 의자',
        spec: '메쉬, 블랙',
        purchasedAt: '2024-03-12',
        quantity: '12',
        status: '사용 중',
        note: '3층',
      },
      {
        code: 'SP-002',
        name: '회의용 테이블',
        spec: '1800×900',
        purchasedAt: '2024-05-20',
        quantity: '2',
        status: '사용 중',
        note: '회의실',
      },
      {
        code: 'SP-003',
        name: '복합기',
        spec: 'A3 컬러',
        purchasedAt: '2023-11-02',
        quantity: '1',
        status: '수리 필요',
        note: '급지 불량',
      },
      {
        code: 'SP-004',
        name: '모니터 받침대',
        spec: '알루미늄',
        purchasedAt: '2025-01-15',
        quantity: '4',
        status: '보관',
        note: '창고',
      },
    ],
  },
  faq: [
    {
      q: '비품대장과 자산관리대장은 무엇이 다른가요?',
      a: '비품대장은 의자·복합기처럼 비교적 저가·다수 품목을 관리하고, 자산관리대장은 취득가액과 감가상각 대상이 되는 고정자산을 관리합니다.',
    },
    {
      q: '관리번호는 어떻게 정하나요?',
      a: '부서 코드와 일련번호를 조합하면 좋습니다(예: SP-001). 한 번 부여한 번호는 재사용하지 않도록 관리하세요.',
    },
    {
      q: '수량은 자동 계산되나요?',
      a: '네. 품목별 수량을 더해 총 수량을 표시합니다. 품목 수는 줄 수를 기준으로 셉니다.',
    },
    {
      q: '폐기한 비품도 남기나요?',
      a: '상태를 “폐기 예정”으로 바꾸고 비고에 사유와 일자를 적습니다. 실제 폐기 후에는 이력으로 보관하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '중소벤처기업부 — 물류·비품 관리 안내',
      href: 'https://www.mss.go.kr/',
    },
  ],
  related: [
    { label: '자산관리대장 양식', href: '/forms/asset-ledger/' },
    { label: '재고조사표 양식', href: '/forms/inventory-count/' },
    { label: '비품 신청서 양식', href: '/forms/supplies-request/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
