import type { FormField, FormTemplate } from '@/lib/doc/types';

const partyFields = (prefix: 'discloser' | 'recipient', label: string): FormField[] => [
  {
    id: `${prefix}Company`,
    label: `${label} 상호`,
    type: 'text',
    group: label,
    required: true,
    placeholder: prefix === 'discloser' ? '예: 옷깃' : '예: 거래처 주식회사',
    maxLength: 60,
    span: 2,
  },
  {
    id: `${prefix}Ceo`,
    label: '대표자',
    type: 'text',
    group: label,
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: `${prefix}Address`,
    label: '주소',
    type: 'text',
    group: label,
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: `${prefix}Contact`,
    label: '연락처',
    type: 'text',
    group: label,
    placeholder: '전화 또는 이메일',
    maxLength: 60,
  },
];

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'NDA-20261117-001',
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
  ...partyFields('discloser', '공개자'),
  ...partyFields('recipient', '수신자'),
  {
    id: 'effectiveDate',
    label: '발효일',
    type: 'date',
    group: '계약 내용',
    required: true,
  },
  {
    id: 'period',
    label: '존속 기간',
    type: 'text',
    group: '계약 내용',
    placeholder: '예: 계약 종료 후 3년',
    required: true,
    maxLength: 60,
    span: 2,
  },
  {
    id: 'purpose',
    label: '목적',
    type: 'textarea',
    group: '계약 내용',
    placeholder: '비밀정보를 공개하는 목적 (예: 협력사 검토, 견적 산출)',
    required: true,
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'scope',
    label: '비밀정보의 범위',
    type: 'textarea',
    group: '계약 내용',
    placeholder: '기술 자료, 가격, 고객 정보 등 비밀정보에 포함되는 범위',
    required: true,
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명 당사자',
    type: 'roles',
    group: '서명',
    options: ['공개자', '수신자'],
    defaultValue: JSON.stringify([
      { label: '공개자', enabled: true },
      { label: '수신자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '서명란에 표시할 당사자 이름입니다.',
    span: 3,
  },
];

const partyLines = (values: Record<string, string>, prefix: 'discloser' | 'recipient'): string[] =>
  [
    values[`${prefix}Company`] ?? '',
    values[`${prefix}Ceo`] ? `대표 ${values[`${prefix}Ceo`]}` : '',
    values[`${prefix}Address`] ?? '',
    values[`${prefix}Contact`] ?? '',
  ].filter((line) => line.trim() !== '');

export const nda: FormTemplate = {
  slug: 'nda',
  title: '비밀유지계약서(NDA)',
  family: 'sales',
  category: 'money',
  description:
    '거래·협업 전에 비밀정보를 주고받을 때 쓰는 비밀유지계약서(NDA)를 브라우저에서 작성하고 A4 PDF로 저장합니다. 당사자·목적·범위·존속 기간을 정리합니다.',
  keywords: [
    '비밀유지계약서',
    'NDA 양식',
    '비밀유지 서약서',
    '기밀유지계약서',
    'NDA PDF',
    '비밀유지계약서 양식',
  ],
  updated: '2026-11-17',
  docPrefix: 'NDA',
  lead: '협업·거래 전에 기술 자료, 가격, 고객 정보 같은 비밀정보를 보호하기 위한 기본 NDA입니다. 두 당사자와 목적, 비밀정보 범위, 존속 기간을 한 장에 정리합니다.',
  useCases: [
    '협력사에 기술 자료를 공유하기 전에',
    '견적·제안을 위해 내부 정보를 전달할 때',
    '신규 거래처와 기밀유지 조건을 정할 때',
    '프로젝트 종료 후 비밀정보 반환·폐기를 약정할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 발효일을 확인합니다.',
    '공개자와 수신자의 상호·대표자·주소·연락처를 적습니다.',
    '비밀정보를 공개하는 목적과 범위, 존속 기간을 적습니다.',
    '당사자 서명란을 확인하고 PDF로 내려받아 서명·날인합니다.',
  ],
  notes: [
    '이 양식은 일반적인 NDA 작성을 돕는 참고 자료입니다. 계약의 효력·범위는 거래 내용과 준거법에 따라 달라질 수 있으므로 서명 전 법률 검토를 권장합니다.',
    '비밀정보의 범위와 예외, 반환·폐기, 손해배상 조항은 필요에 따라 추가하세요.',
    '서명·날인한 계약서는 양쪽이 같은 내용을 보관해야 합니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '비밀유지계약서(NDA)',
      docNoField: 'docNo',
      dateField: 'date',
    },
    {
      kind: 'paragraph',
      text: '아래 당사자는 비밀정보의 보호를 위해 다음과 같이 합의한다.',
      align: 'center',
      before: 2,
      after: 2,
    },
    {
      kind: 'parties',
      left: {
        label: '공개자',
        lines: (values) => partyLines(values, 'discloser'),
      },
      right: {
        label: '수신자',
        lines: (values) => partyLines(values, 'recipient'),
      },
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '발효일', field: 'effectiveDate' },
        { label: '존속 기간', field: 'period' },
      ],
    },
    { kind: 'section', title: '제1조 (목적)' },
    { kind: 'text', field: 'purpose', minLines: 2 },
    { kind: 'section', title: '제2조 (비밀정보의 범위)' },
    { kind: 'text', field: 'scope', minLines: 3 },
    { kind: 'section', title: '제3조 (비밀유지 의무)' },
    {
      kind: 'paragraph',
      text: '수신자는 비밀정보를 제3자에게 공개하거나 목적 외로 사용하지 않으며, 공개자의 서면 동의 없이 복제·배포하지 않는다.',
      after: 3,
    },
    { kind: 'section', title: '제4조 (예외)' },
    {
      kind: 'paragraph',
      text: '공개자가 서면으로 동의한 정보, 이미 공개된 정보, 법령에 따라 공개가 요구된 정보는 비밀정보에서 제외한다.',
      after: 3,
    },
    { kind: 'section', title: '제5조 (반환·폐기)' },
    {
      kind: 'paragraph',
      text: '수신자는 공개자가 요청하면 비밀정보와 그 사본을 지체 없이 반환하거나 폐기하고, 그 사실을 서면으로 확인한다.',
      after: 3,
    },
    {
      kind: 'notice',
      text: '본 양식은 참고용입니다. 서명 전 계약 내용과 법률 검토를 확인하세요.',
    },
    {
      kind: 'signature',
      roles: ['공개자', '수신자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  sample: {
    docNo: 'NDA-20261117-001',
    date: '2026-11-17',
    effectiveDate: '2026-11-20',
    discloserCompany: '옷깃',
    discloserCeo: '홍길동',
    discloserAddress: '서울시 강남구 테헤란로 1',
    discloserContact: '010-1234-5678',
    recipientCompany: '거래처 주식회사',
    recipientCeo: '김대표',
    recipientAddress: '부산시 해운대구 1',
    recipientContact: '051-123-4567',
    purpose: '수신자가 공개자의 신규 서비스 도입을 검토하고 견적을 산출하기 위한 사전 협의',
    scope:
      '서비스 구조·기능 설명서, 가격 정책, 고객 목록, 운영 매뉴얼, 협의 과정에서 서면 또는 구두로 공개된 정보',
    period: '계약 종료 후 3년',
  },
  faq: [
    {
      q: 'NDA는 언제 필요한가요?',
      a: '기술 자료, 가격, 고객 정보처럼 외부에 공개되면 손해가 생길 수 있는 정보를 거래·협업 상대에게 전달하기 전에 체결합니다.',
    },
    {
      q: '이 양식만으로 법적 효력이 있나요?',
      a: '당사자가 서명하면 기본적인 비밀유지 약정으로 활용할 수 있지만, 거래 규모와 정보의 성격에 따라 조항을 보완해야 합니다. 중요한 계약은 법률 전문가의 검토를 권장합니다.',
    },
    {
      q: '비밀정보의 범위는 어떻게 적나요?',
      a: '문서·도면·소스코드·가격표·고객 명단처럼 구체적으로 적습니다. “모든 정보”보다 보호할 대상을 명시하는 편이 분쟁을 줄일 수 있습니다.',
    },
    {
      q: '존속 기간은 얼마로 하나요?',
      a: '정해진 기준은 없습니다. 정보의 수명과 거래 기간을 고려해 정하며, 일반적으로 계약 종료 후 2~5년을 많이 사용합니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국가법령정보센터 — 민법',
      href: 'https://www.law.go.kr/',
    },
    {
      label: '공정거래위원회 — 계약·거래 안내',
      href: 'https://www.ftc.go.kr/',
    },
  ],
  related: [
    { label: '견적 비교표 양식', href: '/forms/quote-comparison/' },
    { label: '견적서 양식', href: '/forms/quote/' },
    { label: '거래처 등록신청서 양식', href: '/forms/vendor-registration/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
