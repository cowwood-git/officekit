import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const assets: RepeatGroup = {
  id: 'assets',
  label: '이동 자산',
  help: '부서·위치를 옮길 자산의 번호와 수량을 적습니다.',
  minRows: 2,
  maxRows: 20,
  addLabel: '+ 자산 추가',
  required: true,
  group: '이동 정보',
  summaryField: 'totalQuantityLabel',
  summaryLabel: '총 수량',
  columns: [
    {
      id: 'assetNo',
      label: '자산번호',
      type: 'text',
      required: true,
      placeholder: '예: AS-2024-010',
      maxLength: 40,
      width: 1.8,
    },
    {
      id: 'name',
      label: '자산명',
      type: 'text',
      required: true,
      placeholder: '예: 모니터',
      maxLength: 60,
      width: 2.4,
    },
    {
      id: 'spec',
      label: '규격',
      type: 'text',
      placeholder: '모델·사양',
      maxLength: 60,
      width: 2,
    },
    {
      id: 'quantity',
      label: '수량',
      type: 'number',
      placeholder: '1',
      width: 0.9,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '상태·부속품',
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
    group: '문서',
    placeholder: 'ATR-20261118-001',
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
    id: 'requester',
    label: '신청자',
    type: 'text',
    group: '신청자',
    placeholder: '김자산',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '신청 부서',
    type: 'text',
    group: '신청자',
    placeholder: '개발팀',
    maxLength: 40,
  },
  {
    id: 'transferDate',
    label: '이동일',
    type: 'date',
    group: '이동 정보',
    required: true,
  },
  {
    id: 'fromDept',
    label: '기존 부서',
    type: 'text',
    group: '이동 정보',
    placeholder: '개발팀',
    maxLength: 40,
  },
  {
    id: 'fromPlace',
    label: '기존 위치',
    type: 'text',
    group: '이동 정보',
    placeholder: '본사 3층',
    maxLength: 80,
  },
  {
    id: 'toDept',
    label: '이동 부서',
    type: 'text',
    group: '이동 정보',
    required: true,
    placeholder: '서비스기획팀',
    maxLength: 40,
  },
  {
    id: 'toPlace',
    label: '이동 위치',
    type: 'text',
    group: '이동 정보',
    placeholder: '본사 5층',
    maxLength: 80,
  },
  {
    id: 'totalQuantityLabel',
    label: '총 수량',
    type: 'computed',
    group: '이동 정보',
    help: '이동 자산 수량의 합계입니다.',
  },
  {
    id: 'reason',
    label: '이동 사유',
    type: 'textarea',
    group: '이동 사유',
    placeholder: '조직 개편, 인력 이동, 장비 교체 등',
    required: true,
    maxLength: 500,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['신청자', '팀장', '자산 담당', '부서장', '대표'],
    defaultValue: JSON.stringify([
      { label: '신청자', enabled: true },
      { label: '팀장', enabled: true },
      { label: '자산 담당', enabled: false },
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

const assetsOf = (rows: FormRows): FormRows['assets'] =>
  (rows.assets ?? []).filter((row) => (row.assetNo ?? '').trim() || (row.name ?? '').trim());

const quantityOf = (row: Record<string, string>): number => {
  const quantity = Number((row.quantity ?? '').replace(/,/g, ''));
  return Number.isFinite(quantity) ? quantity : 0;
};

export const assetTransfer: FormTemplate = {
  slug: 'asset-transfer',
  title: '자산 이동 신청서',
  family: 'report',
  category: 'report',
  description:
    '자산의 부서·위치·사용자를 옮길 때 이동 내역을 정리하는 자산 이동 신청서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '자산 이동 신청서',
    '자산 이동 양식',
    '비품 이동',
    '자산 이관',
    '자산 이동 신청서 PDF',
    '자산 관리',
  ],
  updated: '2026-11-18',
  docPrefix: 'ATR',
  lead: '자산의 부서·위치를 옮길 때 이동 내역을 남기는 신청서입니다. 대상 자산과 이동 전후 정보, 사유를 한 장에 정리합니다.',
  useCases: [
    '조직 개편으로 자산을 다른 부서로 옮길 때',
    '직원 좌석 이동에 따라 비품을 옮길 때',
    '자산관리대장의 위치·사용자를 갱신할 때',
    '감사·결산을 위해 이동 이력을 남길 때',
  ],
  howTo: [
    '신청일과 신청자, 이동일을 적습니다.',
    '기존 부서·위치와 이동할 부서·위치를 입력합니다.',
    '이동할 자산의 번호·명칭·수량을 적습니다.',
    '이동 사유를 확인하고 PDF로 내려받아 결재를 받습니다.',
  ],
  notes: [
    '이동 전후 위치와 사용자를 자산관리대장에 함께 반영하세요.',
    '고가·공용 장비는 이동 전에 승인과 상태 확인을 거치는 것이 좋습니다.',
    '이동 중 파손·분실에 대비해 사진이나 인수 확인을 남기면 좋습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [assets],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '자산 이동 신청서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '신청자' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '신청자', field: 'requester' },
        { label: '신청 부서', field: 'department' },
      ],
    },
    { kind: 'section', title: '이동 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '이동일', field: 'transferDate' },
        { label: '총 수량', field: 'totalQuantityLabel' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '기존 부서', field: 'fromDept' },
        { label: '이동 부서', field: 'toDept' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '기존 위치', field: 'fromPlace' },
        { label: '이동 위치', field: 'toPlace' },
      ],
    },
    { kind: 'section', title: '이동 자산' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '자산번호', width: 36 },
        { label: '자산명', width: 54 },
        { label: '규격', width: 44 },
        { label: '수량', width: 16, align: 'right' },
        { label: '비고', width: 40 },
      ],
      rows: (_values, rows) =>
        assetsOf(rows).map((row, index) => [
          String(index + 1),
          (row.assetNo ?? '').trim(),
          (row.name ?? '').trim(),
          (row.spec ?? '').trim(),
          row.quantity ? String(quantityOf(row)) : '',
          (row.note ?? '').trim(),
        ]),
      minRows: 2,
    },
    {
      kind: 'totals',
      rows: [{ label: '총 수량', field: 'totalQuantityLabel', strong: true }],
      width: 60,
    },
    { kind: 'section', title: '이동 사유' },
    { kind: 'text', field: 'reason', minLines: 3 },
    {
      kind: 'notice',
      text: '이동 완료 후 자산관리대장의 위치·사용자 정보를 함께 갱신하세요.',
    },
    {
      kind: 'signature',
      roles: ['신청자', '팀장', '자산 담당', '부서장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const total = assetsOf(rows).reduce((sum, row) => sum + quantityOf(row), 0);
    return { totalQuantityLabel: total > 0 ? `${total.toLocaleString('ko-KR')}개` : '' };
  },
  validate: (_values, rows) =>
    assetsOf(rows).length === 0 ? ['이동할 자산을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'ATR-20261118-001',
    date: '2026-11-18',
    requester: '김자산',
    department: '개발팀',
    transferDate: '2026-11-25',
    fromDept: '개발팀',
    fromPlace: '본사 3층 개발팀',
    toDept: '서비스기획팀',
    toPlace: '본사 5층 기획팀',
    reason:
      '서비스기획팀 신규 인력 배치에 따라 개발팀에서 사용하던 모니터와 노트북을 이동합니다. 기존 사용자는 퇴사했고 자산 상태는 정상입니다.',
  },
  sampleRows: {
    assets: [
      {
        assetNo: 'AS-2024-010',
        name: '모니터',
        spec: '27인치',
        quantity: '2',
        note: '상태 정상',
      },
      {
        assetNo: 'AS-2024-021',
        name: '노트북',
        spec: '14인치',
        quantity: '1',
        note: '충전기 포함',
      },
    ],
  },
  faq: [
    {
      q: '자산 이동 신청서는 언제 쓰나요?',
      a: '부서·위치·사용자가 바뀌어 자산관리대장의 정보를 갱신해야 할 때 사용합니다. 이동 전에 승인을 받아 두면 관리가 쉽습니다.',
    },
    {
      q: '이동 후 자산관리대장은 어떻게 하나요?',
      a: '이동일과 새 부서·위치·사용자를 자산관리대장에 반영하고, 신청서를 함께 보관하세요.',
    },
    {
      q: '고가 장비도 같은 양식으로 옮기나요?',
      a: '네. 다만 회사 규정에 따라 별도 승인이나 상태 점검이 필요할 수 있습니다. 이동 전후 사진을 남기면 좋습니다.',
    },
    {
      q: '이동 중 파손되면 어떻게 하나요?',
      a: '즉시 담당자에게 알리고 상태를 기록하세요. 필요하면 수리·폐기·보상 절차를 별도로 진행합니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국세청 — 자산·감가상각 안내',
      href: 'https://www.nts.go.kr/',
    },
  ],
  related: [
    { label: '자산관리대장 양식', href: '/forms/asset-ledger/' },
    { label: '자산 폐기·불용 신청서 양식', href: '/forms/asset-disposal/' },
    { label: '비품대장 양식', href: '/forms/supplies-ledger/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
