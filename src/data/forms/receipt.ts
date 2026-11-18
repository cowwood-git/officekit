import { formatKoreanAmount } from '@/lib/doc/format';
import type { FormField, FormTemplate } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'RC-20261117-001',
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
    id: 'payee',
    label: '영수인',
    type: 'text',
    group: '영수 정보',
    required: true,
    placeholder: '예: 옷깃마트',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'payeeBiz',
    label: '사업자번호',
    type: 'text',
    group: '영수 정보',
    placeholder: '000-00-00000',
    maxLength: 20,
  },
  {
    id: 'payer',
    label: '납부자',
    type: 'text',
    group: '영수 정보',
    required: true,
    placeholder: '예: 거래처 주식회사',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'payerContact',
    label: '납부자 연락처',
    type: 'text',
    group: '영수 정보',
    placeholder: '010-1234-5678',
    maxLength: 40,
  },
  {
    id: 'amount',
    label: '영수 금액',
    type: 'text',
    group: '영수 내역',
    required: true,
    placeholder: '330,000',
    maxLength: 20,
    help: '실제로 받은 금액을 숫자로 적습니다.',
  },
  {
    id: 'amountLabel',
    label: '금액 표시',
    type: 'computed',
    group: '영수 내역',
    help: '입력한 금액을 원 단위로 표시합니다.',
  },
  {
    id: 'amountKorean',
    label: '일금',
    type: 'computed',
    group: '영수 내역',
    help: '금액을 한글로 표시합니다.',
    span: 2,
  },
  {
    id: 'item',
    label: '영수 내용',
    type: 'text',
    group: '영수 내역',
    required: true,
    placeholder: '예: 11월 사무용품 구입',
    maxLength: 100,
    span: 3,
  },
  {
    id: 'method',
    label: '결제 방법',
    type: 'select',
    group: '영수 내역',
    options: ['현금', '카드', '계좌 이체', '기타'],
    defaultValue: '현금',
    required: true,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '품목 내역, 요청 사항 등',
    maxLength: 300,
    rows: 5,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['영수인'],
    defaultValue: JSON.stringify([{ label: '영수인', enabled: true }]),
    maxSelected: 1,
    editable: true,
    help: '영수인 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

export const receipt: FormTemplate = {
  slug: 'receipt',
  title: '간이영수증',
  family: 'finance',
  category: 'money',
  description:
    '소액 현금 거래에 쓰는 간이영수증을 브라우저에서 작성하고 A4 PDF로 저장합니다. 금액과 일금이 자동으로 표시되고 도장을 넣을 수 있습니다.',
  keywords: [
    '간이영수증',
    '간이영수증 양식',
    '현금영수증 양식',
    '영수증 PDF',
    '간이 영수증 만들기',
    '소액 영수증',
  ],
  updated: '2026-11-17',
  docPrefix: 'RC',
  lead: '소액 현금 거래에서 “받았다”는 사실을 남기는 간이영수증입니다. 영수 금액과 일금을 자동으로 표시하고 서명·도장란을 제공합니다.',
  useCases: [
    '소액 현금 거래의 영수증을 만들 때',
    '세금계산서·카드전표가 없는 거래를 기록할 때',
    '동호회·행사 비용을 정산할 때',
    '개인 간 물품 대금을 확인할 때',
  ],
  howTo: [
    '문서 번호와 작성일을 확인합니다.',
    '영수인과 납부자, 연락처를 적습니다.',
    '영수 금액을 입력하면 금액과 일금이 자동으로 표시됩니다.',
    '영수 내용과 결제 방법을 적고 PDF로 내려받아 서명·날인합니다.',
  ],
  notes: [
    '간이영수증은 세금계산서·현금영수증을 대신하지 않습니다. 부가세 신고·경비 처리는 관련 증빙 규정을 따르세요.',
    '영수 금액과 실제 받은 금액이 같은지 확인하고, 필요하면 품목 내역을 비고에 적으세요.',
    '도장·서명은 회사 규정에 따라 출력 후 날인하거나 PDF 서명 도구를 사용하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '간이영수증',
      docNoField: 'docNo',
      dateField: 'date',
    },
    {
      kind: 'paragraph',
      text: '아래 금액을 정히 영수하였습니다.',
      align: 'center',
      before: 2,
      after: 2,
    },
    { kind: 'section', title: '영수 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '영수인', field: 'payee' },
        { label: '납부자', field: 'payer' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '사업자번호', field: 'payeeBiz' },
        { label: '납부자 연락처', field: 'payerContact' },
      ],
    },
    { kind: 'section', title: '영수 내역' },
    { kind: 'kv', columns: 1, rows: [{ label: '내용', field: 'item' }] },
    {
      kind: 'totals',
      rows: [
        { label: '영수 금액', field: 'amountLabel', strong: true },
        { label: '일금', field: 'amountKorean' },
      ],
      width: 90,
    },
    { kind: 'kv', columns: 2, rows: [{ label: '결제 방법', field: 'method' }] },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 5 },
    {
      kind: 'signature',
      roles: ['영수인'],
      rolesField: 'approvalRoles',
      bottom: true,
      seal: true,
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
    const amount = parseAmount(values.amount ?? '');
    if (!values.amount?.trim()) return ['영수 금액을 입력하세요.'];
    return amount > 0 ? [] : ['영수 금액은 1원 이상이어야 합니다.'];
  },
  sample: {
    docNo: 'RC-20261117-001',
    date: '2026-11-17',
    payee: '옷깃마트',
    payeeBiz: '123-45-67891',
    payer: '거래처 주식회사',
    payerContact: '010-1234-5678',
    amount: '330000',
    item: '11월 사무용품 구입',
    method: '현금',
    note: '복사용지 10박스, 토너 2개',
  },
  faq: [
    {
      q: '간이영수증도 경비 처리에 쓸 수 있나요?',
      a: '거래 금액과 업종에 따라 인정 범위가 다릅니다. 일반적으로 소액·비정기 거래는 간이영수증으로 처리할 수 있지만, 부가세 공제는 별도 요건이 있으므로 세무 기준을 확인하세요.',
    },
    {
      q: '세금계산서와 무엇이 다른가요?',
      a: '세금계산서는 부가세가 붙은 정식 거래 증빙이고, 간이영수증은 “돈을 받았다”는 사실을 간단히 남기는 문서입니다. 세금계산서 발행 대상이면 세금계산서를 발행해야 합니다.',
    },
    {
      q: '금액은 자동으로 계산되나요?',
      a: '입력한 금액을 원 단위와 한글 일금으로 표시합니다. 합계나 부가세를 계산하지는 않으므로 실제 받은 금액과 대조하세요.',
    },
    {
      q: '도장이 없으면 어떻게 하나요?',
      a: 'PDF로 출력해 자필 서명을 하거나, PDF 서명 도구로 전자 서명을 넣을 수 있습니다. 회사 프리셋에 도장을 저장해 두면 자동으로 넣을 수 있습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국세청 — 적격증빙 안내',
      href: 'https://www.nts.go.kr/',
    },
    {
      label: '국세청 홈택스 — 현금영수증 안내',
      href: 'https://www.hometax.go.kr/',
    },
  ],
  related: [
    { label: '지출결의서 양식', href: '/forms/expense-report/' },
    { label: '입금확인서 양식', href: '/forms/payment-confirmation/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
