import { formatBizNo, formatDateDot, formatTenure, isValidBizNo } from '@/lib/doc/format';
import type { FormBlock, FormField, FormTemplate } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '발급번호',
    type: 'text',
    group: '발급 정보',
    placeholder: 'C-20261115-001',
    help: '발급일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다.',
  },
  {
    id: 'date',
    label: '발급일',
    type: 'date',
    group: '발급 정보',
    defaultToday: true,
    required: true,
  },
  {
    id: 'name',
    label: '성명',
    type: 'text',
    group: '재직자',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'birth',
    label: '생년월일',
    type: 'date',
    group: '재직자',
    help: '주민등록번호 전체 대신 생년월일만 적습니다.',
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '재직자',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'position',
    label: '직위',
    type: 'text',
    group: '재직자',
    placeholder: '대리',
    maxLength: 30,
  },
  {
    id: 'employmentType',
    label: '고용형태',
    type: 'select',
    group: '재직자',
    options: ['정규직', '계약직', '파트타임', '기타'],
    defaultValue: '정규직',
  },
  {
    id: 'duty',
    label: '담당업무',
    type: 'text',
    group: '재직자',
    placeholder: '예: 비용 정산, 사무용품 구매',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'address',
    label: '주소',
    type: 'text',
    group: '재직자',
    placeholder: '예: 서울특별시 마포구 옷깃로 12, 3층',
    maxLength: 120,
    span: 3,
  },
  {
    id: 'joinedAt',
    label: '입사일',
    type: 'date',
    group: '재직 정보',
    required: true,
  },
  {
    id: 'tenureYears',
    label: '재직 년·개월',
    type: 'computed',
    group: '재직 정보',
    help: '입사일과 발급일로 자동 계산합니다.',
  },
  {
    id: 'tenureLabel',
    label: '재직기간',
    type: 'computed',
    group: '재직 정보',
    help: '입사일과 발급일을 함께 표시합니다.',
    span: 2,
  },
  {
    id: 'purpose',
    label: '용도',
    type: 'text',
    group: '재직 정보',
    placeholder: '예: ○○은행 대출 심사 제출용',
    required: true,
    maxLength: 80,
    help: '용도 외 사용을 막기 위해 제출처와 용도를 구체적으로 적습니다.',
    span: 2,
  },
  {
    id: 'issuerCompany',
    label: '상호',
    type: 'text',
    group: '발급 회사',
    placeholder: '옷깃 주식회사',
    required: true,
    maxLength: 60,
  },
  {
    id: 'issuerBiz',
    label: '사업자등록번호',
    type: 'text',
    group: '발급 회사',
    placeholder: '123-45-67891',
    maxLength: 20,
  },
  {
    id: 'issuerBizLabel',
    label: '사업자등록번호 표시',
    type: 'computed',
    group: '발급 회사',
    help: '입력한 번호를 000-00-00000 형식으로 표시합니다.',
  },
  {
    id: 'issuerCeo',
    label: '대표자',
    type: 'text',
    group: '발급 회사',
    placeholder: '박대표',
    required: true,
    maxLength: 30,
  },
  {
    id: 'issuerAddress',
    label: '회사 주소',
    type: 'text',
    group: '발급 회사',
    placeholder: '예: 서울특별시 마포구 옷깃로 12',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'issuerContact',
    label: '연락처',
    type: 'text',
    group: '발급 회사',
    placeholder: '02-1234-5678',
    maxLength: 40,
  },
];

const blocks: FormBlock[] = [
  {
    kind: 'header',
    title: '재직증명서',
    docNoField: 'docNo',
    dateField: 'date',
    docNoLabel: '발급번호',
    dateLabel: '발급일',
    logo: true,
  },
  { kind: 'section', title: '재직자 정보' },
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
      { label: '부서', field: 'department' },
      { label: '직위', field: 'position' },
    ],
  },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '고용형태', field: 'employmentType' },
      { label: '담당업무', field: 'duty' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '주소', field: 'address' }] },
  { kind: 'section', title: '재직 정보' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '입사일', field: 'joinedAt' },
      { label: '재직 년·개월', field: 'tenureYears' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '재직기간', field: 'tenureLabel' }] },
  { kind: 'kv', columns: 1, rows: [{ label: '용도', field: 'purpose' }] },
  {
    kind: 'paragraph',
    text: '상기와 같이 재직하고 있음을 증명합니다.',
    align: 'center',
    size: 12,
    bold: true,
    before: 3,
    after: 3,
  },
  { kind: 'section', title: '발급 회사' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '상호', field: 'issuerCompany' },
      { label: '사업자등록번호', field: 'issuerBizLabel' },
    ],
  },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '대표자', field: 'issuerCeo' },
      { label: '연락처', field: 'issuerContact' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '주소', field: 'issuerAddress' }] },
  {
    kind: 'notice',
    text: '본 증명서는 제출용으로 발급되었으며, 용도 외 사용을 금합니다.',
  },
  {
    kind: 'signature',
    roles: ['대표이사'],
    bottom: true,
    seal: true,
  },
];

export const employmentCertificate: FormTemplate = {
  slug: 'employment-certificate',
  title: '재직증명서',
  family: 'proof',
  category: 'proof',
  description:
    '재직 사실을 증명하는 재직증명서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 회사 정보와 직인을 넣을 수 있고, 입력한 내용은 서버로 전송되지 않습니다.',
  keywords: [
    '재직증명서 양식',
    '재직증명서 PDF',
    '재직증명서 만들기',
    '재직 증명서',
    '회사 재직증명서',
  ],
  updated: '2026-11-15',
  docPrefix: 'EP',
  companyParty: 'issuer',
  lead: '성명·소속·재직기간을 한 장에 정리하는 재직증명서입니다. 회사 정보와 직인을 넣어 바로 제출할 수 있고, 입사일을 기준으로 재직기간과 재직 년·개월이 자동으로 계산됩니다.',
  useCases: [
    '은행 대출·카드 심사 서류로 낼 때',
    '비자·해외 체류 서류를 준비할 때',
    '관공서·공공기관에 재직 사실을 증명할 때',
    '임대차·보증 심사에 소득·재직 증빙을 낼 때',
  ],
  howTo: [
    '발급번호와 발급일, 재직자 정보를 확인합니다.',
    '입사일을 입력하면 재직기간과 재직 년·개월이 자동으로 계산됩니다.',
    '용도와 발급 회사 정보를 적고, 회사 로고·직인을 넣습니다.',
    '미리보기에서 확인한 뒤 PDF로 내려받아 직인을 날인합니다.',
  ],
  notes: [
    '이 증명서는 회사가 발급하는 문서입니다. 회사 직인과 발급 책임자의 확인 없이는 효력이 없을 수 있습니다.',
    '주민등록번호 전체는 꼭 필요한 경우에만 출력 후 직접 적고, 제출 후 안전하게 파기하세요.',
    '용도를 구체적으로 적어 용도 외 사용을 막으세요. 기관에 따라 발급일로부터 유효기간이 정해져 있을 수 있습니다.',
    '허위 재직증명서의 발급·사용은 법적 책임을 질 수 있습니다.',
  ],
  fields,
  blocks,
  sample: {
    docNo: 'C-20261115-001',
    date: '2026-11-15',
    name: '김옷깃',
    birth: '1990-05-12',
    department: '경영지원팀',
    position: '대리',
    employmentType: '정규직',
    duty: '비용 정산, 사무용품 구매, 사내 문서 양식 관리',
    address: '서울특별시 마포구 옷깃로 12, 3층',
    joinedAt: '2020-03-02',
    purpose: '○○은행 대출 심사 제출용',
    issuerCompany: '옷깃 주식회사',
    issuerBiz: '123-45-67891',
    issuerCeo: '박대표',
    issuerAddress: '서울특별시 마포구 옷깃로 12',
    issuerContact: '02-1234-5678',
  },
  compute: (values) => {
    const joinedAt = values.joinedAt?.trim() ?? '';
    const issuedAt = values.date?.trim() ?? '';
    const tenure = formatTenure(joinedAt, issuedAt);
    return {
      tenureLabel: joinedAt ? `${formatDateDot(joinedAt)} ~ 현재` : '',
      tenureYears: tenure,
      issuerBizLabel: values.issuerBiz?.trim() ? formatBizNo(values.issuerBiz) : '',
    };
  },
  validate: (values) => {
    const errors: string[] = [];
    if (values.joinedAt && values.date && values.joinedAt > values.date) {
      errors.push('입사일은 발급일보다 늦을 수 없습니다.');
    }
    if (values.birth && values.date && values.birth > values.date) {
      errors.push('생년월일을 다시 확인하세요.');
    }
    if (values.issuerBiz?.trim() && !isValidBizNo(values.issuerBiz)) {
      errors.push('사업자등록번호를 다시 확인하세요.');
    }
    return errors;
  },
  faq: [
    {
      q: '재직증명서에 주민등록번호를 꼭 써야 하나요?',
      a: '기관에 따라 요구할 수 있지만, 이 양식은 생년월일만 입력하도록 했습니다. 주민등록번호 전체가 필요하면 PDF로 출력한 뒤 해당 칸에 직접 적고, 제출 후 안전하게 파기하세요.',
    },
    {
      q: '회사 직인 없이도 효력이 있나요?',
      a: '재직증명서의 효력은 회사 규정과 제출 기관의 요구에 따릅니다. 이 양식은 회사 로고와 직인 이미지를 넣을 수 있지만, 최종 효력은 회사의 발급 절차와 직인 날인으로 완성됩니다.',
    },
    {
      q: '재직기간은 어떻게 계산되나요?',
      a: '입사일부터 발급일까지의 기간을 년·개월로 계산해 표시합니다. 발급일을 바꾸면 재직기간도 함께 바뀝니다.',
    },
    {
      q: '용도는 왜 적어야 하나요?',
      a: '용도를 명확히 적으면 용도 외 사용을 막고, 제출 기관의 요구를 확인하는 데 도움이 됩니다. 제출처와 사용 목적을 구체적으로 적으세요.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 근로기준 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '개인정보보호위원회 — 개인정보 안전성 확보조치',
      href: 'https://www.pipc.go.kr/',
    },
    {
      label: '행정안전부 — 문서 관리 안내',
      href: 'https://www.mois.go.kr/',
    },
  ],
  related: [
    { label: '위임장', href: '/forms/delegation/' },
    { label: '인수인계서', href: '/forms/handover/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
