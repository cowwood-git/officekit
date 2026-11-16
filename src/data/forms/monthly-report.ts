import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const tasks: RepeatGroup = {
  id: 'tasks',
  label: '이달 업무',
  help: '업무·상태·진행률을 입력합니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 3,
  maxRows: 30,
  addLabel: '+ 업무 추가',
  columns: [
    {
      id: 'task',
      label: '업무',
      type: 'text',
      required: true,
      placeholder: '예: 11월 정산 마감',
      maxLength: 80,
      width: 3,
    },
    {
      id: 'status',
      label: '상태',
      type: 'select',
      options: ['진행 전', '진행 중', '완료', '보류'],
      width: 1.2,
    },
    {
      id: 'progress',
      label: '진행률',
      type: 'number',
      placeholder: '0~100',
      width: 1,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '이슈·산출물',
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
    group: '기본 정보',
    placeholder: 'MR-20261117-001',
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
    id: 'name',
    label: '성명',
    type: 'text',
    group: '작성자',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '작성자',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'position',
    label: '직위',
    type: 'text',
    group: '작성자',
    placeholder: '대리',
    maxLength: 30,
  },
  {
    id: 'period',
    label: '보고 월',
    type: 'text',
    group: '보고 기간',
    placeholder: '2026년 11월',
    required: true,
    maxLength: 20,
  },
  {
    id: 'doneLabel',
    label: '완료 현황',
    type: 'computed',
    group: '보고 기간',
    help: '완료한 업무 수를 표시합니다.',
  },
  {
    id: 'progressAvg',
    label: '평균 진행률',
    type: 'computed',
    group: '보고 기간',
    help: '진행률을 입력한 업무의 평균입니다.',
  },
  {
    id: 'summary',
    label: '이달 요약',
    type: 'textarea',
    group: '이달 요약',
    placeholder: '이달의 주요 성과와 진행 상황을 3~5줄로 정리합니다.',
    required: true,
    maxLength: 800,
    rows: 4,
    span: 3,
  },
  {
    id: 'issues',
    label: '이슈·지원 필요',
    type: 'textarea',
    group: '이슈와 계획',
    placeholder: '막힌 일, 의사결정이 필요한 일, 지원 요청',
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'nextPlan',
    label: '다음 달 계획',
    type: 'textarea',
    group: '이슈와 계획',
    placeholder: '다음 달에 시작하거나 마무리할 일',
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재',
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
    help: '최대 5개까지 선택할 수 있고, 이름을 직접 고칠 수 있습니다. 선택한 순서대로 문서에 표시됩니다.',
    span: 3,
  },
];

const tableRows = (rows: FormRows): readonly (readonly string[])[] => {
  const list = (rows.tasks ?? []).filter((row) => (row.task ?? '').trim());
  return list.map((row, index) => [
    String(index + 1),
    (row.task ?? '').trim(),
    (row.status ?? '').trim(),
    (row.progress ?? '').trim() ? `${(row.progress ?? '').trim()}%` : '',
    (row.note ?? '').trim(),
  ]);
};

export const monthlyReport: FormTemplate = {
  slug: 'monthly-report',
  title: '월간업무보고',
  family: 'report',
  category: 'report',
  description:
    '한 달의 업무와 진행률, 주요 성과, 이슈와 다음 달 계획을 정리하는 월간업무보고를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '월간업무보고',
    '월간업무보고 양식',
    '월간 보고서',
    '월간 업무 보고서',
    '업무 보고서 PDF',
    '월간보고 양식',
  ],
  updated: '2026-11-17',
  docPrefix: 'MR',
  lead: '한 달 동안의 업무와 진행률을 표로 정리하고, 주요 성과·이슈·다음 달 계획을 한 장에 담는 월간업무보고입니다.',
  useCases: [
    '매월 부서 업무 실적을 보고할 때',
    '월간 목표와 진행률을 정리할 때',
    '이슈와 지원 필요 사항을 함께 올릴 때',
    '다음 달 계획을 결재받을 때',
  ],
  howTo: [
    '문서 번호와 작성일, 작성자 정보를 확인합니다.',
    '보고 월을 적고 이달 업무를 한 줄씩 추가합니다. 완료 현황과 평균 진행률은 자동으로 계산됩니다.',
    '이달 요약, 이슈·지원 필요, 다음 달 계획을 적습니다.',
    '결재선을 고른 뒤 PDF로 내려받습니다.',
  ],
  notes: [
    '이 양식은 참고용입니다. 보고 주기와 결재 절차, 문서 보존 기간은 회사의 규정을 따르세요.',
    '업무 진행률은 0~100 사이 숫자로 적습니다. 진척을 정확히 알 수 없으면 비고에 사유를 적으세요.',
    '주간보고를 매주 쓰는 조직이라면 월간보고에는 주간보고를 요약해 담는 것이 좋습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [tasks],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '월간업무보고',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '작성자' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '성명', field: 'name' },
        { label: '부서', field: 'department' },
        { label: '직위', field: 'position' },
      ],
    },
    { kind: 'section', title: '보고 기간' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '보고 월', field: 'period' },
        { label: '완료 현황', field: 'doneLabel' },
        { label: '평균 진행률', field: 'progressAvg' },
      ],
    },
    { kind: 'section', title: '이달 업무' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 12, align: 'center' },
        { label: '업무', width: 80 },
        { label: '상태', width: 24, align: 'center' },
        { label: '진행률', width: 22, align: 'right' },
        { label: '비고', width: 36 },
      ],
      rows: (_values, rows) => tableRows(rows),
      minRows: 3,
    },
    { kind: 'section', title: '이달 요약' },
    { kind: 'text', field: 'summary', minLines: 4 },
    { kind: 'section', title: '이슈·지원 필요' },
    { kind: 'text', field: 'issues', minLines: 3 },
    { kind: 'section', title: '다음 달 계획' },
    { kind: 'text', field: 'nextPlan', minLines: 3 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = (rows.tasks ?? []).filter((row) => (row.task ?? '').trim());
    const done = list.filter((row) => (row.status ?? '').trim() === '완료').length;
    const progressValues = list
      .map((row) => Number((row.progress ?? '').trim()))
      .filter((value) => Number.isFinite(value) && value >= 0 && value <= 100);
    const average = progressValues.length
      ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
      : 0;
    return {
      doneLabel: list.length > 0 ? `${done} / ${list.length} 완료` : '',
      progressAvg: progressValues.length > 0 ? `평균 ${average}%` : '',
    };
  },
  validate: (_values, rows) => {
    const invalid = (rows.tasks ?? []).some((row) => {
      const raw = (row.progress ?? '').trim();
      if (!raw) return false;
      const value = Number(raw);
      return !Number.isFinite(value) || value < 0 || value > 100;
    });
    return invalid ? ['진행률은 0~100 사이 숫자로 입력하세요.'] : [];
  },
  sample: {
    docNo: 'MR-20261117-001',
    date: '2026-11-17',
    name: '김옷깃',
    department: '경영지원팀',
    position: '대리',
    period: '2026년 11월',
    summary:
      '11월 정산 마감과 신규 문서 양식 시범 적용을 완료했습니다. 휴가·회의록·지출 양식을 표준화했고, 거래처 정산 기준은 확인 중입니다.',
    issues: '거래처별 정산 기준이 달라 확인에 시간이 걸립니다. 공통 기준표가 필요합니다.',
    nextPlan: '12월에는 정산 기준표 초안을 만들고, 발주서·납품확인서 양식까지 표준화를 확대합니다.',
  },
  sampleRows: {
    tasks: [
      { task: '11월 정산 마감', status: '완료', progress: '100', note: '이상 없음' },
      { task: '신규 양식 시범 적용', status: '진행 중', progress: '70', note: '휴가·회의록 완료' },
      { task: '거래처 정산 기준 정리', status: '보류', progress: '20', note: '기준 확인 필요' },
    ],
  },
  faq: [
    {
      q: '월간업무보고에는 무엇을 적어야 하나요?',
      a: '이달 업무와 상태·진행률, 주요 성과, 이슈·지원 필요, 다음 달 계획을 적으면 충분합니다. 주간보고가 있다면 핵심만 요약하세요.',
    },
    {
      q: '주간업무보고와 무엇이 다른가요?',
      a: '주간보고는 이번 주 실행과 다음 주 계획에, 월간보고는 한 달의 성과와 흐름, 다음 달 방향에 초점을 둡니다. 같은 업무 표를 쓰되 기간과 요약이 다릅니다.',
    },
    {
      q: '진행률은 어떻게 계산하나요?',
      a: '업무별로 0~100 사이 숫자를 적으면 완료 현황과 평균 진행률이 자동으로 계산됩니다. 진척을 알 수 없으면 비고에 사유를 적으세요.',
    },
    {
      q: '결재선은 어떻게 정하나요?',
      a: '회사의 전결 규정에 따라 작성자·팀장·부서장·대표 중 필요한 사람을 고릅니다. 팀 단위 보고라면 팀장까지, 부서 전체라면 부서장을 포함하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '행정안전부 — 문서 관리 안내',
      href: 'https://www.mois.go.kr/',
    },
  ],
  related: [
    { label: '주간업무보고 양식', href: '/forms/weekly-report/' },
    { label: '기안서 양식', href: '/forms/draft/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
