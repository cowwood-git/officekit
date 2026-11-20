import type { FormField, FormTemplate } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'CRN-20261118-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  { id: 'date', label: '작성일', type: 'date', group: '문서', defaultToday: true, required: true },
  {
    id: 'contractName',
    label: '계약명',
    type: 'text',
    group: '계약 정보',
    placeholder: '예: 사무실 임대차 계약',
    required: true,
    maxLength: 100,
    span: 2,
  },
  { id: 'contractDate', label: '최초 계약일', type: 'date', group: '계약 정보' },
  { id: 'expiryDate', label: '기존 만료일', type: 'date', group: '계약 정보', required: true },
  {
    id: 'partyA',
    label: '갑',
    type: 'text',
    group: '계약 정보',
    placeholder: '예: 건물주',
    required: true,
    maxLength: 60,
  },
  {
    id: 'partyB',
    label: '을',
    type: 'text',
    group: '계약 정보',
    placeholder: '예: 옷깃 주식회사',
    required: true,
    maxLength: 60,
  },
  {
    id: 'renewalFrom',
    label: '갱신 시작일',
    type: 'date',
    group: '갱신 조건',
    required: true,
  },
  { id: 'renewalTo', label: '갱신 종료일', type: 'date', group: '갱신 조건', required: true },
  {
    id: 'renewalTerm',
    label: '갱신 기간',
    type: 'text',
    group: '갱신 조건',
    placeholder: '예: 1년',
    maxLength: 40,
  },
  {
    id: 'renewalAmount',
    label: '갱신 금액',
    type: 'text',
    group: '갱신 조건',
    placeholder: '예: 월 3,300,000원 (부가세 별도)',
    maxLength: 80,
  },
  {
    id: 'renewalTerms',
    label: '갱신 조건',
    type: 'textarea',
    group: '갱신 내용',
    placeholder: '갱신되는 주요 조건과 변경 사항을 적습니다.',
    required: true,
    maxLength: 700,
    rows: 4,
    span: 3,
  },
  {
    id: 'note',
    label: '기타',
    type: 'textarea',
    group: '기타',
    placeholder: '갱신하지 않는 조항은 원 계약을 그대로 유지합니다. 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명 당사자',
    type: 'roles',
    group: '서명',
    options: ['갑', '을'],
    defaultValue: JSON.stringify([
      { label: '갑', enabled: true },
      { label: '을', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '서명란에 표시할 당사자 이름입니다.',
    span: 3,
  },
];

export const contractRenewal: FormTemplate = {
  slug: 'contract-renewal',
  title: '계약 갱신 합의서',
  family: 'sales',
  category: 'money',
  description:
    '기존 계약을 갱신할 때 갱신 기간·금액·변경 조건을 정리하는 계약 갱신 합의서를 A4 PDF로 만듭니다. 계약명과 최초 계약일·기존 만료일을 적어 두면 어떤 계약의 갱신인지 분명해집니다.',
  keywords: [
    '계약 갱신 합의서',
    '계약 갱신 합의서 양식',
    '계약 연장',
    '계약 갱신서',
    '임대차 갱신',
    '계약 갱신 PDF',
  ],
  updated: '2026-11-18',
  docPrefix: 'CRN',
  lead: '만료되는 계약을 이어서 운영할 때 갱신 기간과 금액, 바뀌는 조건을 정리하는 합의서입니다. 양 당사자가 같은 내용을 확인하고 서명합니다.',
  useCases: [
    '임대차·유지보수 계약을 1년 더 연장할 때',
    '계약 기간은 그대로 두고 금액만 조정할 때',
    '갱신 조건을 문서로 남겨 두고 싶을 때',
    '구두로 합의한 연장을 공식화할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 원 계약 정보를 확인합니다.',
    '갑·을 당사자와 기존 만료일을 적습니다.',
    '갱신 시작일·종료일과 갱신 금액을 입력합니다.',
    '갱신 조건을 적고 PDF로 내려받아 양쪽이 서명합니다.',
  ],
  notes: [
    '이 양식은 계약 갱신 내용을 정리하는 참고 자료입니다. 중요한 계약은 법률 검토를 권장합니다.',
    '갱신하지 않는 조항은 원 계약이 그대로 유효하다는 점을 기타에 명시하세요.',
    '갱신 시작일은 기존 만료일과 이어지도록 맞추면 공백 기간이 생기지 않습니다.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '계약 갱신 합의서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    {
      kind: 'paragraph',
      text: '양 당사자는 아래 계약을 갱신하기로 합의한다.',
      align: 'center',
      before: 2,
      after: 2,
    },
    { kind: 'section', title: '계약 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '계약명', field: 'contractName' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '최초 계약일', field: 'contractDate' },
        { label: '기존 만료일', field: 'expiryDate' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '갑', field: 'partyA' },
        { label: '을', field: 'partyB' },
      ],
    },
    { kind: 'section', title: '갱신 조건' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '갱신 시작일', field: 'renewalFrom' },
        { label: '갱신 종료일', field: 'renewalTo' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '갱신 기간', field: 'renewalTerm' },
        { label: '갱신 금액', field: 'renewalAmount' },
      ],
    },
    { kind: 'section', title: '갱신 내용' },
    { kind: 'text', field: 'renewalTerms', minLines: 4 },
    { kind: 'section', title: '기타' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'notice',
      text: '본 양식은 참고용입니다. 서명 전 계약 내용과 법률 검토를 확인하세요.',
    },
    { kind: 'signature', roles: ['갑', '을'], rolesField: 'approvalRoles', bottom: true },
  ],
  validate: (values) => {
    const errors: string[] = [];
    if (values.renewalFrom && values.renewalTo && values.renewalTo < values.renewalFrom) {
      errors.push('갱신 종료일은 시작일보다 빠를 수 없습니다.');
    }
    if (values.expiryDate && values.renewalFrom && values.renewalFrom < values.expiryDate) {
      errors.push('갱신 시작일은 기존 만료일보다 빠를 수 없습니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'CRN-20261118-001',
    date: '2026-11-18',
    contractName: '사무실 임대차 계약',
    contractDate: '2024-12-01',
    expiryDate: '2026-11-30',
    partyA: '건물주',
    partyB: '옷깃 주식회사',
    renewalFrom: '2026-12-01',
    renewalTo: '2027-11-30',
    renewalTerm: '1년',
    renewalAmount: '월 3,300,000원 (부가세 별도)',
    renewalTerms:
      '임대 기간을 1년 연장하고 월 임대료를 기존 3,000,000원에서 3,300,000원으로 조정합니다. 관리비와 보증금은 원 계약과 동일하게 유지합니다.',
    note: '이 합의서에 적지 않은 조항은 원 계약의 내용을 그대로 유지합니다.',
  },
  faq: [
    {
      q: '계약 갱신 합의서는 언제 작성하나요?',
      a: '기존 계약이 만료되기 전에 갱신 조건을 정했을 때 작성합니다. 만료일 이후에 작성하면 공백 기간이 생길 수 있으니 미리 준비하세요.',
    },
    {
      q: '원 계약서와 함께 보관해야 하나요?',
      a: '네. 갱신 합의서는 원 계약의 기간과 조건을 바꾸는 문서이므로 원 계약서와 함께 보관해야 전체 내용을 확인할 수 있습니다.',
    },
    {
      q: '갱신 금액은 어떻게 적나요?',
      a: '부가세 포함 여부와 지급 주기를 함께 적습니다. “월 3,300,000원(부가세 별도)”처럼 기준을 명확히 하세요.',
    },
    {
      q: '법적 효력이 있나요?',
      a: '양 당사자가 서명하면 갱신 합의의 효력이 생길 수 있지만, 중요한 계약은 법률 전문가의 검토를 권장합니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    { label: '국가법령정보센터 — 민법', href: 'https://www.law.go.kr/' },
    { label: '공정거래위원회 — 계약·거래 안내', href: 'https://www.ftc.go.kr/' },
  ],
  related: [
    { label: '계약 변경 합의서 양식', href: '/forms/contract-amendment/' },
    { label: '계약 해지 합의서 양식', href: '/forms/contract-termination/' },
    { label: '거래처 담당자 변경 통지서', href: '/forms/vendor-contact-change/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
