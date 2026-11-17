import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '평가 항목',
  help: '항목별 점수(5~1점)와 의견을 적습니다. 총점과 평균이 자동으로 계산됩니다.',
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
      placeholder: '예: 강의 내용의 유익함',
      maxLength: 80,
      width: 3,
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
      label: '의견',
      type: 'text',
      placeholder: '이유·개선점',
      maxLength: 80,
      width: 3,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'EV-20261117-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다.',
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
    id: 'course',
    label: '과정명',
    type: 'text',
    group: '평가 정보',
    required: true,
    placeholder: '예: 데이터 분석 실무',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'instructor',
    label: '강사',
    type: 'text',
    group: '평가 정보',
    placeholder: '예: 김강사',
    maxLength: 40,
  },
  {
    id: 'evaluator',
    label: '평가자',
    type: 'text',
    group: '평가 정보',
    required: true,
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '평가 정보',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'evaluationDate',
    label: '평가일',
    type: 'date',
    group: '평가 정보',
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
    id: 'summary',
    label: '종합 의견',
    type: 'textarea',
    group: '종합 의견',
    placeholder: '교육 전반에 대한 의견과 개선 제안',
    required: true,
    maxLength: 800,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['평가자', '확인자'],
    defaultValue: JSON.stringify([
      { label: '평가자', enabled: true },
      { label: '확인자', enabled: true },
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

export const evaluation: FormTemplate = {
  slug: 'evaluation',
  title: '교육 평가표',
  family: 'hr',
  category: 'people',
  description:
    '교육 과정의 내용·강사·자료·진행을 5점 척도로 평가하는 교육 평가표를 브라우저에서 작성하고 A4 PDF로 저장합니다. 총점과 평균이 자동 계산됩니다.',
  keywords: [
    '교육 평가표',
    '교육 평가표 양식',
    '강의 만족도 조사',
    '교육 만족도 평가',
    '강사 평가표',
    '교육 평가표 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'EV',
  lead: '교육을 마친 뒤 내용·강사·자료·진행을 5점 척도로 평가하는 표입니다. 항목별 점수와 종합 의견을 남기고 총점·평균을 자동으로 계산합니다.',
  useCases: [
    '교육 만족도 조사를 정리할 때',
    '강사·과정을 평가해 개선할 때',
    '다음 교육 계획의 참고 자료로 쓸 때',
    '교육 결과 보고에 평가 결과를 붙일 때',
  ],
  howTo: [
    '문서 번호와 작성일, 과정명·강사·평가자를 확인합니다.',
    '평가 항목별 점수(5~1점)와 의견을 입력합니다.',
    '총점과 평균을 확인합니다.',
    '종합 의견을 적고 PDF로 내려받아 확인을 받습니다.',
  ],
  notes: [
    '점수 기준을 미리 정해 두면 평가자 간 편차를 줄일 수 있습니다. 예: 5 매우 그렇다 ~ 1 전혀 아니다.',
    '낮은 점수에는 구체적인 개선 의견을 함께 적는 것이 좋습니다.',
    '평가 결과는 교육 개선 목적으로 사용하고, 개인 평가와 혼동하지 않도록 주의하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '교육 평가표',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '평가 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '과정명', field: 'course' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '강사', field: 'instructor' },
        { label: '평가자', field: 'evaluator' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '부서', field: 'department' },
        { label: '평가일', field: 'evaluationDate' },
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
        { label: '평가 항목', width: 68 },
        { label: '점수', width: 20, align: 'center' },
        { label: '의견', width: 86 },
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
    { kind: 'text', field: 'summary', minLines: 3 },
    {
      kind: 'signature',
      roles: ['평가자', '확인자'],
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
    docNo: 'EV-20261117-001',
    date: '2026-11-17',
    course: '데이터 분석 실무',
    instructor: '김강사',
    evaluator: '김옷깃',
    department: '경영지원팀',
    evaluationDate: '2026-11-16',
    summary:
      '실습 비중이 높아 이해하기 쉬웠습니다. 다만 4주 과정 중 마지막 주 발표 시간이 짧아 아쉬웠습니다. 다음에는 발표 시간을 30분 더 확보하면 좋겠습니다.',
  },
  sampleRows: {
    items: [
      { item: '강의 내용의 유익함', score: '5', comment: '업무에 바로 적용 가능' },
      { item: '강사의 설명 이해도', score: '4', comment: '사례가 도움됨' },
      { item: '실습·자료의 충실함', score: '5', comment: '실습 파일이 유용함' },
      { item: '진행 시간·속도', score: '4', comment: '마지막 주 발표 시간 부족' },
    ],
  },
  faq: [
    {
      q: '교육 평가표는 누가 작성하나요?',
      a: '교육을 수강한 사람이 작성하는 것이 일반적입니다. 과정 담당자가 만족도 결과를 취합할 때도 사용할 수 있습니다.',
    },
    {
      q: '점수 기준은 어떻게 정하나요?',
      a: '5점 척도를 사용할 때 “5 매우 그렇다, 4 그렇다, 3 보통, 2 아니다, 1 전혀 아니다”처럼 기준을 미리 안내하세요.',
    },
    {
      q: '총점과 평균은 어떻게 계산되나요?',
      a: '점수가 입력된 항목의 합계와 평균을 계산합니다. 점수가 비어 있는 항목은 평균에서 제외됩니다.',
    },
    {
      q: '낮은 점수는 어떻게 다루나요?',
      a: '구체적인 의견과 함께 교육 담당자에게 전달해 다음 과정 개선에 반영하세요. 개인 평가 자료로 사용하지 않도록 주의합니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 직업능력개발 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '고용24 — 직업훈련 정보',
      href: 'https://www.work24.go.kr/',
    },
  ],
  related: [
    { label: '강의계획서 양식', href: '/forms/syllabus/' },
    { label: '교육 신청서 양식', href: '/forms/training-request/' },
    { label: '교육 출석부 양식', href: '/forms/attendance/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
