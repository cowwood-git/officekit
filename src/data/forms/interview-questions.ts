import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const questions: RepeatGroup = {
  id: 'questions',
  label: '질문 항목',
  help: '역량별 질문과 좋은 답변의 기준, 확인 포인트를 적습니다.',
  minRows: 4,
  maxRows: 20,
  addLabel: '+ 질문 추가',
  required: true,
  group: '면접 정보',
  columns: [
    {
      id: 'competency',
      label: '역량',
      type: 'text',
      placeholder: '예: 문제 해결',
      maxLength: 40,
      width: 1.4,
    },
    {
      id: 'question',
      label: '질문',
      type: 'text',
      required: true,
      placeholder: '지원자에게 물을 질문',
      maxLength: 140,
      width: 3.4,
    },
    {
      id: 'criteria',
      label: '좋은 답변 기준',
      type: 'text',
      placeholder: '구체적 사례·수치·결과',
      maxLength: 100,
      width: 2.4,
    },
    {
      id: 'check',
      label: '확인 포인트',
      type: 'text',
      placeholder: '추가로 확인할 점',
      maxLength: 80,
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
    placeholder: 'IQ-20261118-001',
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
    id: 'jobTitle',
    label: '직무명',
    type: 'text',
    group: '면접 정보',
    placeholder: '예: 문서 자동화 개발자',
    required: true,
    maxLength: 80,
    span: 2,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '면접 정보',
    placeholder: '개발팀',
    maxLength: 40,
  },
  {
    id: 'interviewType',
    label: '면접 구분',
    type: 'select',
    group: '면접 정보',
    options: ['1차 면접', '2차 면접', '최종 면접'],
    defaultValue: '1차 면접',
    required: true,
  },
  {
    id: 'interviewer',
    label: '면접관',
    type: 'text',
    group: '면접 정보',
    placeholder: '김면접',
    maxLength: 40,
  },
  {
    id: 'notes',
    label: '진행 유의',
    type: 'textarea',
    group: '진행 유의',
    placeholder: '질문 순서, 시간 배분, 피해야 할 질문 등',
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['작성자', '면접관', '채용 담당'],
    defaultValue: JSON.stringify([
      { label: '작성자', enabled: true },
      { label: '면접관', enabled: true },
      { label: '채용 담당', enabled: false },
    ]),
    required: true,
    maxSelected: 3,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const questionsOf = (rows: FormRows): FormRows['questions'] =>
  (rows.questions ?? []).filter((row) => (row.question ?? '').trim());

export const interviewQuestions: FormTemplate = {
  slug: 'interview-questions',
  title: '면접 질문지',
  family: 'hr',
  category: 'people',
  description:
    '직무 역량별 면접 질문과 좋은 답변 기준을 정리하는 면접 질문지를 브라우저에서 작성하고 A4 PDF로 저장합니다. 면접 평가표와 함께 쓰면 구조화 면접이 됩니다.',
  keywords: [
    '면접 질문지',
    '면접 질문지 양식',
    '채용 면접 질문',
    '역량 면접 질문',
    '구조화 면접',
    '면접 질문지 PDF',
  ],
  updated: '2026-11-18',
  docPrefix: 'IQ',
  lead: '직무 역량별 질문과 좋은 답변의 기준을 미리 정리하는 면접 질문지입니다. 면접관마다 다른 질문을 하지 않도록 기준을 맞출 수 있습니다.',
  useCases: [
    '면접 전에 질문을 구조화할 때',
    '여러 면접관이 같은 기준으로 평가할 때',
    '지원자의 경험을 구체적으로 확인할 때',
    '면접 평가표와 함께 전형 기록을 남길 때',
  ],
  howTo: [
    '직무명과 면접 구분, 면접관을 적습니다.',
    '역량별 질문과 좋은 답변 기준을 정합니다.',
    '추가로 확인할 포인트를 적습니다.',
    '진행 유의를 확인하고 PDF로 내려받아 면접에 사용합니다.',
  ],
  notes: [
    '질문은 지원자의 경험을 구체적으로 확인할 수 있는 행동·사례 중심으로 만드세요.',
    '나이·성별·혼인·출신 지역 등 직무와 무관한 질문은 피해야 합니다.',
    '모든 지원자에게 같은 핵심 질문을 해야 비교가 공정합니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [questions],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '면접 질문지',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '면접 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '직무명', field: 'jobTitle' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '부서', field: 'department' },
        { label: '면접 구분', field: 'interviewType' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '면접관', field: 'interviewer' }] },
    { kind: 'section', title: '질문 항목' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '역량', width: 26 },
        { label: '질문', width: 82 },
        { label: '좋은 답변 기준', width: 38 },
        { label: '확인 포인트', width: 28 },
      ],
      rows: (_values, rows) =>
        questionsOf(rows).map((row, index) => [
          String(index + 1),
          (row.competency ?? '').trim(),
          (row.question ?? '').trim(),
          (row.criteria ?? '').trim(),
          (row.check ?? '').trim(),
        ]),
      minRows: 4,
    },
    { kind: 'section', title: '진행 유의' },
    { kind: 'text', field: 'notes', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '면접관', '채용 담당'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  validate: (_values, rows) =>
    questionsOf(rows).length === 0 ? ['질문을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'IQ-20261118-001',
    date: '2026-11-18',
    jobTitle: '문서 자동화 개발자',
    department: '개발팀',
    interviewType: '1차 면접',
    interviewer: '김면접',
    notes:
      '질문은 지원자가 먼저 답하도록 하고, 답변에 나온 사례를 한 번 더 구체적으로 확인합니다. 마지막 5분은 지원자 질문에 사용합니다.',
  },
  sampleRows: {
    questions: [
      {
        competency: '직무 전문성',
        question: 'PDF 생성에서 가장 어려웠던 문제는?',
        criteria: '원인·해결·결과가 구체적',
        check: '직접 해결한 부분',
      },
      {
        competency: '문제 해결',
        question: '오류 원인을 어떻게 좁혔나요?',
        criteria: '가설→확인→수정 과정',
        check: '재발 방지 여부',
      },
      {
        competency: '협업',
        question: '의견이 다를 때 어떻게 조율했나요?',
        criteria: '상대 관점 이해·대안',
        check: '갈등 해결 태도',
      },
      {
        competency: '성장',
        question: '최근 배운 기술과 적용 경험은?',
        criteria: '학습 동기·적용 결과',
        check: '학습 습관',
      },
    ],
  },
  faq: [
    {
      q: '면접 질문지는 꼭 필요한가요?',
      a: '구조화 면접을 하려면 질문과 평가 기준을 미리 정하는 것이 좋습니다. 면접관마다 다른 질문을 하면 지원자 비교가 어려워집니다.',
    },
    {
      q: '질문은 몇 개가 적당한가요?',
      a: '면접 시간에 따라 다르지만 핵심 역량 4~6개에 질문 1~2개씩 준비하면 충분합니다. 모든 질문을 다 하기보다 답변을 깊게 확인하세요.',
    },
    {
      q: '좋은 답변 기준은 어떻게 정하나요?',
      a: '구체적인 상황, 본인의 행동, 결과가 드러나는지 봅니다. “열심히 했다”보다 “어떤 문제를 어떻게 해결해 어떤 결과가 나왔다”를 확인하세요.',
    },
    {
      q: '물어보면 안 되는 질문이 있나요?',
      a: '나이·성별·혼인·임신·출신 지역·가족 계획 등 직무와 무관한 개인정보 질문은 피해야 합니다. 채용절차법과 회사 규정을 확인하세요.',
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
  ],
  related: [
    { label: '면접 평가표 양식', href: '/forms/interview-evaluation/' },
    { label: '직무기술서 양식', href: '/forms/job-description/' },
    { label: '채용공고 양식', href: '/forms/recruitment/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
