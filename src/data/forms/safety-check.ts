import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '점검 항목',
  help: '점검 항목별 결과와 조치 내용을 적습니다. 보완·즉시 조치 건수가 자동으로 계산됩니다.',
  minRows: 3,
  maxRows: 30,
  addLabel: '+ 점검 항목 추가',
  required: true,
  group: '점검 정보',
  summaryField: 'issueCountLabel',
  summaryLabel: '보완 건수',
  columns: [
    {
      id: 'item',
      label: '점검 항목',
      type: 'text',
      required: true,
      placeholder: '예: 개구부 방호 상태',
      maxLength: 80,
      width: 3.2,
    },
    {
      id: 'result',
      label: '결과',
      type: 'select',
      options: ['양호', '보완 필요', '즉시 조치'],
      width: 1.4,
    },
    {
      id: 'action',
      label: '조치 내용',
      type: 'text',
      placeholder: '필요한 조치',
      maxLength: 80,
      width: 2.6,
    },
    {
      id: 'owner',
      label: '담당',
      type: 'text',
      placeholder: '담당자',
      maxLength: 30,
      width: 1,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'SC-20261117-001',
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
    id: 'checkDate',
    label: '점검일',
    type: 'date',
    group: '점검 정보',
    required: true,
  },
  {
    id: 'manager',
    label: '점검자',
    type: 'text',
    group: '점검 정보',
    required: true,
    placeholder: '김안전',
    maxLength: 30,
  },
  {
    id: 'site',
    label: '점검 대상',
    type: 'text',
    group: '점검 정보',
    required: true,
    placeholder: '예: 판교 신축 현장',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'location',
    label: '점검 위치',
    type: 'text',
    group: '점검 정보',
    placeholder: '예: 3층 동측',
    maxLength: 60,
  },
  {
    id: 'recheckDate',
    label: '재점검일',
    type: 'date',
    group: '점검 정보',
    help: '보완이 필요한 항목의 재점검 예정일입니다.',
  },
  {
    id: 'issueCountLabel',
    label: '보완 건수',
    type: 'computed',
    group: '점검 정보',
    help: '보완 필요·즉시 조치 항목의 수입니다.',
  },
  {
    id: 'issues',
    label: '지적 사항',
    type: 'textarea',
    group: '지적 사항',
    placeholder: '발견한 위험 요소와 위치를 구체적으로 적습니다.',
    maxLength: 600,
    rows: 2,
    span: 3,
  },
  {
    id: 'plan',
    label: '조치 계획',
    type: 'textarea',
    group: '조치 계획',
    placeholder: '조치 내용, 담당자, 완료 예정일',
    maxLength: 600,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['점검자', '안전관리자', '현장소장', '부서장', '대표'],
    defaultValue: JSON.stringify([
      { label: '점검자', enabled: true },
      { label: '안전관리자', enabled: true },
      { label: '현장소장', enabled: false },
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

const isIssue = (row: Record<string, string>): boolean =>
  row.result === '보완 필요' || row.result === '즉시 조치';

export const safetyCheck: FormTemplate = {
  slug: 'safety-check',
  title: '안전점검일지',
  family: 'operations',
  category: 'report',
  description:
    '현장·사업장의 안전점검 결과와 지적 사항, 조치 계획을 기록하는 안전점검일지를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '안전점검일지',
    '안전점검일지 양식',
    '현장 안전점검',
    '안전점검표',
    '보완 조치 기록',
    '안전점검일지 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'SF',
  lead: '현장의 안전 상태를 항목별로 점검하고 결과·조치를 남기는 일지입니다. 보완이 필요한 항목 수를 자동으로 세어 재점검 계획을 세울 수 있습니다.',
  useCases: [
    '현장 일일·주간 안전점검을 기록할 때',
    '위험 요소와 보완 조치를 남길 때',
    '재점검 일정과 담당자를 정할 때',
    '발주처·안전관리자에게 점검 결과를 보고할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 점검 정보를 확인합니다.',
    '점검 항목별 결과(양호·보완 필요·즉시 조치)를 고릅니다.',
    '지적 사항과 조치 계획, 담당자를 적습니다.',
    '보완 건수를 확인하고 PDF로 내려받아 서명·보관합니다.',
  ],
  notes: [
    '이 양식은 점검 기록을 돕는 보조 자료입니다. 산업안전보건법·중대재해처벌법 등 법적 의무와 회사의 안전보건 절차를 따르세요.',
    '즉시 조치가 필요한 위험은 작업을 중지하고 안전관리자에게 보고한 뒤 기록하세요.',
    '점검 사진과 교육 기록을 함께 보관하면 이행 확인에 도움이 됩니다.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '안전점검일지',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '점검 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '점검일', field: 'checkDate' },
        { label: '점검자', field: 'manager' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '점검 대상', field: 'site' },
        { label: '점검 위치', field: 'location' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '재점검일', field: 'recheckDate' },
        { label: '보완 건수', field: 'issueCountLabel' },
      ],
    },
    { kind: 'section', title: '점검 항목' },
    {
      kind: 'table',
      columns: [
        { label: '점검 항목', width: 70 },
        { label: '결과', width: 30, align: 'center' },
        { label: '조치 내용', width: 54 },
        { label: '담당', width: 20 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row) => [
          (row.item ?? '').trim(),
          (row.result ?? '').trim(),
          (row.action ?? '').trim(),
          (row.owner ?? '').trim(),
        ]),
      minRows: 4,
    },
    { kind: 'section', title: '지적 사항' },
    { kind: 'text', field: 'issues', minLines: 2 },
    { kind: 'section', title: '조치 계획' },
    { kind: 'text', field: 'plan', minLines: 2 },
    {
      kind: 'signature',
      roles: ['점검자', '안전관리자', '현장소장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const count = itemsOf(rows).filter(isIssue).length;
    return { issueCountLabel: count > 0 ? `${count}건` : '0건' };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    return list.length === 0 ? ['점검 항목을 한 줄 이상 입력하세요.'] : [];
  },
  sample: {
    docNo: 'SC-20261117-001',
    date: '2026-11-17',
    checkDate: '2026-11-17',
    manager: '김안전',
    site: '판교 신축 현장',
    location: '3층 동측',
    recheckDate: '2026-11-19',
    issues:
      '3층 계단 개구부 방호 덮개 1개가 고정되지 않았고, 통로에 전선이 일부 노출되어 있었습니다.',
    plan: '개구부 덮개를 즉시 고정하고 전선 정리 후 덮개를 설치합니다. 담당은 박현장, 완료 예정일은 11월 18일입니다.',
  },
  sampleRows: {
    items: [
      {
        item: '보호구 착용 상태',
        result: '양호',
        action: '',
        owner: '김안전',
      },
      {
        item: '개구부 방호 덮개',
        result: '즉시 조치',
        action: '덮개 고정 및 표지 설치',
        owner: '박현장',
      },
      {
        item: '통로 전선 정리',
        result: '보완 필요',
        action: '전선 덮개 설치',
        owner: '박현장',
      },
      {
        item: '소화기 압력 상태',
        result: '양호',
        action: '',
        owner: '김안전',
      },
    ],
  },
  faq: [
    {
      q: '안전점검일지는 얼마나 자주 써야 하나요?',
      a: '사업장·현장의 위험도와 회사 규정에 따라 다릅니다. 일반적으로 일일 또는 주간 점검을 기록하며, 위험 작업 전에는 별도 점검을 합니다.',
    },
    {
      q: '점검 결과는 어떻게 고르나요?',
      a: '문제가 없으면 “양호”, 개선이 필요하면 “보완 필요”, 즉시 위험이 있으면 “즉시 조치”를 고릅니다. 즉시 조치 항목은 작업 중지·보고 대상입니다.',
    },
    {
      q: '보완 건수는 어떻게 계산되나요?',
      a: '보완 필요·즉시 조치로 표시한 항목 수를 자동으로 셉니다. 양호 항목은 제외됩니다.',
    },
    {
      q: '법적 효력이 있나요?',
      a: '점검 사실을 남기는 기록으로 활용할 수 있지만, 법적 의무 이행은 회사의 안전보건 관리체계와 관련 법령에 따라야 합니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 산업안전보건법 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '안전보건공단',
      href: 'https://www.kosha.or.kr/',
    },
  ],
  related: [
    { label: '작업일보 양식', href: '/forms/work-daily/' },
    { label: '시설물 점검표 양식', href: '/forms/facility-check/' },
    { label: '일일업무일지 양식', href: '/forms/work-log/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
