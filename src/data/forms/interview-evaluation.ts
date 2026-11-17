import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '평가 항목',
  help: '역량별 점수(5~1점)와 근거를 적습니다. 총점과 평균이 자동으로 계산됩니다.',
  minRows: 4,
  maxRows: 20,
  addLabel: '+ 평가 항목 추가',
  required: true,
  group: '평가 정보',
  summaryField: 'totalLabel',
  summaryLabel: '총점',
  columns: [
    {
      id: 'item',
      label: '평가 항목',
      type: 'text',
      required: true,
      placeholder: '예: 직무 전문성',
      maxLength: 80,
      width: 2.6,
    },
    {
      id: 'score',
      label: '점수',
      type: 'select',
      options: ['5', '4', '3', '2', '1'],
      width: 1,
    },
    {
      id: 'comment',
      label: '근거·의견',
      type: 'text',
      placeholder: '구체적인 사례·근거',
      maxLength: 100,
      width: 3.4,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'IV-20261117-001',
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
    id: 'candidate',
    label: '지원자',
    type: 'text',
    group: '평가 정보',
    required: true,
    placeholder: '김지원',
    maxLength: 30,
  },
  {
    id: 'position',
    label: '지원 직무',
    type: 'text',
    group: '평가 정보',
    required: true,
    placeholder: '예: 문서 자동화 개발자',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '평가 정보',
    placeholder: '개발팀',
    maxLength: 40,
  },
  {
    id: 'interviewer',
    label: '면접관',
    type: 'text',
    group: '평가 정보',
    required: true,
    placeholder: '김면접',
    maxLength: 40,
  },
  {
    id: 'interviewDate',
    label: '면접일',
    type: 'date',
    group: '평가 정보',
    required: true,
  },
  {
    id: 'interviewType',
    label: '면접 구분',
    type: 'select',
    group: '평가 정보',
    options: ['1차 면접', '2차 면접', '최종 면접'],
    defaultValue: '1차 면접',
    required: true,
  },
  {
    id: 'itemCountLabel',
    label: '평가 항목 수',
    type: 'computed',
    group: '평가 정보',
    help: '입력한 평가 항목 수입니다.',
  },
  {
    id: 'totalLabel',
    label: '총점',
    type: 'computed',
    group: '평가 정보',
    help: '항목별 점수의 합계입니다.',
  },
  {
    id: 'averageLabel',
    label: '평균',
    type: 'computed',
    group: '평가 정보',
    help: '총점을 항목 수로 나눈 값입니다.',
  },
  {
    id: 'overall',
    label: '종합 의견',
    type: 'textarea',
    group: '종합 의견',
    placeholder: '강점, 우려 사항, 함께 일했을 때의 기대를 적습니다.',
    required: true,
    maxLength: 800,
    rows: 3,
    span: 3,
  },
  {
    id: 'recommendation',
    label: '채용 의견',
    type: 'select',
    group: '채용 의견',
    options: ['적극 추천', '추천', '보류', '비추천'],
    defaultValue: '추천',
    required: true,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['면접관', '채용 담당자'],
    defaultValue: JSON.stringify([
      { label: '면접관', enabled: true },
      { label: '채용 담당자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.item ?? '').trim());

const scoreOf = (row: Record<string, string>): number => {
  const score = Number(row.score ?? '');
  return Number.isFinite(score) ? score : 0;
};

export const interviewEvaluation: FormTemplate = {
  slug: 'interview-evaluation',
  title: '면접 평가표',
  family: 'hr',
  category: 'people',
  description:
    '지원자의 역량을 5점 척도로 평가하는 면접 평가표를 브라우저에서 작성하고 A4 PDF로 저장합니다. 항목별 근거와 총점·평균, 채용 의견을 한 장에 정리합니다.',
  keywords: [
    '면접 평가표',
    '면접 평가표 양식',
    '채용 면접 평가',
    '면접 평가서',
    '지원자 평가표',
    '면접 평가표 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'IV',
  lead: '지원자의 직무 역량과 조직 적합도를 5점 척도로 평가하는 면접 평가표입니다. 항목별 근거를 남기고 총점·평균과 채용 의견을 자동으로 정리합니다.',
  useCases: [
    '1차·2차 면접에서 지원자를 평가할 때',
    '여러 면접관의 평가를 같은 기준으로 모을 때',
    '채용 결정 회의에 평가 근거를 공유할 때',
    '채용 전형 기록을 남겨야 할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 지원자·직무·면접관 정보를 확인합니다.',
    '평가 항목별 점수(5~1점)와 구체적인 근거를 적습니다.',
    '총점과 평균을 확인하고 종합 의견을 작성합니다.',
    '채용 의견을 고르고 PDF로 내려받아 공유합니다.',
  ],
  notes: [
    '평가 기준을 면접 전에 정해 두면 면접관 간 편차를 줄일 수 있습니다. 예: 5 매우 우수 ~ 1 부족.',
    '출신 지역·나이·성별 등 직무와 무관한 정보는 평가에 사용하지 마세요.',
    '낮은 점수에는 구체적인 근거와 확인이 필요한 부분을 함께 적습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '면접 평가표',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '지원자 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '지원자', field: 'candidate' },
        { label: '지원 직무', field: 'position' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '부서', field: 'department' },
        { label: '면접관', field: 'interviewer' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '면접일', field: 'interviewDate' },
        { label: '면접 구분', field: 'interviewType' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '평가 항목 수', field: 'itemCountLabel' },
        { label: '평균', field: 'averageLabel' },
      ],
    },
    { kind: 'section', title: '평가 항목' },
    {
      kind: 'table',
      columns: [
        { label: '평가 항목', width: 56 },
        { label: '점수', width: 18, align: 'center' },
        { label: '근거·의견', width: 94 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row) => [
          (row.item ?? '').trim(),
          (row.score ?? '').trim(),
          (row.comment ?? '').trim(),
        ]),
      minRows: 4,
    },
    {
      kind: 'totals',
      rows: [
        { label: '총점', field: 'totalLabel' },
        { label: '평균', field: 'averageLabel', strong: true },
      ],
      width: 70,
    },
    { kind: 'section', title: '종합 의견' },
    { kind: 'text', field: 'overall', minLines: 3 },
    { kind: 'section', title: '채용 의견' },
    { kind: 'kv', columns: 1, rows: [{ label: '채용 의견', field: 'recommendation' }] },
    {
      kind: 'signature',
      roles: ['면접관', '채용 담당자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = itemsOf(rows);
    const scored = list.filter((row) => scoreOf(row) > 0);
    const total = scored.reduce((sum, row) => sum + scoreOf(row), 0);
    const average = scored.length > 0 ? total / scored.length : 0;
    return {
      itemCountLabel: list.length > 0 ? `${list.length}개` : '',
      totalLabel: scored.length > 0 ? `${total}점` : '',
      averageLabel: scored.length > 0 ? `${average.toFixed(1)}점` : '',
    };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) errors.push('평가 항목을 한 줄 이상 입력하세요.');
    if (list.some((row) => scoreOf(row) <= 0)) {
      errors.push('모든 평가 항목에 점수를 선택하세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'IV-20261117-001',
    date: '2026-11-17',
    candidate: '김지원',
    position: '문서 자동화 개발자',
    department: '개발팀',
    interviewer: '김면접',
    interviewDate: '2026-11-20',
    interviewType: '1차 면접',
    overall:
      '문서 엔진을 직접 만들어 본 경험이 구체적이었습니다. 문제를 작게 나누어 확인하는 태도가 좋았고, 협업 도구 경험도 충분합니다. 다만 대규모 트래픽 경험은 확인이 더 필요합니다.',
    recommendation: '추천',
  },
  sampleRows: {
    items: [
      { item: '직무 전문성', score: '5', comment: 'PDF·HWPX 생성 경험을 구체적으로 설명함' },
      { item: '경험·성과', score: '4', comment: '유사 프로젝트 2건, 성과 수치를 제시함' },
      { item: '문제 해결', score: '4', comment: '장애 원인을 단계적으로 좁히는 접근이 좋음' },
      { item: '소통·협업', score: '5', comment: '질문을 명확히 하고 경청함' },
      { item: '조직 적합도', score: '4', comment: '작은 팀에서 주도적으로 일한 경험' },
    ],
  },
  faq: [
    {
      q: '면접 평가표는 누가 작성하나요?',
      a: '면접을 진행한 면접관이 작성하는 것이 일반적입니다. 여러 명이 평가하면 각자 작성한 뒤 기준과 점수를 함께 검토하세요.',
    },
    {
      q: '점수 기준은 어떻게 정하나요?',
      a: '5점 척도를 사용할 때 “5 매우 우수, 4 우수, 3 보통, 2 부족, 1 미흡”처럼 기준을 미리 정하고 지원자에게도 안내할 수 있습니다.',
    },
    {
      q: '총점과 평균은 어떻게 계산되나요?',
      a: '점수가 입력된 항목의 합계와 평균을 계산합니다. 점수가 비어 있는 항목은 평균에서 제외됩니다.',
    },
    {
      q: '채용 의견은 어떻게 적나요?',
      a: '적극 추천·추천·보류·비추천 중 하나를 고르고, 종합 의견에 강점과 확인이 필요한 부분을 구체적으로 적습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 채용절차의 공정화에 관한 법률 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '국가법령정보센터 — 채용절차의 공정화에 관한 법률',
      href: 'https://www.law.go.kr/',
    },
  ],
  related: [
    { label: '채용공고 양식', href: '/forms/recruitment/' },
    { label: '입사지원서 양식', href: '/forms/job-application/' },
    { label: '합격 통보서 양식', href: '/forms/offer-notice/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
