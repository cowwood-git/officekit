import { formatKoreanAmount } from '@/lib/doc/format';
import type { FormField, FormTemplate } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'SC-20261117-001',
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
    id: 'clientCompany',
    label: '위탁자 상호',
    type: 'text',
    group: '당사자',
    required: true,
    placeholder: '예: 거래처 주식회사',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'clientCeo',
    label: '위탁자 대표자',
    type: 'text',
    group: '당사자',
    placeholder: '김대표',
    maxLength: 30,
  },
  {
    id: 'clientAddress',
    label: '위탁자 주소',
    type: 'text',
    group: '당사자',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'contractorCompany',
    label: '수탁자 상호',
    type: 'text',
    group: '당사자',
    required: true,
    placeholder: '예: 옷깃',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'contractorCeo',
    label: '수탁자 대표자',
    type: 'text',
    group: '당사자',
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: 'contractorAddress',
    label: '수탁자 주소',
    type: 'text',
    group: '당사자',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'serviceName',
    label: '용역명',
    type: 'text',
    group: '계약 개요',
    required: true,
    placeholder: '예: 홈페이지 유지보수',
    maxLength: 100,
    span: 3,
  },
  {
    id: 'periodFrom',
    label: '시작일',
    type: 'date',
    group: '계약 개요',
    required: true,
  },
  {
    id: 'periodTo',
    label: '종료일',
    type: 'date',
    group: '계약 개요',
    required: true,
  },
  {
    id: 'amount',
    label: '계약 금액',
    type: 'text',
    group: '계약 개요',
    required: true,
    placeholder: '12,000,000',
    maxLength: 20,
  },
  {
    id: 'amountLabel',
    label: '금액 표시',
    type: 'computed',
    group: '계약 개요',
    help: '입력한 계약 금액을 원 단위로 표시합니다.',
  },
  {
    id: 'amountKorean',
    label: '일금',
    type: 'computed',
    group: '계약 개요',
    help: '계약 금액을 한글로 표시합니다.',
    span: 2,
  },
  {
    id: 'paymentTerms',
    label: '대금 지급',
    type: 'text',
    group: '계약 개요',
    placeholder: '예: 매월 말일 지급',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'scope',
    label: '업무 범위',
    type: 'textarea',
    group: '업무 범위',
    placeholder: '수탁자가 수행할 업무와 제외 범위를 적습니다.',
    required: true,
    maxLength: 800,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명 당사자',
    type: 'roles',
    group: '서명',
    options: ['위탁자', '수탁자'],
    defaultValue: JSON.stringify([
      { label: '위탁자', enabled: true },
      { label: '수탁자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '서명란에 표시할 당사자 이름입니다.',
    span: 3,
  },
];

export const serviceContract: FormTemplate = {
  slug: 'service-contract',
  title: '표준 업무위탁계약서',
  family: 'sales',
  category: 'money',
  description:
    '업무를 외부에 위탁할 때 당사자·용역명·기간·대금·업무 범위를 정리하는 표준 업무위탁계약서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '업무위탁계약서',
    '표준 업무위탁계약서',
    '용역계약서',
    '업무위탁 계약',
    '프리랜서 계약서',
    '업무위탁계약서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'SV',
  lead: '업무를 외부 업체·전문가에게 맡길 때 기본 조건을 정리하는 표준 위탁계약서입니다. 당사자, 용역명, 기간, 대금, 업무 범위를 한 장에 담습니다.',
  useCases: [
    '외주 개발·디자인·유지보수를 맡길 때',
    '전문가·프리랜서와 용역 계약을 할 때',
    '반복 업무를 외부에 위탁할 때',
    '계약 조건을 문서로 남겨 분쟁을 예방할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 위탁자·수탁자 정보를 확인합니다.',
    '용역명과 계약 기간, 계약 금액, 대금 지급 방법을 적습니다.',
    '업무 범위와 제외 범위를 구체적으로 적습니다.',
    'PDF로 내려받아 양 당사자가 서명·날인합니다.',
  ],
  notes: [
    '이 양식은 참고용 표준안입니다. 계약의 효력·범위는 거래 내용과 준거법에 따라 달라질 수 있으므로 서명 전 법률 검토를 권장합니다.',
    '업무 범위와 산출물, 검수 기준을 명확히 적어 분쟁을 예방하세요.',
    '비밀유지·지식재산권·해지·손해배상 조항은 필요에 따라 추가하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '업무위탁계약서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    {
      kind: 'paragraph',
      text: '위탁자와 수탁자는 아래와 같이 업무위탁계약을 체결한다.',
      align: 'center',
      before: 2,
      after: 2,
    },
    {
      kind: 'parties',
      left: {
        label: '위탁자',
        lines: (values) =>
          [
            values.clientCompany ?? '',
            values.clientCeo ? `대표 ${values.clientCeo}` : '',
            values.clientAddress ?? '',
          ].filter(Boolean),
      },
      right: {
        label: '수탁자',
        lines: (values) =>
          [
            values.contractorCompany ?? '',
            values.contractorCeo ? `대표 ${values.contractorCeo}` : '',
            values.contractorAddress ?? '',
          ].filter(Boolean),
      },
    },
    { kind: 'section', title: '계약 개요' },
    { kind: 'kv', columns: 1, rows: [{ label: '용역명', field: 'serviceName' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '시작일', field: 'periodFrom' },
        { label: '종료일', field: 'periodTo' },
      ],
    },
    {
      kind: 'totals',
      rows: [
        { label: '계약 금액', field: 'amountLabel', strong: true },
        { label: '일금', field: 'amountKorean' },
      ],
      width: 90,
    },
    { kind: 'kv', columns: 2, rows: [{ label: '대금 지급', field: 'paymentTerms' }] },
    { kind: 'section', title: '업무 범위' },
    { kind: 'text', field: 'scope', minLines: 3 },
    { kind: 'section', title: '주요 조건' },
    {
      kind: 'paragraph',
      text: '제1조 (비밀유지) 수탁자는 계약 수행 중 알게 된 위탁자의 비밀정보를 제3자에게 공개하거나 목적 외로 사용하지 않는다.',
      after: 2,
    },
    {
      kind: 'paragraph',
      text: '제2조 (해지·기타) 양 당사자는 상대방의 중대한 계약 위반 시 서면 통지로 계약을 해지할 수 있다. 이 계약에 정하지 않은 사항은 상호 협의하여 정한다.',
      after: 2,
    },
    {
      kind: 'notice',
      text: '본 양식은 참고용입니다. 서명 전 계약 내용과 법률 검토를 확인하세요.',
    },
    {
      kind: 'signature',
      roles: ['위탁자', '수탁자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values) => {
    const amount = parseAmount(values.amount ?? '');
    return {
      amountLabel: amount > 0 ? formatWon(amount) : '',
      amountKorean: amount > 0 ? formatKoreanAmount(amount) : '',
    };
  },
  validate: (values) => {
    const errors: string[] = [];
    if (values.periodFrom && values.periodTo && values.periodTo < values.periodFrom) {
      errors.push('종료일은 시작일보다 빠를 수 없습니다.');
    }
    if (values.amount?.trim() && parseAmount(values.amount) <= 0) {
      errors.push('계약 금액은 1원 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'SC-20261117-001',
    date: '2026-11-17',
    clientCompany: '거래처 주식회사',
    clientCeo: '김대표',
    clientAddress: '부산시 해운대구 1',
    contractorCompany: '옷깃',
    contractorCeo: '홍길동',
    contractorAddress: '서울시 강남구 테헤란로 1',
    serviceName: '홈페이지 유지보수',
    periodFrom: '2026-12-01',
    periodTo: '2027-11-30',
    amount: '12000000',
    paymentTerms: '매월 말일 계좌 이체',
    scope:
      '홈페이지 오류 수정, 보안 업데이트, 월 1회 정기 점검, 콘텐츠 수정 지원을 포함합니다. 신규 페이지 제작과 디자인 전면 개편은 제외합니다.',
  },
  faq: [
    {
      q: '업무위탁계약서는 언제 쓰나요?',
      a: '외부 업체·전문가에게 업무를 맡길 때 사용합니다. 용역명, 기간, 대금, 업무 범위를 명확히 적는 것이 핵심입니다.',
    },
    {
      q: '프리랜서와도 쓸 수 있나요?',
      a: '네. 다만 근로계약과 구분해야 하며, 실제 근무 형태에 따라 법적 성격이 달라질 수 있으므로 전문가 검토를 권장합니다.',
    },
    {
      q: '업무 범위는 어떻게 적나요?',
      a: '포함되는 업무와 제외되는 업무를 나눠 적습니다. 산출물과 검수 기준을 함께 정하면 분쟁을 줄일 수 있습니다.',
    },
    {
      q: '법적 효력이 있나요?',
      a: '양 당사자가 서명·날인하면 계약으로 활용할 수 있지만, 중요한 계약은 법률 전문가의 검토를 받으세요.',
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
    { label: '비밀유지계약서(NDA) 양식', href: '/forms/nda/' },
    { label: '계약 변경 합의서 양식', href: '/forms/contract-amendment/' },
    { label: '견적서 양식', href: '/forms/quote/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
