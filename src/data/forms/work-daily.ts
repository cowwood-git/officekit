import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const workers: RepeatGroup = {
  id: 'workers',
  label: '투입 인력',
  help: '업체·직종별 투입 인원을 적습니다. 총 인원이 자동으로 계산됩니다.',
  minRows: 2,
  maxRows: 20,
  addLabel: '+ 인력 추가',
  required: true,
  group: '작업 내용',
  summaryField: 'totalWorkersLabel',
  summaryLabel: '총 인원',
  columns: [
    {
      id: 'company',
      label: '업체',
      type: 'text',
      placeholder: '예: 옷깃건설',
      maxLength: 50,
      width: 2,
    },
    {
      id: 'trade',
      label: '직종',
      type: 'text',
      required: true,
      placeholder: '예: 철근공',
      maxLength: 40,
      width: 1.8,
    },
    {
      id: 'count',
      label: '인원',
      type: 'number',
      required: true,
      placeholder: '1',
      width: 0.9,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '특이 사항',
      maxLength: 40,
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
    placeholder: 'WD-20261117-001',
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
    id: 'site',
    label: '현장명',
    type: 'text',
    group: '작업 정보',
    required: true,
    placeholder: '예: 판교 신축 현장',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'client',
    label: '발주처',
    type: 'text',
    group: '작업 정보',
    placeholder: '예: 거래처 주식회사',
    maxLength: 60,
  },
  {
    id: 'workDate',
    label: '작업일',
    type: 'date',
    group: '작업 정보',
    required: true,
  },
  {
    id: 'manager',
    label: '작성자',
    type: 'text',
    group: '작업 정보',
    required: true,
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'weather',
    label: '날씨',
    type: 'select',
    group: '작업 정보',
    options: ['맑음', '흐림', '비', '눈', '기타'],
    defaultValue: '맑음',
  },
  {
    id: 'totalWorkersLabel',
    label: '총 인원',
    type: 'computed',
    group: '작업 정보',
    help: '투입 인력의 합계입니다.',
  },
  {
    id: 'tasks',
    label: '작업 내용',
    type: 'textarea',
    group: '작업 내용',
    placeholder: '오늘 진행한 작업과 완료 범위를 적습니다.',
    required: true,
    maxLength: 800,
    rows: 3,
    span: 3,
  },
  {
    id: 'safety',
    label: '안전 조치',
    type: 'textarea',
    group: '안전 조치',
    placeholder: '안전 교육, 보호구 착용, 위험 요소 조치 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'note',
    label: '특이사항',
    type: 'textarea',
    group: '특이사항',
    placeholder: '지연·중단 사유, 장비 고장, 다음 작업 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['작성자', '현장소장', '팀장', '부서장', '대표'],
    defaultValue: JSON.stringify([
      { label: '작성자', enabled: true },
      { label: '현장소장', enabled: true },
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

const workersOf = (rows: FormRows): FormRows['workers'] =>
  (rows.workers ?? []).filter((row) => (row.trade ?? '').trim());

const countOf = (row: Record<string, string>): number => {
  const count = Number((row.count ?? '').replace(/,/g, ''));
  return Number.isFinite(count) ? count : 0;
};

export const workDaily: FormTemplate = {
  slug: 'work-daily',
  title: '작업일보',
  family: 'operations',
  category: 'report',
  description:
    '현장 작업 내용과 투입 인력, 안전 조치, 특이사항을 매일 기록하는 작업일보를 브라우저에서 작성하고 A4 PDF로 저장합니다. 총 인원이 자동 계산됩니다.',
  keywords: [
    '작업일보',
    '작업일보 양식',
    '현장 작업일보',
    '일일 작업일보',
    '건설 작업일보',
    '작업일보 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'WD',
  lead: '현장에서 하루 동안 진행한 작업과 투입 인력, 안전 조치를 기록하는 일보입니다. 업체·직종별 인원을 표로 정리하고 총 인원을 자동으로 계산합니다.',
  useCases: [
    '현장 작업 진행 상황을 매일 기록할 때',
    '투입 인력과 장비를 정리해 보고할 때',
    '안전 조치와 특이사항을 남길 때',
    '발주처·본사에 일일 진행을 공유할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 현장 정보를 확인합니다.',
    '작업일과 작성자, 날씨를 적고 작업 내용을 정리합니다.',
    '업체·직종별 투입 인원을 입력하면 총 인원이 자동으로 계산됩니다.',
    '안전 조치와 특이사항을 적고 PDF로 내려받습니다.',
  ],
  notes: [
    '작업 내용과 인원은 실제 현장 기록과 일치해야 합니다. 안전 조치 내용은 현장 교육·점검 기록과 함께 보관하세요.',
    '위험 작업·중대재해 관련 사항은 회사의 안전보건 절차에 따라 별도 보고하세요.',
    '날씨·장비 고장 등으로 작업이 중단된 경우 특이사항에 사유와 시간을 적으세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [workers],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '작업일보',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '작업 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '현장명', field: 'site' },
        { label: '발주처', field: 'client' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '작업일', field: 'workDate' },
        { label: '작성자', field: 'manager' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '날씨', field: 'weather' },
        { label: '총 인원', field: 'totalWorkersLabel' },
      ],
    },
    { kind: 'section', title: '작업 내용' },
    { kind: 'text', field: 'tasks', minLines: 3 },
    { kind: 'section', title: '투입 인력' },
    {
      kind: 'table',
      columns: [
        { label: '업체', width: 58 },
        { label: '직종', width: 52 },
        { label: '인원', width: 20, align: 'right' },
        { label: '비고', width: 44 },
      ],
      rows: (_values, rows) =>
        workersOf(rows).map((row) => [
          (row.company ?? '').trim(),
          (row.trade ?? '').trim(),
          row.count ? String(countOf(row)) : '',
          (row.note ?? '').trim(),
        ]),
      minRows: 3,
    },
    { kind: 'section', title: '안전 조치' },
    { kind: 'text', field: 'safety', minLines: 2 },
    { kind: 'section', title: '특이사항' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '현장소장', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const total = workersOf(rows).reduce((sum, row) => sum + countOf(row), 0);
    return { totalWorkersLabel: total > 0 ? `${total}명` : '' };
  },
  validate: (_values, rows) => {
    const list = workersOf(rows);
    const errors: string[] = [];
    if (list.length === 0) {
      errors.push('투입 인력을 한 줄 이상 입력하세요.');
    }
    if (list.some((row) => countOf(row) <= 0)) {
      errors.push('인원은 1명 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'WD-20261117-001',
    date: '2026-11-17',
    site: '판교 신축 현장',
    client: '거래처 주식회사',
    workDate: '2026-11-17',
    manager: '김옷깃',
    weather: '맑음',
    tasks:
      '3층 슬라브 철근 배근과 거푸집 설치를 진행했습니다. 오전에는 자재 반입과 안전 교육을 마쳤고, 오후에는 배근 70%를 완료했습니다.',
    safety:
      '작업 전 안전 교육 10분 실시. 전 인원 안전모·안전화·장갑 착용 확인. 3층 개구부 방호 덮개 설치 상태를 점검했습니다.',
    note: '오후 3시경 레미콘 차량 1대가 지연되어 타설은 내일로 순연했습니다.',
  },
  sampleRows: {
    workers: [
      { company: '옷깃건설', trade: '철근공', count: '6', note: '' },
      { company: '옷깃건설', trade: '형틀목공', count: '4', note: '' },
      { company: '한빛전기', trade: '전기공', count: '2', note: '배관 확인' },
    ],
  },
  faq: [
    {
      q: '작업일보에는 무엇을 적어야 하나요?',
      a: '작업일·현장·작업 내용·투입 인력·안전 조치·특이사항을 적습니다. 실제 작업과 인원을 기준으로 기록하세요.',
    },
    {
      q: '총 인원은 어떻게 계산되나요?',
      a: '직종별 인원을 더해 표시합니다. 업체가 달라도 인원은 합산되므로 업체별 합계가 필요하면 비고에 따로 적으세요.',
    },
    {
      q: '안전 조치에는 무엇을 쓰나요?',
      a: '작업 전 교육, 보호구 착용 확인, 위험 요소 조치, 점검 결과 등을 적습니다. 회사의 안전점검일지와 함께 보관하면 좋습니다.',
    },
    {
      q: '작업이 중단되면 어떻게 적나요?',
      a: '특이사항에 중단 사유(날씨·자재·장비 등)와 시간, 재개 예정일을 적습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 산업안전보건 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '안전보건공단',
      href: 'https://www.kosha.or.kr/',
    },
  ],
  related: [
    { label: '안전점검일지 양식', href: '/forms/safety-check/' },
    { label: '일일업무일지 양식', href: '/forms/work-log/' },
    { label: '시설물 점검표 양식', href: '/forms/facility-check/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
