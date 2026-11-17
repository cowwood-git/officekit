import { formatDateDot } from '@/lib/doc/format';
import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const items: RepeatGroup = {
  id: 'items',
  label: '자산 목록',
  help: '자산번호·자산명·모델·취득일·취득가액·상태를 적습니다. 취득가 합계가 자동으로 계산됩니다.',
  minRows: 2,
  maxRows: 40,
  addLabel: '+ 자산 추가',
  required: true,
  group: '관리 정보',
  summaryField: 'totalPriceLabel',
  summaryLabel: '취득가 합계',
  columns: [
    {
      id: 'assetNo',
      label: '자산번호',
      type: 'text',
      required: true,
      placeholder: '예: AS-001',
      maxLength: 20,
      width: 1.2,
    },
    {
      id: 'name',
      label: '자산명',
      type: 'text',
      required: true,
      placeholder: '예: 노트북',
      maxLength: 60,
      width: 2.4,
    },
    {
      id: 'model',
      label: '모델·규격',
      type: 'text',
      placeholder: '예: 15인치, 16GB',
      maxLength: 60,
      width: 2,
    },
    {
      id: 'acquiredAt',
      label: '취득일',
      type: 'date',
      width: 1.3,
    },
    {
      id: 'price',
      label: '취득가액',
      type: 'money',
      placeholder: '0',
      width: 1.4,
    },
    {
      id: 'status',
      label: '상태',
      type: 'select',
      options: ['사용 중', '보관', '처분 예정', '수리 필요'],
      width: 1.3,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'AL-20261117-001',
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
    placeholder: '예: 본사 3층',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'countLabel',
    label: '자산 수',
    type: 'computed',
    group: '관리 정보',
    help: '등록된 자산 수입니다.',
  },
  {
    id: 'totalPriceLabel',
    label: '취득가 합계',
    type: 'computed',
    group: '관리 정보',
    help: '자산별 취득가액의 합계입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '감가상각, 처분·이전 계획 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['작성자', '자산 담당', '팀장'],
    defaultValue: JSON.stringify([
      { label: '작성자', enabled: true },
      { label: '자산 담당', enabled: true },
      { label: '팀장', enabled: false },
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

export const assetLedger: FormTemplate = {
  slug: 'asset-ledger',
  title: '자산관리대장',
  family: 'operations',
  category: 'report',
  description:
    '노트북·장비 등 고정자산을 자산번호·취득일·취득가액·상태로 관리하는 자산관리대장을 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '자산관리대장',
    '자산관리대장 양식',
    '고정자산 대장',
    '자산 목록',
    '자산 취득가',
    '자산관리대장 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'AL',
  lead: '부서가 보유한 고정자산을 자산번호와 취득가액으로 관리하는 대장입니다. 자산 수와 취득가 합계를 자동으로 계산합니다.',
  useCases: [
    '노트북·장비 등 고정자산을 등록할 때',
    '자산 이전·처분·수리 이력을 관리할 때',
    '연말 자산 실사와 감가상각 자료로 쓸 때',
    '담당자 변경 시 자산 현황을 인계할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 관리 부서를 확인합니다.',
    '자산번호·자산명·모델·취득일·취득가액을 입력합니다.',
    '자산 수와 취득가 합계를 확인합니다.',
    '비고를 적고 PDF로 내려받아 보관합니다.',
  ],
  notes: [
    '자산번호는 한 번 부여하면 재사용하지 말고, 이전·처분 이력을 함께 남기세요.',
    '취득가액과 감가상각은 회사의 회계 기준과 세무 처리에 따라 달라질 수 있습니다.',
    '고가 자산은 구입 증빙과 보증서를 함께 보관하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '자산관리대장',
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
        { label: '자산 수', field: 'countLabel' },
      ],
    },
    { kind: 'section', title: '자산 목록' },
    {
      kind: 'table',
      columns: [
        { label: '자산번호', width: 22 },
        { label: '자산명', width: 40 },
        { label: '모델·규격', width: 32 },
        { label: '취득일', width: 28 },
        { label: '취득가액', width: 28, align: 'right' },
        { label: '상태', width: 24, align: 'center' },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row) => [
          (row.assetNo ?? '').trim(),
          (row.name ?? '').trim(),
          (row.model ?? '').trim(),
          row.acquiredAt ? formatDateDot(row.acquiredAt) : '',
          parseAmount(row.price ?? '') > 0 ? formatWon(parseAmount(row.price ?? '')) : '',
          (row.status ?? '').trim(),
        ]),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [{ label: '취득가 합계', field: 'totalPriceLabel', strong: true }],
      width: 76,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '자산 담당', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = itemsOf(rows);
    const total = list.reduce((sum, row) => sum + parseAmount(row.price ?? ''), 0);
    return {
      countLabel: list.length > 0 ? `${list.length}개` : '',
      totalPriceLabel: total > 0 ? formatWon(total) : '',
    };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) errors.push('자산을 한 줄 이상 입력하세요.');
    if (list.some((row) => (row.price ?? '').trim() && parseAmount(row.price ?? '') < 0)) {
      errors.push('취득가액은 0원 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'AL-20261117-001',
    date: '2026-11-17',
    department: '경영지원팀',
    manager: '김옷깃',
    location: '본사 3층',
    note: '노트북 2대는 2027년 상반기 교체 예정입니다. 감가상각은 회계 기준에 따라 처리합니다.',
  },
  sampleRows: {
    items: [
      {
        assetNo: 'AS-001',
        name: '노트북',
        model: '15인치, 16GB',
        acquiredAt: '2025-02-10',
        price: '1850000',
        status: '사용 중',
      },
      {
        assetNo: 'AS-002',
        name: '노트북',
        model: '14인치, 16GB',
        acquiredAt: '2025-02-10',
        price: '1750000',
        status: '사용 중',
      },
      {
        assetNo: 'AS-003',
        name: '복합기',
        model: 'A3 컬러',
        acquiredAt: '2023-11-02',
        price: '2200000',
        status: '수리 필요',
      },
      {
        assetNo: 'AS-004',
        name: '프로젝터',
        model: '4K, 3000안시',
        acquiredAt: '2024-06-20',
        price: '980000',
        status: '보관',
      },
    ],
  },
  faq: [
    {
      q: '자산관리대장과 비품대장은 무엇이 다른가요?',
      a: '자산관리대장은 취득가액과 감가상각 대상이 되는 고정자산을 관리하고, 비품대장은 상대적으로 저가·다수인 사무 비품을 관리합니다.',
    },
    {
      q: '취득가액은 어떻게 적나요?',
      a: '부가세를 제외한 취득 원가 또는 회사 회계 기준에 따른 금액을 적습니다. 설치비·운송비 포함 여부를 일관되게 적용하세요.',
    },
    {
      q: '감가상각도 계산되나요?',
      a: '이 양식은 취득가 합계만 계산합니다. 감가상각은 회계 프로그램이나 별도 기준으로 처리하세요.',
    },
    {
      q: '처분한 자산은 어떻게 하나요?',
      a: '상태를 “처분 예정”으로 바꾸고 비고에 처분일과 사유를 적습니다. 처분 후에는 이력으로 보관하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국세청 — 감가상각 안내',
      href: 'https://www.nts.go.kr/',
    },
    {
      label: '기획재정부 — 회계 기준',
      href: 'https://www.moef.go.kr/',
    },
  ],
  related: [
    { label: '비품대장 양식', href: '/forms/supplies-ledger/' },
    { label: '재고조사표 양식', href: '/forms/inventory-count/' },
    { label: '비품 신청서 양식', href: '/forms/supplies-request/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
