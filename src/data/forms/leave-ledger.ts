import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const leaves: RepeatGroup = {
  id: 'leaves',
  label: '연차 내역',
  help: '사원별 발생·사용 연차를 적으면 잔여 연차가 자동 계산됩니다. 0.5일 단위로 입력할 수 있습니다.',
  minRows: 2,
  maxRows: 30,
  addLabel: '+ 사원 추가',
  required: true,
  group: '관리 정보',
  summaryField: 'totalRemainingLabel',
  summaryLabel: '잔여 합계',
  columns: [
    {
      id: 'name',
      label: '성명',
      type: 'text',
      required: true,
      placeholder: '김근로',
      maxLength: 30,
      width: 1.8,
    },
    {
      id: 'hireDate',
      label: '입사일',
      type: 'date',
      width: 1.4,
    },
    {
      id: 'granted',
      label: '발생',
      type: 'number',
      step: 0.5,
      placeholder: '15',
      width: 1,
    },
    {
      id: 'used',
      label: '사용',
      type: 'number',
      step: 0.5,
      placeholder: '0',
      width: 1,
    },
    {
      id: 'remaining',
      label: '잔여',
      type: 'computed',
      width: 1,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '사용일·사유 등',
      maxLength: 60,
      width: 2.2,
    },
  ],
  computeRow: (row) => {
    const granted = Number(row.granted ?? 0);
    const used = Number(row.used ?? 0);
    return {
      remaining:
        Number.isFinite(granted) && Number.isFinite(used) ? `${Math.max(0, granted - used)}일` : '',
    };
  },
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'LL-20261118-001',
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
    id: 'company',
    label: '사업장명',
    type: 'text',
    group: '관리 정보',
    placeholder: '옷깃 주식회사',
    required: true,
    maxLength: 60,
    span: 2,
  },
  {
    id: 'year',
    label: '기준 연도',
    type: 'text',
    group: '관리 정보',
    placeholder: '예: 2026',
    required: true,
    maxLength: 10,
  },
  {
    id: 'totalGrantedLabel',
    label: '발생 합계',
    type: 'computed',
    group: '관리 정보',
    help: '사원별 발생 연차의 합계입니다.',
  },
  {
    id: 'totalUsedLabel',
    label: '사용 합계',
    type: 'computed',
    group: '관리 정보',
    help: '사원별 사용 연차의 합계입니다.',
  },
  {
    id: 'totalRemainingLabel',
    label: '잔여 합계',
    type: 'computed',
    group: '관리 정보',
    help: '사원별 잔여 연차의 합계입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '이월·소멸 기준, 촉진 통지일 등',
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

const leavesOf = (rows: FormRows): FormRows['leaves'] =>
  (rows.leaves ?? []).filter((row) => (row.name ?? '').trim());

const grantedOf = (row: Record<string, string>): number => Number(row.granted ?? 0) || 0;
const usedOf = (row: Record<string, string>): number => Number(row.used ?? 0) || 0;

const days = (value: number): string =>
  `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)}일`;

export const leaveLedger: FormTemplate = {
  slug: 'leave-ledger',
  title: '연차 사용대장',
  family: 'hr',
  category: 'people',
  description:
    '사원별 연차 발생·사용·잔여 일수를 정리하는 연차 사용대장을 브라우저에서 작성하고 A4 PDF로 저장합니다. 잔여 연차와 합계가 자동 계산됩니다.',
  keywords: [
    '연차 사용대장',
    '연차 사용대장 양식',
    '연차 대장',
    '연차 발생 사용',
    '연차 관리대장',
    '연차 사용대장 PDF',
  ],
  updated: '2026-11-18',
  docPrefix: 'LL',
  lead: '사원별 연차 발생과 사용 내역을 한 표에 정리하는 대장입니다. 잔여 연차와 전체 합계를 자동으로 계산합니다.',
  useCases: [
    '연차 발생·사용·잔여 일수를 관리할 때',
    '연차 사용 촉진 통지의 기준 자료로 쓸 때',
    '퇴사자 정산 전 잔여 연차를 확인할 때',
    '부서별 연차 사용 현황을 공유할 때',
  ],
  howTo: [
    '기준 연도와 사업장을 적습니다.',
    '사원별 입사일과 발생 연차를 입력합니다.',
    '사용 연차를 적고 잔여 연차를 확인합니다.',
    '합계와 비고를 확인하고 PDF로 내려받습니다.',
  ],
  notes: [
    '연차 발생 일수는 입사일·근속 기간·회계연도 기준에 따라 달라지므로 회사 규정을 확인하세요.',
    '연차 사용 촉진·소멸·이월 기준을 비고에 명확히 적으세요.',
    '사원별 연차 정보는 개인정보이므로 접근 권한을 제한하세요.',
  ],
  fields,
  groups: [leaves],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '연차 사용대장',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '관리 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '사업장명', field: 'company' },
        { label: '기준 연도', field: 'year' },
      ],
    },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '발생 합계', field: 'totalGrantedLabel' },
        { label: '사용 합계', field: 'totalUsedLabel' },
        { label: '잔여 합계', field: 'totalRemainingLabel' },
      ],
    },
    { kind: 'section', title: '연차 내역' },
    {
      kind: 'table',
      columns: [
        { label: '성명', width: 32 },
        { label: '입사일', width: 28 },
        { label: '발생', width: 24, align: 'right' },
        { label: '사용', width: 24, align: 'right' },
        { label: '잔여', width: 24, align: 'right' },
        { label: '비고', width: 42 },
      ],
      rows: (_values, rows) =>
        leavesOf(rows).map((row) => [
          (row.name ?? '').trim(),
          row.hireDate ?? '',
          grantedOf(row) > 0 ? days(grantedOf(row)) : '',
          usedOf(row) > 0 ? days(usedOf(row)) : '',
          grantedOf(row) > 0 ? days(Math.max(0, grantedOf(row) - usedOf(row))) : '',
          (row.note ?? '').trim(),
        ]),
      minRows: 2,
    },
    {
      kind: 'totals',
      rows: [
        { label: '발생 합계', field: 'totalGrantedLabel' },
        { label: '사용 합계', field: 'totalUsedLabel' },
        { label: '잔여 합계', field: 'totalRemainingLabel', strong: true },
      ],
      width: 70,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장', '부서장', '본부장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = leavesOf(rows);
    const granted = list.reduce((sum, row) => sum + grantedOf(row), 0);
    const used = list.reduce((sum, row) => sum + usedOf(row), 0);
    return {
      totalGrantedLabel: granted > 0 ? days(granted) : '',
      totalUsedLabel: used > 0 ? days(used) : '',
      totalRemainingLabel: granted > 0 ? days(Math.max(0, granted - used)) : '',
    };
  },
  validate: (_values, rows) =>
    leavesOf(rows).length === 0 ? ['연차 내역을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'LL-20261118-001',
    date: '2026-11-18',
    company: '옷깃 주식회사',
    year: '2026',
    note: '연차는 회계연도 기준으로 부여하며, 미사용 연차는 회사 규정에 따라 이월·소멸 처리합니다.',
  },
  sampleRows: {
    leaves: [
      { name: '김옷깃', hireDate: '2021-03-02', granted: '16', used: '12', note: '' },
      { name: '이개발', hireDate: '2022-01-10', granted: '15', used: '7.5', note: '반차 1회' },
      { name: '박계약', hireDate: '2024-04-01', granted: '11', used: '3', note: '' },
      { name: '최인턴', hireDate: '2025-07-01', granted: '6', used: '2', note: '기간제' },
    ],
  },
  faq: [
    {
      q: '연차 발생 일수는 어떻게 정하나요?',
      a: '입사일과 근속 기간, 회계연도 기준에 따라 달라집니다. 회사 취업규칙과 근로기준법을 확인해 사원별 발생 일수를 적으세요.',
    },
    {
      q: '0.5일도 입력할 수 있나요?',
      a: '네. 발생·사용 칸은 0.5일 단위로 입력할 수 있습니다. 반차·반반차 사용 내역을 비고에 함께 적으면 좋습니다.',
    },
    {
      q: '잔여 연차는 어떻게 계산되나요?',
      a: '발생 연차에서 사용 연차를 뺀 값입니다. 음수가 되지 않도록 0일에서 멈춥니다.',
    },
    {
      q: '연차 사용 촉진은 어떻게 하나요?',
      a: '근로기준법이 정한 절차와 기한에 따라 서면으로 촉진해야 합니다. 회사 규정과 고용노동부 안내를 확인하세요.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 연차휴가 안내',
      href: 'https://www.moel.go.kr/',
    },
  ],
  related: [
    { label: '휴가신청서 양식', href: '/forms/leave-request/' },
    { label: '연차 사용계획서 양식', href: '/forms/leave-plan/' },
    { label: '근로자 명부 양식', href: '/forms/employee-register/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
