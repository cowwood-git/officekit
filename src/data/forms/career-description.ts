import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const projects: RepeatGroup = {
  id: 'projects',
  label: '주요 프로젝트',
  help: '대표 프로젝트의 기간·회사·역할·성과를 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 2,
  maxRows: 12,
  addLabel: '+ 프로젝트 추가',
  required: true,
  group: '경력 요약',
  columns: [
    {
      id: 'period',
      label: '기간',
      type: 'text',
      placeholder: '2023. 03. ~ 2024. 06.',
      maxLength: 30,
      width: 1.5,
    },
    {
      id: 'company',
      label: '회사',
      type: 'text',
      placeholder: '예: 옷깃',
      maxLength: 40,
      width: 1.5,
    },
    {
      id: 'project',
      label: '프로젝트',
      type: 'text',
      required: true,
      placeholder: '예: 문서 양식 엔진',
      maxLength: 80,
      width: 2.4,
    },
    {
      id: 'role',
      label: '역할',
      type: 'text',
      placeholder: '예: 프론트엔드 리드',
      maxLength: 50,
      width: 1.6,
    },
    {
      id: 'achievement',
      label: '성과',
      type: 'text',
      placeholder: '수치·결과 중심',
      maxLength: 100,
      width: 2.6,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'CD-20261118-001',
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
    id: 'name',
    label: '성명',
    type: 'text',
    group: '작성자',
    placeholder: '김지원',
    required: true,
    maxLength: 30,
  },
  {
    id: 'targetRole',
    label: '지원 직무',
    type: 'text',
    group: '작성자',
    placeholder: '예: 문서 자동화 개발자',
    maxLength: 80,
  },
  {
    id: 'phone',
    label: '연락처',
    type: 'text',
    group: '작성자',
    placeholder: '010-1234-5678',
    maxLength: 40,
  },
  {
    id: 'email',
    label: '이메일',
    type: 'text',
    group: '작성자',
    placeholder: 'jiwon@example.com',
    maxLength: 80,
  },
  {
    id: 'summary',
    label: '경력 요약',
    type: 'textarea',
    group: '경력 요약',
    placeholder: '전체 경력의 방향과 강점을 세 문장 이내로 적습니다.',
    required: true,
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'skills',
    label: '보유 기술',
    type: 'textarea',
    group: '보유 기술',
    placeholder: '업무에 바로 쓸 수 있는 기술·도구·자격을 적습니다.',
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '포트폴리오 링크, 근무 가능일 등',
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명',
    type: 'roles',
    group: '서명',
    options: ['작성자'],
    defaultValue: JSON.stringify([{ label: '작성자', enabled: true }]),
    required: true,
    maxSelected: 1,
    editable: true,
    help: '지원자 이름을 확인합니다.',
    span: 3,
  },
];

const projectsOf = (rows: FormRows): FormRows['projects'] =>
  (rows.projects ?? []).filter((row) => (row.project ?? '').trim());

export const careerDescription: FormTemplate = {
  slug: 'career-description',
  title: '경력기술서',
  family: 'hr',
  category: 'people',
  description:
    '프로젝트별 역할과 성과를 정리하는 경력기술서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 입사지원서와 함께 제출할 수 있습니다.',
  keywords: [
    '경력기술서',
    '경력기술서 양식',
    '경력 기술서',
    '프로젝트 경력',
    '이직 경력기술서',
    '경력기술서 PDF',
  ],
  updated: '2026-11-18',
  docPrefix: 'CD',
  lead: '프로젝트별 역할과 성과를 구체적으로 보여 주는 경력기술서입니다. 입사지원서의 경력 표를 보완해 제출할 수 있습니다.',
  useCases: [
    '경력직 입사지원서와 함께 제출할 때',
    '프로젝트 단위 성과를 구체적으로 보여 줄 때',
    '이직·포트폴리오 정리를 할 때',
    '면접에서 설명할 경험을 미리 정리할 때',
  ],
  howTo: [
    '작성일과 지원 직무, 연락처를 적습니다.',
    '전체 경력의 방향과 강점을 요약합니다.',
    '프로젝트별 기간·회사·역할·성과를 입력합니다.',
    '보유 기술을 정리하고 PDF로 내려받습니다.',
  ],
  notes: [
    '성과는 “무엇을 했는지”보다 “어떤 결과가 나왔는지”를 수치와 함께 적으세요.',
    '모든 경력을 나열하기보다 지원 직무와 관련 있는 프로젝트를 우선하세요.',
    '회사의 기밀 정보나 고객 개인정보는 구체적으로 적지 마세요.',
  ],
  fields,
  groups: [projects],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '경력기술서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '작성자' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '성명', field: 'name' },
        { label: '지원 직무', field: 'targetRole' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '연락처', field: 'phone' },
        { label: '이메일', field: 'email' },
      ],
    },
    { kind: 'section', title: '경력 요약' },
    { kind: 'text', field: 'summary', minLines: 3 },
    { kind: 'section', title: '주요 프로젝트' },
    {
      kind: 'table',
      columns: [
        { label: '기간', width: 34 },
        { label: '회사', width: 24 },
        { label: '프로젝트', width: 48 },
        { label: '역할', width: 32 },
        { label: '성과', width: 36 },
      ],
      rows: (_values, rows) =>
        projectsOf(rows).map((row) => [
          (row.period ?? '').trim(),
          (row.company ?? '').trim(),
          (row.project ?? '').trim(),
          (row.role ?? '').trim(),
          (row.achievement ?? '').trim(),
        ]),
      minRows: 2,
    },
    { kind: 'section', title: '보유 기술' },
    { kind: 'text', field: 'skills', minLines: 2 },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  validate: (_values, rows) => {
    const errors: string[] = [];
    if (projectsOf(rows).length === 0) errors.push('주요 프로젝트를 한 줄 이상 입력하세요.');
    return errors;
  },
  sample: {
    docNo: 'CD-20261118-001',
    date: '2026-11-18',
    name: '김지원',
    targetRole: '문서 자동화 개발자',
    phone: '010-1234-5678',
    email: 'jiwon@example.com',
    summary:
      '문서 작성·변환 도구를 5년간 개발해 온 프론트엔드 개발자입니다. 사용자가 설치 없이 문서를 완성하도록 돕는 제품에 강점이 있습니다.',
    skills:
      'TypeScript, React, PDF.js, pdf-lib, HWPX 구조, 접근성 설계\n정보처리기사(2021), SQLD(2022)',
    note: '포트폴리오: example.com/jiwon',
  },
  sampleRows: {
    projects: [
      {
        period: '2023.07~2026.10',
        company: '옷깃',
        project: '업무 양식 엔진',
        role: '프론트엔드 리드',
        achievement: '1쪽 출력 안정화',
      },
      {
        period: '2021.03~2023.06',
        company: '페이퍼랩',
        project: 'PDF 편집기',
        role: '프론트엔드 개발',
        achievement: '로딩 40% 단축',
      },
      {
        period: '2020.07~2021.02',
        company: '스타트업',
        project: '계약서 자동 작성',
        role: '개발',
        achievement: '작성 30분→5분',
      },
    ],
  },
  faq: [
    {
      q: '경력기술서와 이력서는 무엇이 다른가요?',
      a: '이력서는 경력의 요약이고, 경력기술서는 프로젝트별 역할과 성과를 구체적으로 설명하는 문서입니다. 입사지원서와 함께 제출하면 경험을 더 잘 보여 줄 수 있습니다.',
    },
    {
      q: '프로젝트는 몇 개까지 적나요?',
      a: '지원 직무와 관련 있는 3~5개가 적당합니다. 오래된 프로젝트보다 최근 성과를 우선하세요.',
    },
    {
      q: '성과가 수치로 없으면 어떻게 하나요?',
      a: '처리 시간, 오류 건수, 사용자 수, 납기 준수처럼 비교 가능한 기준을 찾아 적으세요. 수치가 어려우면 전후 상황을 구체적으로 설명합니다.',
    },
    {
      q: '회사 기밀을 적어도 되나요?',
      a: '고객명·계약 금액·내부 시스템 구조 등 기밀 정보는 빼고, 본인이 맡은 역할과 일반적인 성과만 적으세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 이력서·경력기술서 작성 안내',
      href: 'https://www.moel.go.kr/',
    },
  ],
  related: [
    { label: '입사지원서 양식', href: '/forms/job-application/' },
    { label: '직무기술서 양식', href: '/forms/job-description/' },
    { label: '면접 질문지 양식', href: '/forms/interview-questions/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
