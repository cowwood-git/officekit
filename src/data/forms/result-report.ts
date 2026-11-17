import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const metrics: RepeatGroup = {
  id: 'metrics',
  label: '성과 지표',
  group: '내용',
  help: '목표와 실제 실적을 나란히 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 2,
  maxRows: 20,
  addLabel: '+ 지표 추가',
  columns: [
    {
      id: 'item',
      label: '지표',
      type: 'text',
      required: true,
      placeholder: '예: 상담 신청 전환율',
      maxLength: 50,
      width: 2.6,
    },
    {
      id: 'target',
      label: '목표',
      type: 'text',
      placeholder: '예: 12%',
      maxLength: 30,
      width: 1.1,
    },
    {
      id: 'actual',
      label: '실적',
      type: 'text',
      placeholder: '예: 10.2%',
      maxLength: 30,
      width: 1.1,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '측정 기준 등',
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
    placeholder: 'RR-20261117-001',
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
    id: 'title',
    label: '보고서 제목',
    type: 'text',
    group: '개요',
    required: true,
    placeholder: '예: 홈페이지 리뉴얼 결과보고',
    maxLength: 100,
    span: 3,
  },
  {
    id: 'projectName',
    label: '프로젝트명',
    type: 'text',
    group: '개요',
    placeholder: '예: 홈페이지 리뉴얼',
    maxLength: 100,
  },
  {
    id: 'author',
    label: '작성자',
    type: 'text',
    group: '개요',
    required: true,
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '개요',
    placeholder: '개발팀',
    maxLength: 40,
  },
  {
    id: 'periodFrom',
    label: '시작일',
    type: 'date',
    group: '개요',
    required: true,
  },
  {
    id: 'periodTo',
    label: '종료일',
    type: 'date',
    group: '개요',
    required: true,
  },
  {
    id: 'goal',
    label: '목표',
    type: 'textarea',
    group: '내용',
    placeholder: '프로젝트 시작 시 정한 목표를 적습니다.',
    required: true,
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'results',
    label: '주요 결과',
    type: 'textarea',
    group: '내용',
    placeholder: '무엇을 완료했고 어떤 성과가 있었는지 구체적으로 적습니다.',
    required: true,
    maxLength: 1200,
    rows: 4,
    span: 3,
  },
  {
    id: 'issues',
    label: '문제·개선',
    type: 'textarea',
    group: '평가',
    placeholder: '진행 중 발생한 문제와 개선할 점',
    maxLength: 600,
    rows: 2,
    span: 3,
  },
  {
    id: 'nextSteps',
    label: '향후 계획',
    type: 'textarea',
    group: '평가',
    placeholder: '후속 작업, 운영 계획, 담당자',
    maxLength: 600,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['작성자', '팀장', '부서장'],
    defaultValue: JSON.stringify([
      { label: '작성자', enabled: true },
      { label: '팀장', enabled: true },
      { label: '부서장', enabled: false },
    ]),
    required: true,
    maxSelected: 3,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const metricsOf = (rows: FormRows): FormRows['metrics'] =>
  (rows.metrics ?? []).filter((row) => (row.item ?? '').trim());

export const resultReport: FormTemplate = {
  slug: 'result-report',
  title: '결과보고서',
  family: 'report',
  category: 'report',
  description:
    '프로젝트·업무가 끝난 뒤 목표 대비 결과와 성과 지표, 문제점, 향후 계획을 정리하는 결과보고서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '결과보고서',
    '결과보고서 양식',
    '프로젝트 결과보고',
    '업무 결과 보고',
    '성과 보고서',
    '결과보고서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'RJ',
  lead: '프로젝트나 업무를 마무리하며 목표와 실제 결과를 비교하는 보고서입니다. 주요 결과와 성과 지표, 문제점, 향후 계획을 한 장에 정리합니다.',
  useCases: [
    '프로젝트 종료 후 결과를 보고할 때',
    '목표 대비 실적을 정리해 평가받을 때',
    '후속 업무와 운영 계획을 공유할 때',
    '발주처·내부 이해관계자에게 최종 보고를 할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 보고서 제목을 확인합니다.',
    '프로젝트명과 작성자, 수행 기간을 적습니다.',
    '목표와 주요 결과를 적고 성과 지표의 목표·실적을 입력합니다.',
    '문제·개선점과 향후 계획을 정리해 PDF로 내려받습니다.',
  ],
  notes: [
    '결과는 가능한 한 수치와 증빙으로 뒷받침하세요. 지표의 측정 기준과 기간을 비고에 적으면 좋습니다.',
    '목표를 달성하지 못한 항목도 숨기지 말고 원인과 개선 방안을 함께 적으세요.',
    '후속 업무는 담당자와 일정을 구체적으로 적어 실행으로 이어지게 합니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [metrics],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '결과보고서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '개요' },
    { kind: 'kv', columns: 1, rows: [{ label: '보고서 제목', field: 'title' }] },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '프로젝트명', field: 'projectName' },
        { label: '작성자', field: 'author' },
        { label: '부서', field: 'department' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '시작일', field: 'periodFrom' },
        { label: '종료일', field: 'periodTo' },
      ],
    },
    { kind: 'section', title: '목표' },
    { kind: 'text', field: 'goal', minLines: 1 },
    { kind: 'section', title: '주요 결과' },
    { kind: 'text', field: 'results', minLines: 3 },
    { kind: 'section', title: '성과 지표' },
    {
      kind: 'table',
      columns: [
        { label: '지표', width: 70 },
        { label: '목표', width: 36, align: 'right' },
        { label: '실적', width: 36, align: 'right' },
        { label: '비고', width: 32 },
      ],
      rows: (_values, rows) =>
        metricsOf(rows).map((row) => [
          (row.item ?? '').trim(),
          (row.target ?? '').trim(),
          (row.actual ?? '').trim(),
          (row.note ?? '').trim(),
        ]),
      minRows: 2,
    },
    { kind: 'section', title: '문제·개선' },
    { kind: 'text', field: 'issues', minLines: 2 },
    { kind: 'section', title: '향후 계획' },
    { kind: 'text', field: 'nextSteps', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장', '부서장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  validate: (values) => {
    const errors: string[] = [];
    if (values.periodFrom && values.periodTo && values.periodTo < values.periodFrom) {
      errors.push('종료일은 시작일보다 빠를 수 없습니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'RR-20261117-001',
    date: '2026-11-17',
    title: '홈페이지 리뉴얼 결과보고',
    projectName: '홈페이지 리뉴얼',
    author: '김옷깃',
    department: '개발팀',
    periodFrom: '2026-09-01',
    periodTo: '2026-11-10',
    goal: '반응형 홈페이지로 개편하고 상담 신청 전환율을 12%까지 높입니다.',
    results:
      'PC·모바일 화면 개편과 상담 신청 폼 개선을 완료했습니다. 오픈 후 4주간 상담 신청이 84건으로 이전 같은 기간(61건)보다 37% 늘었고, 페이지 평균 로딩 시간은 4.2초에서 1.8초로 줄었습니다.',
    issues:
      '오픈 직후 모바일에서 폼 제출 오류가 3건 발생했습니다. 입력값 검증을 보강해 재발을 막았고, 배포 전 모바일 테스트 항목을 체크리스트에 추가했습니다.',
    nextSteps:
      '12월까지 상담 데이터 대시보드를 구축하고, 1월에 A/B 테스트로 메인 배너 문구를 개선합니다. 담당은 김옷깃, 이데이터입니다.',
  },
  sampleRows: {
    metrics: [
      { item: '상담 신청 전환율', target: '12%', actual: '10.2%', note: '오픈 후 4주' },
      { item: '페이지 평균 로딩', target: '2초 이하', actual: '1.8초', note: '모바일 4G' },
      { item: '오픈 후 오류', target: '0건', actual: '3건', note: '폼 검증 보강' },
    ],
  },
  faq: [
    {
      q: '결과보고서와 주간·월간보고는 무엇이 다른가요?',
      a: '주간·월간보고는 진행 중인 업무를 공유하고, 결과보고서는 프로젝트나 업무가 끝난 뒤 목표 대비 결과를 정리합니다. 최종 보고·평가 자료로 씁니다.',
    },
    {
      q: '성과 지표는 꼭 넣어야 하나요?',
      a: '필수는 아니지만 목표와 실적을 수치로 비교하면 결과를 설득력 있게 전달할 수 있습니다. 측정 기준과 기간을 비고에 적으세요.',
    },
    {
      q: '목표를 달성하지 못했을 때는 어떻게 적나요?',
      a: '달성률과 원인을 사실대로 적고, 개선 방안과 후속 계획을 함께 제시하세요. 문제를 숨기기보다 다음 실행을 보여 주는 것이 중요합니다.',
    },
    {
      q: '발주처에 제출할 때 주의할 점이 있나요?',
      a: '계약상 보고 형식이 있으면 그 기준을 따르고, 민감한 내부 정보는 제외하세요. 제출 전 담당자 검수를 거치는 것이 좋습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '한국프로젝트경영협회 — 프로젝트 관리 안내',
      href: 'https://www.kpma.or.kr/',
    },
  ],
  related: [
    { label: '프로젝트 착수보고서 양식', href: '/forms/project-kickoff/' },
    { label: '주간업무보고 양식', href: '/forms/weekly-report/' },
    { label: '월간업무보고 양식', href: '/forms/monthly-report/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
