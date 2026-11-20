import type { FormField, FormTemplate } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '통보 번호',
    type: 'text',
    group: '문서',
    placeholder: 'OF-20261117-001',
    help: '통보일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '통보일',
    type: 'date',
    group: '문서',
    defaultToday: true,
    required: true,
  },
  {
    id: 'name',
    label: '수신자 성명',
    type: 'text',
    group: '채용 정보',
    required: true,
    placeholder: '김지원',
    maxLength: 30,
  },
  {
    id: 'position',
    label: '직무',
    type: 'text',
    group: '채용 정보',
    required: true,
    placeholder: '예: 문서 자동화 개발자',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '채용 정보',
    placeholder: '개발팀',
    maxLength: 40,
  },
  {
    id: 'employmentType',
    label: '고용 형태',
    type: 'select',
    group: '채용 정보',
    options: ['정규직', '계약직', '인턴'],
    defaultValue: '정규직',
    required: true,
  },
  {
    id: 'startDate',
    label: '입사일',
    type: 'date',
    group: '채용 정보',
    required: true,
  },
  {
    id: 'workplace',
    label: '근무지',
    type: 'text',
    group: '채용 정보',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'workHours',
    label: '근무 시간',
    type: 'text',
    group: '채용 정보',
    placeholder: '예: 주 40시간, 09:00~18:00',
    maxLength: 80,
  },
  {
    id: 'salary',
    label: '급여 조건',
    type: 'text',
    group: '채용 정보',
    placeholder: '예: 연봉 4,800만 원',
    maxLength: 60,
  },
  {
    id: 'terms',
    label: '근무 조건',
    type: 'textarea',
    group: '근무 조건',
    placeholder: '수습 기간, 복리후생, 근무 규칙 등 안내할 조건을 적습니다.',
    maxLength: 800,
    rows: 3,
    span: 3,
  },
  {
    id: 'documents',
    label: '제출 서류',
    type: 'textarea',
    group: '제출 서류',
    placeholder: '제출 서류를 한 줄에 하나씩 적습니다.',
    required: true,
    maxLength: 500,
    rows: 3,
    span: 3,
    help: '줄바꿈으로 구분하면 문서에 체크박스 목록으로 나옵니다.',
  },
  {
    id: 'replyDeadline',
    label: '회신 기한',
    type: 'date',
    group: '회신',
    required: true,
    help: '입사 수락 의사를 알려 줄 기한입니다.',
  },
  {
    id: 'company',
    label: '발신 기관',
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
    required: true,
    maxLength: 30,
  },
];

const documentLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const offerNotice: FormTemplate = {
  slug: 'offer-notice',
  title: '합격 통보서',
  family: 'hr',
  category: 'people',
  description:
    '채용 합격과 입사 조건을 공식 안내하는 합격 통보서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 입사일·근무 조건·제출 서류·회신 기한을 한 장에 담습니다.',
  keywords: [
    '합격 통보서',
    '합격 통보서 양식',
    '채용 합격 안내',
    '입사 안내문',
    '채용 확정 통보',
    '합격 통보서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'OF',
  lead: '채용 합격 사실과 입사일, 근무 조건을 공식 안내하는 합격 통보서입니다. 제출 서류와 회신 기한을 정리하고 회사 직인을 넣어 발송할 수 있습니다.',
  useCases: [
    '최종 합격자에게 입사 조건을 안내할 때',
    '입사 전 제출 서류를 한 번에 안내할 때',
    '입사 수락 의사를 받아야 할 때',
    '채용 확정 내용을 문서로 남길 때',
  ],
  howTo: [
    '통보일과 합격자 성명·직무를 확인합니다.',
    '부서·고용 형태·입사일·근무지와 급여 조건을 적습니다.',
    '근무 조건과 입사 전 제출 서류를 입력합니다.',
    '회신 기한과 발신 기관을 확인하고 PDF로 내려받습니다.',
  ],
  notes: [
    '이 통보서는 채용 합격 안내이며, 최종 근로 조건은 근로계약서로 확정합니다.',
    '급여·근무 시간·수습 기간 등은 근로기준법과 회사 규정을 확인해 적으세요.',
    '제출 서류는 채용·입사 목적에 필요한 최소한으로 요청하고, 보관·파기 기준을 안내하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '합격 통보서',
      docNoField: 'docNo',
      dateField: 'date',
      docNoLabel: '통보번호',
      dateLabel: '통보일',
    },
    {
      kind: 'paragraph',
      text: '귀하의 지원에 감사드립니다. 아래와 같이 채용 합격을 통보합니다.',
      align: 'center',
      before: 2,
      after: 2,
    },
    { kind: 'section', title: '채용 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '성명', field: 'name' },
        { label: '직무', field: 'position' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '부서', field: 'department' },
        { label: '고용 형태', field: 'employmentType' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '입사일', field: 'startDate' },
        { label: '근무지', field: 'workplace' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '근무 시간', field: 'workHours' },
        { label: '급여 조건', field: 'salary' },
      ],
    },
    { kind: 'section', title: '근무 조건' },
    { kind: 'text', field: 'terms', minLines: 3 },
    { kind: 'section', title: '입사 전 제출 서류' },
    { kind: 'checklist', field: 'documents', columns: 2 },
    { kind: 'section', title: '회신' },
    { kind: 'kv', columns: 1, rows: [{ label: '회신 기한', field: 'replyDeadline' }] },
    {
      kind: 'paragraph',
      text: '위 내용을 확인하신 뒤 회신 기한까지 입사 수락 의사를 알려 주세요.',
      before: 1,
      after: 1,
    },
    {
      kind: 'notice',
      text: '이 통보서는 채용 합격 안내이며, 최종 근로 조건은 근로계약서로 확정합니다.',
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
  validate: (values) => {
    const errors: string[] = [];
    if (values.date && values.startDate && values.startDate < values.date) {
      errors.push('입사일은 통보일보다 빠를 수 없습니다.');
    }
    if (values.date && values.replyDeadline && values.replyDeadline < values.date) {
      errors.push('회신 기한은 통보일보다 빠를 수 없습니다.');
    }
    if (documentLines(values.documents ?? '').length === 0) {
      errors.push('제출 서류를 한 줄 이상 입력하세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'OF-20261117-001',
    date: '2026-11-17',
    name: '김지원',
    position: '문서 자동화 개발자',
    department: '개발팀',
    employmentType: '정규직',
    startDate: '2026-12-01',
    workplace: '서울시 강남구 테헤란로 1 (주 2회 재택)',
    workHours: '주 40시간, 09:00~18:00',
    salary: '연봉 4,800만 원',
    terms:
      '수습 기간 3개월, 수습 기간에도 급여와 4대보험은 동일하게 적용합니다. 연차·복리후생은 취업규칙을 따릅니다.',
    documents: '주민등록등본 1부\n졸업증명서 1부\n경력증명서 1부\n급여 입금 계좌 사본 1부',
    replyDeadline: '2026-11-24',
    company: '옷깃 주식회사',
    ceo: '박대표',
  },
  faq: [
    {
      q: '합격 통보서와 근로계약서는 무엇이 다른가요?',
      a: '합격 통보서는 채용 합격 사실과 입사 일정·조건을 안내하는 문서입니다. 임금·근로시간 등 최종 근로 조건은 근로계약서로 확정합니다.',
    },
    {
      q: '회신 기한은 언제로 정하나요?',
      a: '지원자가 조건을 검토할 시간을 주되, 회사 일정에 무리가 없도록 정합니다. 보통 3~7일 정도가 일반적입니다.',
    },
    {
      q: '제출 서류는 무엇을 요청해야 하나요?',
      a: '입사·급여·4대보험 처리에 필요한 서류만 요청하세요. 주민등록번호 전체가 필요한 경우에도 법적 근거와 보관·파기 기준을 안내해야 합니다.',
    },
    {
      q: '조건이 바뀌면 어떻게 하나요?',
      a: '입사일·급여 등 조건이 바뀌면 새 통보서로 다시 안내하고, 최종 조건은 근로계약서에 정확히 반영하세요.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 근로계약 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '국가법령정보센터 — 근로기준법',
      href: 'https://www.law.go.kr/',
    },
  ],
  related: [
    { label: '채용공고 양식', href: '/forms/recruitment/' },
    { label: '면접 평가표 양식', href: '/forms/interview-evaluation/' },
    { label: '근로계약서 양식', href: '/forms/employment-contract/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
