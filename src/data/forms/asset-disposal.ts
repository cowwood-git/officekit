import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const assets: RepeatGroup = {
  id: 'assets',
  label: '대상 자산',
  help: '폐기·불용할 자산의 번호와 수량을 적습니다.',
  minRows: 2,
  maxRows: 20,
  addLabel: '+ 자산 추가',
  required: true,
  group: '폐기 정보',
  summaryField: 'totalQuantityLabel',
  summaryLabel: '총 수량',
  columns: [
    {
      id: 'assetNo',
      label: '자산번호',
      type: 'text',
      required: true,
      placeholder: '예: AS-2021-001',
      maxLength: 40,
      width: 1.8,
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
      id: 'acquiredDate',
      label: '취득일',
      type: 'date',
      width: 1.4,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '상태·처리 사유',
      maxLength: 60,
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
    placeholder: 'AD-20261118-001',
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
    label: '부서',
    type: 'text',
    group: '신청자',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'reasonType',
    label: '폐기 사유',
    type: 'select',
    group: '폐기 정보',
    options: ['사용 불가', '노후', '고장', '이전', '기타'],
    defaultValue: '노후',
    required: true,
  },
  {
    id: 'method',
    label: '처리 방법',
    type: 'select',
    group: '폐기 정보',
    options: ['폐기', '매각', '기증', '재활용'],
    defaultValue: '폐기',
    required: true,
  },
  {
    id: 'totalQuantityLabel',
    label: '총 수량',
    type: 'computed',
    group: '폐기 정보',
    help: '대상 자산 수량의 합계입니다.',
  },
  {
    id: 'reasonDetail',
    label: '상세 사유',
    type: 'textarea',
    group: '폐기 사유',
    placeholder: '폐기·불용 판단 근거와 처리 계획을 적습니다.',
    required: true,
    maxLength: 600,
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
      { label: '팀장', enabled: false },
      { label: '자산 담당', enabled: true },
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

export const assetDisposal: FormTemplate = {
  slug: 'asset-disposal',
  title: '자산 폐기·불용 신청서',
  family: 'report',
  category: 'report',
  description:
    '사용할 수 없거나 노후한 자산의 폐기·매각·기증을 신청하는 자산 폐기·불용 신청서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '자산 폐기 신청서',
    '자산 불용 신청서',
    '불용품 처리',
    '자산 폐기 양식',
    '자산 처분 신청',
    '자산 폐기 신청서 PDF',
  ],
  updated: '2026-11-18',
  docPrefix: 'AD',
  lead: '노후·고장 등으로 사용할 수 없는 자산의 폐기·매각·기증을 신청하는 문서입니다. 대상 자산과 사유, 처리 방법을 한 장에 정리합니다.',
  useCases: [
    '노후·고장 자산을 폐기할 때',
    '사용하지 않는 비품을 매각·기증할 때',
    '자산관리대장에서 자산을 정리할 때',
    '감사·결산을 위해 처분 근거를 남길 때',
  ],
  howTo: [
    '신청일과 신청자, 부서를 적습니다.',
    '폐기 사유와 처리 방법을 고릅니다.',
    '대상 자산의 번호·명칭·수량을 입력합니다.',
    '상세 사유를 적고 PDF로 내려받아 결재를 받습니다.',
  ],
  notes: [
    '자산의 취득가액·장부가액은 자산관리대장에서 확인해 함께 보관하세요.',
    '매각·기증은 회사 자산 처분 규정과 세무 처리 기준을 따릅니다.',
    '개인정보가 저장된 기기(PC·저장장치)는 폐기 전에 데이터를 완전히 삭제하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [assets],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '자산 폐기·불용 신청서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '신청자' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '신청자', field: 'requester' },
        { label: '부서', field: 'department' },
      ],
    },
    { kind: 'section', title: '폐기 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '폐기 사유', field: 'reasonType' },
        { label: '처리 방법', field: 'method' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '총 수량', field: 'totalQuantityLabel' }] },
    { kind: 'section', title: '대상 자산' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '자산번호', width: 34 },
        { label: '자산명', width: 48 },
        { label: '규격', width: 28 },
        { label: '수량', width: 14, align: 'right' },
        { label: '취득일', width: 30 },
        { label: '비고', width: 28 },
      ],
      rows: (_values, rows) =>
        assetsOf(rows).map((row, index) => [
          String(index + 1),
          (row.assetNo ?? '').trim(),
          (row.name ?? '').trim(),
          (row.spec ?? '').trim(),
          row.quantity ? String(quantityOf(row)) : '',
          row.acquiredDate ?? '',
          (row.note ?? '').trim(),
        ]),
      minRows: 2,
    },
    {
      kind: 'totals',
      rows: [{ label: '총 수량', field: 'totalQuantityLabel', strong: true }],
      width: 60,
    },
    { kind: 'section', title: '상세 사유' },
    { kind: 'text', field: 'reasonDetail', minLines: 3 },
    {
      kind: 'notice',
      text: '폐기·매각·기증은 회사 자산 관리 규정과 관련 법령에 따라 처리하세요.',
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
    assetsOf(rows).length === 0 ? ['대상 자산을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'AD-20261118-001',
    date: '2026-11-18',
    requester: '김자산',
    department: '경영지원팀',
    reasonType: '노후',
    method: '폐기',
    reasonDetail:
      '사용 연한이 지나고 잦은 고장으로 업무에 사용하기 어려운 노트북과 모니터를 폐기합니다. 저장장치는 데이터 삭제 후 회수 업체에 넘깁니다.',
  },
  sampleRows: {
    assets: [
      {
        assetNo: 'AS-2021-001',
        name: '노트북',
        spec: '13인치, i5',
        quantity: '2',
        acquiredDate: '2021-03-01',
        note: '배터리 불량',
      },
      {
        assetNo: 'AS-2021-014',
        name: '모니터',
        spec: '24인치',
        quantity: '3',
        acquiredDate: '2021-03-01',
        note: '화면 깜빡임',
      },
    ],
  },
  faq: [
    {
      q: '자산 폐기와 불용은 무엇이 다른가요?',
      a: '불용은 더 이상 사용하지 않기로 정한 상태이고, 폐기는 불용 자산을 실제로 없애는 처분입니다. 회사 규정에 따라 불용 결정 후 폐기·매각·기증을 진행합니다.',
    },
    {
      q: '매각할 때는 어떻게 하나요?',
      a: '회사 자산 처분 규정에 따라 매각 공고·견적·계약을 진행하고, 매각 금액과 세금 처리 내역을 함께 보관하세요.',
    },
    {
      q: '저장장치가 있는 기기는 어떻게 폐기하나요?',
      a: '개인정보와 업무 자료를 완전히 삭제하거나 물리적으로 파기한 뒤 폐기하세요. 삭제 확인서를 남기면 좋습니다.',
    },
    {
      q: '자산관리대장과 어떻게 연결하나요?',
      a: '폐기 완료 후 자산관리대장의 상태를 폐기로 바꾸고, 신청서와 처리 결과를 함께 보관하세요.',
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
    { label: '자산 이동 신청서 양식', href: '/forms/asset-transfer/' },
    { label: '비품대장 양식', href: '/forms/supplies-ledger/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
