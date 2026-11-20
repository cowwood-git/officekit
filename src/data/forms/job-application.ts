import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const education: RepeatGroup = {
  id: 'education',
  label: '학력 사항',
  help: '학교·전공·재학 기간을 최근 순서로 적습니다.',
  minRows: 2,
  maxRows: 5,
  addLabel: '+ 학력 추가',
  required: true,
  group: '지원 정보',
  columns: [
    {
      id: 'period',
      label: '기간',
      type: 'text',
      placeholder: '2015. 03. ~ 2019. 02.',
      maxLength: 30,
      width: 1.6,
    },
    {
      id: 'school',
      label: '학교',
      type: 'text',
      required: true,
      placeholder: '예: 옷깃대학교',
      maxLength: 60,
      width: 2.2,
    },
    {
      id: 'major',
      label: '전공',
      type: 'text',
      placeholder: '예: 컴퓨터공학',
      maxLength: 50,
      width: 1.8,
    },
    {
      id: 'status',
      label: '구분',
      type: 'select',
      options: ['졸업', '재학', '중퇴', '수료'],
      width: 1,
    },
  ],
};

const career: RepeatGroup = {
  id: 'career',
  label: '경력 사항',
  help: '회사·직무·담당 업무를 최근 순서로 적습니다. 신입이면 비워 두어도 됩니다.',
  minRows: 1,
  maxRows: 6,
  addLabel: '+ 경력 추가',
  group: '지원 정보',
  columns: [
    {
      id: 'period',
      label: '기간',
      type: 'text',
      placeholder: '2021. 01. ~ 2024. 06.',
      maxLength: 30,
      width: 1.6,
    },
    {
      id: 'company',
      label: '회사',
      type: 'text',
      placeholder: '예: 옷깃 주식회사',
      maxLength: 60,
      width: 1.9,
    },
    {
      id: 'role',
      label: '직무',
      type: 'text',
      placeholder: '예: 프론트엔드 개발',
      maxLength: 50,
      width: 1.6,
    },
    {
      id: 'task',
      label: '담당 업무',
      type: 'text',
      placeholder: '주요 업무·성과',
      maxLength: 80,
      width: 2.4,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '접수 번호',
    type: 'text',
    group: '접수 정보',
    placeholder: 'JA-20261117-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '작성일',
    type: 'date',
    group: '접수 정보',
    defaultToday: true,
    required: true,
  },
  {
    id: 'name',
    label: '성명',
    type: 'text',
    group: '인적 사항',
    placeholder: '김지원',
    required: true,
    maxLength: 30,
  },
  {
    id: 'birth',
    label: '생년월일',
    type: 'text',
    group: '인적 사항',
    placeholder: '1996-03-15',
    maxLength: 20,
  },
  {
    id: 'phone',
    label: '연락처',
    type: 'text',
    group: '인적 사항',
    placeholder: '010-1234-5678',
    required: true,
    maxLength: 40,
  },
  {
    id: 'email',
    label: '이메일',
    type: 'text',
    group: '인적 사항',
    placeholder: 'jiwon@example.com',
    maxLength: 80,
  },
  {
    id: 'address',
    label: '주소',
    type: 'text',
    group: '인적 사항',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'position',
    label: '지원 직무',
    type: 'text',
    group: '지원 정보',
    placeholder: '예: 문서 자동화 개발자',
    required: true,
    maxLength: 80,
    span: 2,
  },
  {
    id: 'careerType',
    label: '경력 구분',
    type: 'select',
    group: '지원 정보',
    options: ['신입', '경력'],
    defaultValue: '신입',
    required: true,
  },
  {
    id: 'skills',
    label: '자격·어학',
    type: 'textarea',
    group: '자격·어학',
    placeholder: '자격증, 어학 점수, 수상 내역을 줄바꿈으로 적습니다.',
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'motivation',
    label: '자기소개',
    type: 'textarea',
    group: '자기소개',
    placeholder: '지원 동기, 관련 경험, 강점을 두세 문단으로 적습니다.',
    required: true,
    maxLength: 1000,
    rows: 4,
    span: 3,
  },
  {
    id: 'privacy',
    label: '개인정보 동의',
    type: 'select',
    group: '개인정보 동의',
    options: ['동의함', '동의하지 않음'],
    defaultValue: '동의함',
    required: true,
    help: '채용 전형을 위해 개인정보를 수집·이용하는 데 동의합니다.',
  },
  {
    id: 'approvalRoles',
    label: '서명',
    type: 'roles',
    group: '서명',
    options: ['지원자'],
    defaultValue: JSON.stringify([{ label: '지원자', enabled: true }]),
    required: true,
    maxSelected: 1,
    editable: true,
    help: '지원자 이름을 확인합니다.',
    span: 3,
  },
];

const rowsOf = (rows: FormRows, id: string): FormRows[string] =>
  (rows[id] ?? []).filter((row) => Object.values(row).some((value) => value.trim()));

export const jobApplication: FormTemplate = {
  slug: 'job-application',
  title: '입사지원서',
  family: 'hr',
  category: 'people',
  description:
    '학력·경력·자기소개를 정리하는 입사지원서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 개인정보 동의와 지원자 서명까지 한 장에 담습니다.',
  keywords: [
    '입사지원서',
    '입사지원서 양식',
    '이력서 양식',
    '채용 지원서',
    '입사 지원서 PDF',
    '신입 입사지원서',
  ],
  updated: '2026-11-17',
  docPrefix: 'JA',
  lead: '학력과 경력, 자기소개를 한 장으로 정리하는 입사지원서입니다. 지원 직무와 경력 구분을 적고 개인정보 동의와 서명을 남길 수 있습니다.',
  useCases: [
    '채용 공고에 지원할 때',
    '회사 자체 지원 양식이 필요할 때',
    '신입·경력 지원자의 기본 정보를 정리할 때',
    '채용 담당자가 지원서를 접수·보관할 때',
  ],
  howTo: [
    '접수 번호와 작성일, 성명·연락처를 확인합니다.',
    '지원 직무와 경력 구분을 적습니다.',
    '학력·경력 사항을 줄 단위로 입력합니다.',
    '자기소개와 개인정보 동의를 확인하고 PDF로 내려받습니다.',
  ],
  notes: [
    '주민등록번호 전체는 받지 않습니다. 생년월일 등 꼭 필요한 정보만 적으세요.',
    '채용절차의 공정화에 관한 법률에 따라 직무와 무관한 개인정보를 요구하지 않도록 주의하세요.',
    '경력 사항은 담당 업무와 성과를 구체적으로 적을수록 좋습니다.',
    '수집한 개인정보는 채용 목적 외로 사용하지 않고, 전형 종료 후 관련 법령에 따라 파기합니다.',
  ],
  fields,
  groups: [education, career],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '입사지원서',
      docNoField: 'docNo',
      dateField: 'date',
      docNoLabel: '접수번호',
      dateLabel: '작성일',
    },
    { kind: 'section', title: '인적 사항' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '성명', field: 'name' },
        { label: '생년월일', field: 'birth' },
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
    { kind: 'kv', columns: 1, rows: [{ label: '주소', field: 'address' }] },
    { kind: 'section', title: '지원 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '지원 직무', field: 'position' },
        { label: '경력 구분', field: 'careerType' },
      ],
    },
    { kind: 'section', title: '학력 사항' },
    {
      kind: 'table',
      columns: [
        { label: '기간', width: 40 },
        { label: '학교', width: 62 },
        { label: '전공', width: 46 },
        { label: '구분', width: 20, align: 'center' },
      ],
      rows: (_values, rows) =>
        rowsOf(rows, 'education').map((row) => [
          (row.period ?? '').trim(),
          (row.school ?? '').trim(),
          (row.major ?? '').trim(),
          (row.status ?? '').trim(),
        ]),
      minRows: 2,
    },
    { kind: 'section', title: '경력 사항' },
    {
      kind: 'table',
      columns: [
        { label: '기간', width: 40 },
        { label: '회사', width: 48 },
        { label: '직무', width: 38 },
        { label: '담당 업무', width: 58 },
      ],
      rows: (_values, rows) =>
        rowsOf(rows, 'career').map((row) => [
          (row.period ?? '').trim(),
          (row.company ?? '').trim(),
          (row.role ?? '').trim(),
          (row.task ?? '').trim(),
        ]),
      minRows: 1,
    },
    { kind: 'section', title: '자격·어학' },
    { kind: 'paragraph', field: 'skills', size: 9.5, blankLine: 170, before: 1, after: 2 },
    { kind: 'section', title: '자기소개' },
    { kind: 'text', field: 'motivation', minLines: 3 },
    {
      kind: 'kv',
      columns: 1,
      rows: [{ label: '개인정보 수집·이용 동의', field: 'privacy' }],
    },
    {
      kind: 'signature',
      roles: ['지원자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  validate: (values, rows) => {
    const errors: string[] = [];
    if ((values.motivation ?? '').trim().length < 20) {
      errors.push('자기소개를 20자 이상 적어 주세요.');
    }
    if (values.privacy && values.privacy !== '동의함') {
      errors.push('개인정보 수집·이용에 동의해야 지원서를 만들 수 있습니다.');
    }
    if (rowsOf(rows, 'education').length === 0) {
      errors.push('학력 사항을 한 줄 이상 입력하세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'JA-20261117-001',
    date: '2026-11-17',
    name: '김지원',
    birth: '1996-03-15',
    phone: '010-1234-5678',
    email: 'jiwon@example.com',
    address: '서울시 강남구 테헤란로 2',
    position: '문서 자동화 개발자',
    careerType: '경력',
    skills: '정보처리기사(2021) · SQLD(2022) · TOEIC 900(2023)\n2024 사내 해커톤 최우수상',
    motivation:
      '업무 문서를 브라우저에서 바로 완성하는 제품에 매력을 느껴 지원했습니다. 3년 동안 웹 프론트엔드와 PDF 생성 기능을 개발하며 사용자가 설치 없이 문서를 만들도록 돕는 일을 해 왔습니다. 문서 엔진의 품질과 접근성을 함께 높이는 데 기여하고 싶습니다.',
    privacy: '동의함',
  },
  sampleRows: {
    education: [
      {
        period: '2015. 03. ~ 2019. 02.',
        school: '옷깃대학교',
        major: '컴퓨터공학',
        status: '졸업',
      },
      {
        period: '2019. 03. ~ 2021. 02.',
        school: '옷깃대학원',
        major: '소프트웨어공학',
        status: '수료',
      },
    ],
    career: [
      {
        period: '2021. 03. ~ 2023. 06.',
        company: '페이퍼랩',
        role: '프론트엔드 개발',
        task: 'PDF 편집기 UI·문서 미리보기 개발',
      },
      {
        period: '2023. 07. ~ 2026. 10.',
        company: '옷깃',
        role: '웹 개발',
        task: '업무 양식 엔진·HWPX 생성 기능 개발',
      },
    ],
  },
  faq: [
    {
      q: '주민등록번호를 꼭 적어야 하나요?',
      a: '아니요. 이 양식은 생년월일만 받습니다. 주민등록번호 전체는 채용 단계에서 꼭 필요한 경우가 아니면 요구하지 않는 것이 좋습니다.',
    },
    {
      q: '신입인데 경력 사항을 비워도 되나요?',
      a: '네. 경력이 없으면 비워 두고 학력·자격·자기소개를 중심으로 작성합니다. 아르바이트·인턴 경험을 적어도 좋습니다.',
    },
    {
      q: '사진을 넣을 수 있나요?',
      a: '이 양식은 사진 없이 텍스트로 작성합니다. 사진이 필요한 회사라면 별도 첨부를 안내하세요.',
    },
    {
      q: '개인정보 동의는 왜 필요한가요?',
      a: '지원자의 개인정보를 수집·이용하려면 목적과 항목, 보유 기간을 알리고 동의를 받아야 합니다. 동의하지 않으면 전형이 어려울 수 있습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '개인정보보호위원회 — 개인정보 처리 안내',
      href: 'https://www.pipc.go.kr/',
    },
    {
      label: '고용노동부 — 채용절차의 공정화에 관한 법률 안내',
      href: 'https://www.moel.go.kr/',
    },
  ],
  related: [
    { label: '채용공고 양식', href: '/forms/recruitment/' },
    { label: '면접 평가표 양식', href: '/forms/interview-evaluation/' },
    { label: '개인정보 동의서 양식', href: '/forms/privacy-consent/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
