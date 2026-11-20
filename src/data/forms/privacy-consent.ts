import type { FormBlock, FormField, FormTemplate } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '기본 정보',
    placeholder: 'PC-20261117-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '작성일',
    type: 'date',
    group: '기본 정보',
    defaultToday: true,
    required: true,
  },
  {
    id: 'consentDate',
    label: '동의일',
    type: 'date',
    group: '기본 정보',
    defaultToday: true,
    required: true,
  },
  {
    id: 'company',
    label: '개인정보 처리자',
    type: 'text',
    group: '처리자 정보',
    placeholder: '옷깃 주식회사',
    required: true,
    maxLength: 60,
  },
  {
    id: 'contact',
    label: '문의처',
    type: 'text',
    group: '처리자 정보',
    placeholder: '02-1234-5678 / privacy@example.com',
    maxLength: 80,
  },
  {
    id: 'purpose',
    label: '수집·이용 목적',
    type: 'text',
    group: '수집·이용 내역',
    placeholder: '예: 입사 지원 및 채용 전형 진행',
    required: true,
    maxLength: 120,
    span: 3,
  },
  {
    id: 'items',
    label: '수집 항목',
    type: 'textarea',
    group: '수집·이용 내역',
    placeholder: '예: 성명, 생년월일, 연락처, 이메일, 주소',
    required: true,
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'retention',
    label: '보유·이용 기간',
    type: 'text',
    group: '수집·이용 내역',
    placeholder: '예: 채용 전형 종료 후 6개월',
    required: true,
    maxLength: 120,
    span: 3,
  },
  {
    id: 'thirdParty',
    label: '제3자 제공',
    type: 'textarea',
    group: '수집·이용 내역',
    placeholder: '제3자 제공이 있으면 받는 곳과 제공 항목을 적습니다. 없으면 비워 두세요.',
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'name',
    label: '성명',
    type: 'text',
    group: '동의자',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'birth',
    label: '생년월일',
    type: 'date',
    group: '동의자',
  },
  {
    id: 'phone',
    label: '연락처',
    type: 'text',
    group: '동의자',
    placeholder: '010-1234-5678',
    maxLength: 40,
  },
  {
    id: 'address',
    label: '주소',
    type: 'text',
    group: '동의자',
    placeholder: '예: 서울특별시 마포구 옷깃로 12, 3층',
    maxLength: 120,
    span: 2,
  },
];

const blocks: FormBlock[] = [
  {
    kind: 'header',
    variant: 'editorial',
    title: '개인정보 수집·이용 동의서',
    docNoField: 'docNo',
    dateField: 'date',
  },
  { kind: 'section', title: '개인정보 처리자' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '처리자', field: 'company' },
      { label: '문의처', field: 'contact' },
    ],
  },
  { kind: 'section', title: '수집·이용 내역' },
  {
    kind: 'table',
    columns: [
      { label: '구분', width: 38 },
      { label: '내용', width: 136 },
    ],
    rows: (values) => {
      const rows: string[][] = [
        ['수집·이용 목적', (values.purpose ?? '').trim()],
        ['수집 항목', (values.items ?? '').trim()],
        ['보유·이용 기간', (values.retention ?? '').trim()],
      ];
      if ((values.thirdParty ?? '').trim()) {
        rows.push(['제3자 제공', (values.thirdParty ?? '').trim()]);
      }
      return rows;
    },
  },
  { kind: 'section', title: '동의 내용' },
  {
    kind: 'paragraph',
    text: '1. 본인은 위 개인정보의 수집·이용에 동의합니다.',
    before: 1,
  },
  {
    kind: 'paragraph',
    text: '2. 동의를 거부할 권리가 있으며, 거부 시 서비스 이용이 제한될 수 있습니다.',
    before: 1,
  },
  {
    kind: 'paragraph',
    text: '3. 개인정보는 수집·이용 목적을 달성한 뒤 지체 없이 파기합니다.',
    before: 1,
    after: 4,
  },
  { kind: 'section', title: '동의자' },
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
      { label: '동의일', field: 'consentDate' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '주소', field: 'address' }] },
  {
    kind: 'signature',
    roles: ['동의자'],
    bottom: true,
  },
];

export const privacyConsent: FormTemplate = {
  slug: 'privacy-consent',
  title: '개인정보 수집·이용 동의서',
  family: 'admin',
  category: 'proof',
  description:
    '개인정보 수집 목적과 항목, 보유 기간을 알리고 동의를 받는 개인정보 수집·이용 동의서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '개인정보 동의서',
    '개인정보 수집 이용 동의서',
    '개인정보 동의서 양식',
    '개인정보 수집 동의',
    '동의서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'PV',
  lead: '개인정보를 수집하기 전에 목적·항목·보유 기간을 알리고 동의를 받는 동의서입니다. 채용·입사·서비스 신청 서류에 첨부할 수 있습니다.',
  useCases: [
    '채용 지원자에게 개인정보 수집 동의를 받을 때',
    '입사 서류에 개인정보 동의서를 첨부할 때',
    '서비스 신청·상담 과정에서 동의를 받을 때',
    '제3자 제공 여부를 함께 안내할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 동의일을 확인합니다.',
    '개인정보 처리자와 수집·이용 목적, 항목, 보유 기간을 적습니다.',
    '제3자 제공이 있으면 내용을 추가합니다.',
    '동의자 정보를 적고 PDF로 내려받아 서명을 받습니다.',
  ],
  notes: [
    '이 양식은 참고용입니다. 개인정보 수집·이용은 개인정보 보호법과 회사의 개인정보 처리방침을 따라야 합니다.',
    '필수 동의와 선택 동의를 구분해야 하는 경우, 항목별로 동의서를 나누거나 선택 항목을 표시하세요.',
    '동의를 거부할 권리와 거부 시 불이익을 함께 안내해야 합니다.',
  ],
  fields,
  blocks,
  sample: {
    docNo: 'PC-20261117-001',
    date: '2026-11-17',
    consentDate: '2026-11-17',
    company: '옷깃 주식회사',
    contact: '02-1234-5678',
    purpose: '입사 지원 및 채용 전형 진행',
    items: '성명, 생년월일, 연락처, 이메일, 주소',
    retention: '채용 전형 종료 후 6개월',
    thirdParty: '',
    name: '김옷깃',
    birth: '1990-05-12',
    phone: '010-1234-5678',
    address: '서울특별시 마포구 옷깃로 12, 3층',
  },
  faq: [
    {
      q: '개인정보 동의서는 왜 필요한가요?',
      a: '개인정보 보호법에 따라 개인정보를 수집·이용할 때 목적·항목·보유 기간을 알리고 동의를 받아야 합니다. 이 양식은 그 내용을 한 장에 정리합니다.',
    },
    {
      q: '필수 동의와 선택 동의를 나눠야 하나요?',
      a: '선택 항목이 있다면 필수와 선택을 구분해 안내해야 합니다. 이 양식은 기본 항목만 담고 있으므로, 선택 항목은 별도 문구를 추가하거나 동의서를 나눠 사용하세요.',
    },
    {
      q: '동의를 거부하면 어떻게 되나요?',
      a: '동의를 거부할 권리가 있으며, 거부 시 서비스 제공이나 채용 전형이 제한될 수 있습니다. 거부에 따른 불이익을 구체적으로 안내해야 합니다.',
    },
    {
      q: '보유 기간은 어떻게 정하나요?',
      a: '수집 목적 달성에 필요한 최소 기간으로 정하고, 법령에 보존 의무가 있으면 그 기간을 적습니다. 기간이 지나면 지체 없이 파기해야 합니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국가법령정보센터 — 개인정보 보호법',
      href: 'https://www.law.go.kr/법령/개인정보보호법',
    },
    {
      label: '개인정보보호위원회 — 개인정보 처리 기준',
      href: 'https://www.pipc.go.kr/',
    },
  ],
  related: [
    { label: '비품 신청서 양식', href: '/forms/supplies-request/' },
    { label: '인수인계서 양식', href: '/forms/handover/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
