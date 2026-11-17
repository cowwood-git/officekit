import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const steps: RepeatGroup = {
  id: 'steps',
  label: '전형 단계',
  help: '서류·면접 등 전형 단계와 방법, 일정을 적습니다.',
  minRows: 3,
  maxRows: 10,
  addLabel: '+ 전형 단계 추가',
  required: true,
  group: '우대 사항',
  columns: [
    {
      id: 'stage',
      label: '단계',
      type: 'text',
      required: true,
      placeholder: '예: 서류 전형',
      maxLength: 30,
      width: 1.4,
    },
    {
      id: 'method',
      label: '방법',
      type: 'text',
      placeholder: '예: 서류·면접',
      maxLength: 40,
      width: 1.8,
    },
    {
      id: 'schedule',
      label: '일정',
      type: 'text',
      placeholder: '예: 2026. 12. 1. ~ 12. 5.',
      maxLength: 40,
      width: 2.4,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '공고 번호',
    type: 'text',
    group: '문서',
    placeholder: 'REC-20261117-001',
    help: '공고일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '공고일',
    type: 'date',
    group: '문서',
    defaultToday: true,
    required: true,
  },
  {
    id: 'jobTitle',
    label: '직무명',
    type: 'text',
    group: '모집 정보',
    placeholder: '예: 문서 자동화 개발자',
    required: true,
    maxLength: 80,
    span: 2,
  },
  {
    id: 'employmentType',
    label: '고용 형태',
    type: 'select',
    group: '모집 정보',
    options: ['정규직', '계약직', '인턴', '프리랜서'],
    defaultValue: '정규직',
    required: true,
  },
  {
    id: 'department',
    label: '담당 부서',
    type: 'text',
    group: '모집 정보',
    placeholder: '개발팀',
    maxLength: 40,
  },
  {
    id: 'headcount',
    label: '모집 인원',
    type: 'text',
    group: '모집 정보',
    placeholder: '1명',
    maxLength: 20,
  },
  {
    id: 'location',
    label: '근무지',
    type: 'text',
    group: '모집 정보',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'deadline',
    label: '마감일',
    type: 'date',
    group: '모집 정보',
    required: true,
  },
  {
    id: 'salary',
    label: '급여 조건',
    type: 'text',
    group: '모집 정보',
    placeholder: '예: 연봉 4,500만 원~',
    maxLength: 60,
  },
  {
    id: 'summary',
    label: '모집 요강',
    type: 'textarea',
    group: '모집 요강',
    placeholder: '무엇을 하는 직무인지, 어떤 일을 맡게 되는지 적습니다.',
    required: true,
    maxLength: 800,
    rows: 4,
    span: 3,
  },
  {
    id: 'requirements',
    label: '자격 요건',
    type: 'textarea',
    group: '자격 요건',
    placeholder: '학력·경력·기술 등 꼭 필요한 요건을 줄바꿈으로 적습니다.',
    required: true,
    maxLength: 700,
    rows: 3,
    span: 3,
  },
  {
    id: 'preferred',
    label: '우대 사항',
    type: 'textarea',
    group: '우대 사항',
    placeholder: '있으면 좋은 경험·기술·태도를 줄바꿈으로 적습니다.',
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'applyMethod',
    label: '지원 방법',
    type: 'textarea',
    group: '지원 방법',
    placeholder: '이메일·지원 링크, 제출 서류와 파일명 규칙을 적습니다.',
    required: true,
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'contact',
    label: '문의',
    type: 'text',
    group: '문의',
    placeholder: '예: 채용 담당 02-123-4567, jobs@example.com',
    maxLength: 120,
    span: 3,
  },
  {
    id: 'note',
    label: '유의 사항',
    type: 'textarea',
    group: '유의 사항',
    placeholder: '전형 관련 안내, 개인정보 처리, 불합격 통보 방식 등',
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'company',
    label: '회사명',
    type: 'text',
    group: '발신 기관',
    placeholder: '옷깃 주식회사',
    required: true,
    maxLength: 60,
    span: 2,
  },
  {
    id: 'ceo',
    label: '대표자',
    type: 'text',
    group: '발신 기관',
    placeholder: '박대표',
    maxLength: 30,
  },
];

const stepsOf = (rows: FormRows): FormRows['steps'] =>
  (rows.steps ?? []).filter((row) => (row.stage ?? '').trim());

const linesOf = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const recruitment: FormTemplate = {
  slug: 'recruitment',
  title: '채용공고',
  family: 'hr',
  category: 'people',
  description:
    '직무·자격 요건·전형 절차를 정리하는 채용공고를 브라우저에서 작성하고 A4 PDF로 저장합니다. 모집 요강과 지원 방법, 회사 직인까지 한 장에 담습니다.',
  keywords: [
    '채용공고',
    '채용공고 양식',
    '구인공고',
    '채용 모집 요강',
    '채용공고 PDF',
    '직원 모집 공고',
  ],
  updated: '2026-11-17',
  docPrefix: 'REC',
  lead: '직무와 자격 요건, 전형 절차를 한 장으로 정리하는 채용공고입니다. 모집 요강과 지원 방법을 적고 회사 직인을 넣어 공고할 수 있습니다.',
  useCases: [
    '신규 직원을 외부에 공고할 때',
    '사내 공모·부서 이동 인력을 모집할 때',
    '프로젝트 계약직·인턴을 채용할 때',
    '채용 대행사·구인 사이트에 직무를 전달할 때',
  ],
  howTo: [
    '공고일과 회사 정보를 확인합니다.',
    '직무명·고용 형태·근무지·마감일과 급여 조건을 적습니다.',
    '모집 요강, 자격 요건, 우대 사항을 정리합니다.',
    '전형 단계와 일정, 지원 방법을 입력하고 PDF로 내려받습니다.',
  ],
  notes: [
    '채용절차의 공정화에 관한 법률에 따라 직무와 무관한 개인정보를 요구하지 않도록 주의하세요.',
    '자격 요건과 우대 사항을 구체적으로 적으면 지원자와 회사 모두 시간을 아낄 수 있습니다.',
    '마감일·전형 일정은 내부 일정과 지원자 안내를 함께 고려해 정하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [steps],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '채용공고',
      docNoField: 'docNo',
      dateField: 'date',
      docNoLabel: '공고번호',
      dateLabel: '공고일',
    },
    { kind: 'section', title: '모집 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '직무명', field: 'jobTitle' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '고용 형태', field: 'employmentType' },
        { label: '모집 인원', field: 'headcount' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '담당 부서', field: 'department' },
        { label: '급여 조건', field: 'salary' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '근무지', field: 'location' },
        { label: '마감일', field: 'deadline' },
      ],
    },
    { kind: 'section', title: '모집 요강' },
    { kind: 'text', field: 'summary', minLines: 2 },
    {
      kind: 'parties',
      minLines: 3,
      minHeight: 20,
      left: {
        label: '자격 요건',
        lines: (values) => linesOf(values.requirements ?? ''),
      },
      right: {
        label: '우대 사항',
        lines: (values) => linesOf(values.preferred ?? ''),
      },
    },
    { kind: 'section', title: '전형 절차' },
    {
      kind: 'table',
      columns: [
        { label: '단계', width: 34 },
        { label: '방법', width: 58 },
        { label: '일정', width: 76 },
      ],
      rows: (_values, rows) =>
        stepsOf(rows).map((row) => [
          (row.stage ?? '').trim(),
          (row.method ?? '').trim(),
          (row.schedule ?? '').trim(),
        ]),
      minRows: 3,
    },
    { kind: 'section', title: '지원 방법' },
    {
      kind: 'parties',
      minLines: 3,
      minHeight: 20,
      left: {
        label: '지원 방법',
        lines: (values) =>
          [
            ...linesOf(values.applyMethod ?? ''),
            values.contact ? `문의 ${values.contact}` : '',
          ].filter(Boolean),
      },
      right: {
        label: '유의 사항',
        lines: (values) => linesOf(values.note ?? ''),
      },
    },
    {
      kind: 'issuer',
      dateField: 'date',
      companyField: 'company',
      ceoField: 'ceo',
      seal: true,
      bottom: true,
    },
  ],
  validate: (values, rows) => {
    const errors: string[] = [];
    if (values.date && values.deadline && values.deadline < values.date) {
      errors.push('마감일은 공고일보다 빠를 수 없습니다.');
    }
    if ((values.summary ?? '').trim().length < 20) {
      errors.push('모집 요강을 20자 이상 적어 주세요.');
    }
    if (stepsOf(rows).length === 0) errors.push('전형 단계를 한 줄 이상 입력하세요.');
    return errors;
  },
  sample: {
    docNo: 'REC-20261117-001',
    date: '2026-11-17',
    company: '옷깃 주식회사',
    ceo: '박대표',
    jobTitle: '문서 자동화 개발자',
    employmentType: '정규직',
    department: '개발팀',
    headcount: '1명',
    location: '서울시 강남구 테헤란로 1 (주 2회 재택)',
    deadline: '2026-12-15',
    salary: '연봉 4,500만 원~6,000만 원',
    summary:
      '브라우저에서 동작하는 문서 도구를 만드는 개발자를 찾습니다. PDF 양식 엔진과 한글(HWPX) 생성 기능을 함께 개선하며, 사용자가 설치 없이 업무 문서를 완성하도록 돕습니다.',
    requirements:
      '· TypeScript 기반 웹 개발 경력 2년 이상\n· HTML/CSS와 브라우저 API에 대한 이해\n· 문서·표·PDF 처리 경험 또는 빠른 학습 의지',
    preferred:
      '· PDF.js, pdf-lib 등 문서 라이브러리 사용 경험\n· 한글(HWP/HWPX) 파일 구조 이해\n· 디자인 시스템·접근성 개선 경험',
    applyMethod:
      '이메일(jobs@officekit.kr)로 이력서와 포트폴리오를 보내 주세요. 파일명은 “지원직무_성명”으로 작성합니다.',
    contact: '채용 담당 02-123-4567 · jobs@officekit.kr',
    note: '서류 합격자에게만 개별 안내합니다. 제출 서류는 채용 목적 외로 사용하지 않으며, 전형 종료 후 6개월 뒤 파기합니다.',
  },
  sampleRows: {
    steps: [
      { stage: '서류 전형', method: '이력서·포트폴리오 검토', schedule: '2026. 12. 1. ~ 12. 5.' },
      {
        stage: '면접 전형',
        method: '직무·조직 적합도 면접(1·2차)',
        schedule: '2026. 12. 8. ~ 12. 12.',
      },
      { stage: '합격 통보', method: '이메일·개별 안내', schedule: '2026. 12. 15.' },
    ],
  },
  faq: [
    {
      q: '채용공고에 꼭 들어가야 하는 내용은?',
      a: '직무 내용, 자격 요건, 근무지, 고용 형태, 근무 조건, 전형 절차와 지원 방법을 담는 것이 좋습니다. 채용절차법상 지원자에게 필요한 정보를 명확히 안내해야 합니다.',
    },
    {
      q: '나이·성별·혼인 여부를 적어도 되나요?',
      a: '직무 수행에 꼭 필요한 경우가 아니라면 적지 않는 것이 좋습니다. 채용절차의 공정화에 관한 법률은 직무와 무관한 개인정보 요구를 제한합니다.',
    },
    {
      q: '급여를 공개해야 하나요?',
      a: '의무는 아니지만, 급여 범위를 적으면 조건이 맞는 지원자가 지원할 가능성이 높아집니다. 내부 기준과 법정 최저임금을 확인하세요.',
    },
    {
      q: '사내 공모에도 쓸 수 있나요?',
      a: '네. 회사명과 직무, 전형 절차를 그대로 두고 지원 방법만 사내 채널로 바꿔 사용할 수 있습니다.',
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
    { label: '입사지원서 양식', href: '/forms/job-application/' },
    { label: '면접 평가표 양식', href: '/forms/interview-evaluation/' },
    { label: '합격 통보서 양식', href: '/forms/offer-notice/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
