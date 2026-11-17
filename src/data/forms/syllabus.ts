import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const weeks: RepeatGroup = {
  id: 'weeks',
  label: '주차별 계획',
  help: '주차별 주제와 활동, 과제를 적습니다. 주차 수가 자동으로 계산됩니다.',
  minRows: 4,
  maxRows: 30,
  addLabel: '+ 주차 추가',
  required: true,
  group: '강의 개요',
  summaryField: 'weekCountLabel',
  summaryLabel: '주차 수',
  columns: [
    {
      id: 'week',
      label: '주차',
      type: 'text',
      required: true,
      placeholder: '1주차',
      maxLength: 20,
      width: 1,
    },
    {
      id: 'topic',
      label: '주제',
      type: 'text',
      required: true,
      placeholder: '예: 데이터 분석 기초',
      maxLength: 80,
      width: 2.6,
    },
    {
      id: 'activity',
      label: '활동',
      type: 'text',
      placeholder: '예: 실습·토론',
      maxLength: 80,
      width: 2.2,
    },
    {
      id: 'assignment',
      label: '과제',
      type: 'text',
      placeholder: '예: 분석 보고서',
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
    placeholder: 'SY-20261117-001',
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
    group: '강의 정보',
    required: true,
    placeholder: '예: 데이터 분석 실무',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'instructor',
    label: '강사',
    type: 'text',
    group: '강의 정보',
    placeholder: '예: 김강사',
    maxLength: 40,
  },
  {
    id: 'audience',
    label: '교육 대상',
    type: 'text',
    group: '강의 정보',
    placeholder: '예: 신입 사원',
    maxLength: 60,
  },
  {
    id: 'method',
    label: '교육 방법',
    type: 'select',
    group: '강의 정보',
    options: ['집합교육', '온라인', '혼합', '기타'],
    defaultValue: '집합교육',
  },
  {
    id: 'startDate',
    label: '시작일',
    type: 'date',
    group: '강의 정보',
    required: true,
  },
  {
    id: 'endDate',
    label: '종료일',
    type: 'date',
    group: '강의 정보',
    required: true,
  },
  {
    id: 'hours',
    label: '교육 시간',
    type: 'text',
    group: '강의 정보',
    placeholder: '예: 21시간',
    maxLength: 20,
  },
  {
    id: 'weekCountLabel',
    label: '주차 수',
    type: 'computed',
    group: '강의 정보',
    help: '아래 주차별 계획의 줄 수입니다.',
  },
  {
    id: 'overview',
    label: '강의 개요',
    type: 'textarea',
    group: '강의 개요',
    placeholder: '강의 목표와 주요 내용을 적습니다.',
    required: true,
    maxLength: 800,
    rows: 3,
    span: 3,
  },
  {
    id: 'evaluation',
    label: '평가 방법',
    type: 'textarea',
    group: '평가 방법',
    placeholder: '출석·과제·발표·시험 등 평가 기준',
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '준비물, 수강 전 안내 등',
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['강사', '담당자', '팀장', '부서장', '대표'],
    defaultValue: JSON.stringify([
      { label: '강사', enabled: true },
      { label: '담당자', enabled: true },
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

const weeksOf = (rows: FormRows): FormRows['weeks'] =>
  (rows.weeks ?? []).filter((row) => (row.topic ?? '').trim());

export const syllabus: FormTemplate = {
  slug: 'syllabus',
  title: '강의계획서',
  family: 'hr',
  category: 'people',
  description:
    '교육 과정의 목표·대상·기간과 주차별 계획, 평가 방법을 정리하는 강의계획서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '강의계획서',
    '강의계획서 양식',
    '교육 과정 계획서',
    '주차별 강의 계획',
    '강의계획서 PDF',
    '교육 커리큘럼',
  ],
  updated: '2026-11-17',
  docPrefix: 'SY',
  lead: '교육 과정의 목표와 주차별 계획을 정리하는 강의계획서입니다. 강사·대상·기간과 평가 방법을 한 장에 담아 수강생과 공유할 수 있습니다.',
  useCases: [
    '사내 교육·연수 과정을 설계할 때',
    '외부 강사에게 과정 개요를 전달할 때',
    '수강생에게 주차별 계획을 안내할 때',
    '교육 신청·승인 자료로 쓸 때',
  ],
  howTo: [
    '문서 번호와 작성일, 과정명·강사·대상을 확인합니다.',
    '교육 기간과 시간, 방법을 적습니다.',
    '강의 개요와 주차별 주제·활동·과제를 입력합니다.',
    '평가 방법과 비고를 확인하고 PDF로 내려받습니다.',
  ],
  notes: [
    '주차별 계획은 교육 시간과 난이도에 맞춰 현실적으로 구성하세요.',
    '평가 방법과 수료 기준을 명확히 적으면 수강생이 목표를 이해하기 쉽습니다.',
    '외부 강사 과정은 강사료·저작권·촬영 동의 등을 별도로 확인하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [weeks],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '강의계획서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '강의 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '과정명', field: 'course' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '강사', field: 'instructor' },
        { label: '교육 대상', field: 'audience' },
      ],
    },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '시작일', field: 'startDate' },
        { label: '종료일', field: 'endDate' },
        { label: '교육 시간', field: 'hours' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '교육 방법', field: 'method' },
        { label: '주차 수', field: 'weekCountLabel' },
      ],
    },
    { kind: 'section', title: '강의 개요' },
    { kind: 'text', field: 'overview', minLines: 3 },
    { kind: 'section', title: '주차별 계획' },
    {
      kind: 'table',
      columns: [
        { label: '주차', width: 22 },
        { label: '주제', width: 62 },
        { label: '활동', width: 52 },
        { label: '과제', width: 38 },
      ],
      rows: (_values, rows) =>
        weeksOf(rows).map((row) => [
          (row.week ?? '').trim(),
          (row.topic ?? '').trim(),
          (row.activity ?? '').trim(),
          (row.assignment ?? '').trim(),
        ]),
      minRows: 4,
    },
    { kind: 'section', title: '평가 방법' },
    { kind: 'text', field: 'evaluation', minLines: 2 },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['강사', '담당자', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const count = weeksOf(rows).length;
    return { weekCountLabel: count > 0 ? `${count}주` : '' };
  },
  validate: (values, rows) => {
    const errors: string[] = [];
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      errors.push('종료일은 시작일보다 빠를 수 없습니다.');
    }
    if (weeksOf(rows).length === 0) errors.push('주차별 계획을 한 줄 이상 입력하세요.');
    return errors;
  },
  sample: {
    docNo: 'SY-20261117-001',
    date: '2026-11-17',
    course: '데이터 분석 실무',
    instructor: '김강사',
    audience: '신입 사원',
    method: '집합교육',
    startDate: '2026-12-01',
    endDate: '2026-12-22',
    hours: '12시간',
    overview:
      '업무 데이터를 표로 정리하고 기본 통계와 시각화로 인사이트를 찾는 방법을 배웁니다. 실습 중심으로 진행합니다.',
    evaluation: '출석 20%, 실습 과제 50%, 최종 발표 30%. 3주 이상 출석하고 과제를 제출하면 수료.',
    note: '노트북과 엑셀 설치가 필요합니다.',
  },
  sampleRows: {
    weeks: [
      {
        week: '1주차',
        topic: '데이터 분석 기초',
        activity: '표 구조 이해·실습',
        assignment: '데이터 정리',
      },
      {
        week: '2주차',
        topic: '통계와 시각화',
        activity: '차트 만들기',
        assignment: '시각화 보고서',
      },
      { week: '3주차', topic: '보고서 작성', activity: '발표·피드백', assignment: '보고서 초안' },
      { week: '4주차', topic: '심화 실습', activity: '개별 코칭·발표', assignment: '최종 발표' },
    ],
  },
  faq: [
    {
      q: '강의계획서에는 무엇을 적나요?',
      a: '과정명·강사·대상·기간·시간과 강의 개요, 주차별 주제·활동·과제, 평가 방법을 적습니다.',
    },
    {
      q: '주차 수는 자동인가요?',
      a: '네. 주차별 계획에 입력한 줄 수를 세어 표시합니다. 빈 줄은 제외됩니다.',
    },
    {
      q: '교육 시간이 바뀌면 어떻게 하나요?',
      a: '강의 정보의 교육 시간과 주차별 계획을 함께 수정하세요. 필요하면 새 강의계획서로 버전을 남깁니다.',
    },
    {
      q: '수강생에게 공유해도 되나요?',
      a: '네. PDF로 저장해 첫 수업 전에 공유하면 일정과 과제를 미리 안내할 수 있습니다.',
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
    { label: '교육 신청서 양식', href: '/forms/training-request/' },
    { label: '교육 출석부 양식', href: '/forms/attendance/' },
    { label: '교육 평가표 양식', href: '/forms/evaluation/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
