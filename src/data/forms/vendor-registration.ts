import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const items: RepeatGroup = {
  id: 'items',
  label: '거래 품목',
  group: '거래 조건',
  help: '거래할 품목과 규격, 기준 단가를 적습니다. 비워 두어도 등록신청은 가능합니다.',
  minRows: 2,
  maxRows: 25,
  addLabel: '+ 품목 추가',
  columns: [
    {
      id: 'name',
      label: '품목',
      type: 'text',
      placeholder: '예: A4 복사용지',
      maxLength: 60,
      width: 3,
    },
    {
      id: 'spec',
      label: '규격',
      type: 'text',
      placeholder: '예: 80g 2,500매',
      maxLength: 60,
      width: 2.4,
    },
    {
      id: 'unitPrice',
      label: '기준 단가',
      type: 'money',
      placeholder: '0',
      width: 1.5,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '납기·최소 수량 등',
      maxLength: 40,
      width: 2,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'VR-20261117-001',
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
    id: 'company',
    label: '상호',
    type: 'text',
    group: '신청 업체',
    required: true,
    placeholder: '예: 거래처 주식회사',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'bizNo',
    label: '사업자번호',
    type: 'text',
    group: '신청 업체',
    required: true,
    placeholder: '000-00-00000',
    maxLength: 20,
    help: '사업자등록증과 같은 번호를 적습니다.',
  },
  {
    id: 'ceo',
    label: '대표자',
    type: 'text',
    group: '신청 업체',
    placeholder: '김대표',
    maxLength: 30,
  },
  {
    id: 'businessType',
    label: '업태',
    type: 'text',
    group: '신청 업체',
    placeholder: '예: 도소매업',
    maxLength: 40,
  },
  {
    id: 'businessItem',
    label: '종목',
    type: 'text',
    group: '신청 업체',
    placeholder: '예: 사무용품',
    maxLength: 40,
  },
  {
    id: 'address',
    label: '주소',
    type: 'text',
    group: '신청 업체',
    placeholder: '부산시 해운대구 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'phone',
    label: '대표 연락처',
    type: 'text',
    group: '신청 업체',
    placeholder: '051-123-4567',
    maxLength: 40,
  },
  {
    id: 'email',
    label: '대표 이메일',
    type: 'text',
    group: '신청 업체',
    placeholder: 'contact@example.com',
    maxLength: 80,
  },
  {
    id: 'manager',
    label: '담당자',
    type: 'text',
    group: '담당자',
    required: true,
    placeholder: '김담당',
    maxLength: 30,
  },
  {
    id: 'managerPosition',
    label: '직위',
    type: 'text',
    group: '담당자',
    placeholder: '과장',
    maxLength: 30,
  },
  {
    id: 'managerPhone',
    label: '연락처',
    type: 'text',
    group: '담당자',
    placeholder: '010-1234-5678',
    maxLength: 40,
  },
  {
    id: 'managerEmail',
    label: '이메일',
    type: 'text',
    group: '담당자',
    placeholder: 'manager@example.com',
    maxLength: 80,
  },
  {
    id: 'paymentTerms',
    label: '결제 조건',
    type: 'select',
    group: '거래 조건',
    options: ['현금', '계좌 이체 14일', '계좌 이체 30일', '계좌 이체 60일', '기타'],
    defaultValue: '계좌 이체 30일',
    required: true,
  },
  {
    id: 'bank',
    label: '정산 계좌',
    type: 'text',
    group: '거래 조건',
    placeholder: '은행 · 계좌번호 · 예금주',
    maxLength: 80,
    sensitive: true,
  },
  {
    id: 'deliveryTerms',
    label: '납품 조건',
    type: 'text',
    group: '거래 조건',
    placeholder: '예: 주문 후 3일 이내, 10만 원 이상 무료 배송',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'itemCount',
    label: '등록 품목',
    type: 'computed',
    group: '거래 조건',
    help: '입력한 거래 품목 수입니다.',
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['신청인', '접수자'],
    defaultValue: JSON.stringify([
      { label: '신청인', enabled: true },
      { label: '접수자', enabled: true },
    ]),
    maxSelected: 2,
    editable: true,
    help: '신청인과 접수자 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.name ?? '').trim());

const digitsOf = (value: string): string => value.replace(/\D/g, '');

export const vendorRegistration: FormTemplate = {
  slug: 'vendor-registration',
  title: '거래처 등록신청서',
  family: 'sales',
  category: 'money',
  description:
    '새 거래처를 등록할 때 업체 정보와 담당자, 거래 조건을 정리하는 거래처 등록신청서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '거래처 등록신청서',
    '거래처 등록 양식',
    '거래처 등록 신청',
    '업체 등록신청서',
    '거래처 등록신청서 PDF',
    '신규 거래처 등록',
  ],
  updated: '2026-11-21',
  docPrefix: 'VG',
  lead: '새로 거래할 업체의 기본 정보와 담당자, 결제·납품 조건을 정리해 등록을 신청하는 문서입니다. 첨부 서류와 개인정보 이용 안내를 함께 확인할 수 있습니다.',
  useCases: [
    '새 거래처와 거래를 시작하며 등록을 요청할 때',
    '기존 거래처의 담당자·계좌 정보를 갱신할 때',
    '구매 담당 부서에 업체 정보를 제출할 때',
    '거래 조건과 첨부 서류를 한 번에 정리할 때',
  ],
  howTo: [
    '문서 번호와 작성일을 확인합니다.',
    '신청 업체의 상호·사업자번호·주소와 담당자 정보를 입력합니다.',
    '결제 조건과 정산 계좌, 납품 조건을 적습니다.',
    '거래 품목과 첨부 서류를 확인하고 PDF로 내려받아 제출합니다.',
  ],
  notes: [
    '사업자번호와 계좌 정보는 사업자등록증·통장 사본과 일치해야 합니다.',
    '첨부 서류는 회사 규정에 따라 요구 항목이 다를 수 있습니다. 제출 전 확인하세요.',
    '개인정보는 거래처 등록과 거래 관리 목적에 필요한 범위에서만 수집·이용하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '거래처 등록신청서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '신청 업체' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '상호', field: 'company' },
        { label: '사업자번호', field: 'bizNo' },
        { label: '대표자', field: 'ceo' },
      ],
    },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '업태', field: 'businessType' },
        { label: '종목', field: 'businessItem' },
        { label: '대표 연락처', field: 'phone' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '주소', field: 'address' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '대표 이메일', field: 'email' },
        { label: '담당자 이메일', field: 'managerEmail' },
      ],
    },
    { kind: 'section', title: '담당자' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '담당자', field: 'manager' },
        { label: '직위', field: 'managerPosition' },
        { label: '연락처', field: 'managerPhone' },
      ],
    },

    { kind: 'section', title: '거래 조건' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '결제 조건', field: 'paymentTerms' },
        { label: '정산 계좌', field: 'bank' },
      ],
    },
    { kind: 'kv', columns: 2, rows: [{ label: '납품 조건', field: 'deliveryTerms' }] },
    { kind: 'section', title: '거래 품목' },
    {
      kind: 'table',
      columns: [
        { label: '품목', width: 70 },
        { label: '규격', width: 46 },
        { label: '기준 단가', width: 32, align: 'right' },
        { label: '비고', width: 26 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row) => [
          (row.name ?? '').trim(),
          (row.spec ?? '').trim(),
          parseAmount(row.unitPrice ?? '') > 0 ? formatWon(parseAmount(row.unitPrice ?? '')) : '',
          (row.note ?? '').trim(),
        ]),
      minRows: 2,
      blankMinRows: 2,
    },
    { kind: 'kv', columns: 2, rows: [{ label: '등록 품목', field: 'itemCount' }] },
    { kind: 'section', title: '첨부 서류' },
    {
      kind: 'checklist',
      columns: 2,
      items: [
        '사업자등록증 사본',
        '통장 사본',
        '인감증명서 또는 법인인감증명서',
        '법인등기부등본(법인인 경우)',
      ],
    },
    { kind: 'section', title: '개인정보 수집·이용 안내' },
    {
      kind: 'checklist',
      items: ['담당자 성명·연락처·이메일은 거래처 등록과 거래 관리에만 이용됨을 확인했습니다.'],
    },
    {
      kind: 'signature',
      roles: ['신청인', '접수자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const count = itemsOf(rows).length;
    return { itemCount: count > 0 ? `${count}개` : '' };
  },
  validate: (values) => {
    const errors: string[] = [];
    const digits = digitsOf(values.bizNo ?? '');
    if (values.bizNo?.trim() && digits.length !== 10) {
      errors.push('사업자번호는 숫자 10자리로 입력하세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'VG-20261117-001',
    date: '2026-11-17',
    company: '거래처 주식회사',
    bizNo: '220-81-62517',
    ceo: '김대표',
    businessType: '도소매업',
    businessItem: '사무용품',
    address: '부산시 해운대구 1',
    phone: '051-123-4567',
    email: 'contact@example.com',
    manager: '김담당',
    managerPosition: '과장',
    managerPhone: '010-1234-5678',
    managerEmail: 'manager@example.com',
    paymentTerms: '계좌 이체 30일',
    bank: '옷깃은행 123-456-789012 김대표',
    deliveryTerms: '주문 후 3일 이내 납품, 10만 원 이상 무료 배송',
  },
  sampleRows: {
    items: [
      { name: 'A4 복사용지', spec: '80g 2,500매', unitPrice: '28000', note: '박스 단위' },
      { name: '토너 카트리지', spec: '검정', unitPrice: '82000', note: '' },
    ],
  },
  faq: [
    {
      q: '거래처 등록신청서는 언제 쓰나요?',
      a: '새 업체와 거래를 시작할 때 업체 정보와 결제·납품 조건을 등록하기 위해 씁니다. 기존 거래처의 정보가 바뀌었을 때 갱신용으로도 쓸 수 있습니다.',
    },
    {
      q: '사업자번호는 어떻게 적나요?',
      a: '사업자등록증에 적힌 10자리 번호를 하이픈과 함께 적습니다. 이 양식은 숫자 10자리인지 확인합니다.',
    },
    {
      q: '첨부 서류는 꼭 필요한가요?',
      a: '회사 규정에 따라 다릅니다. 일반적으로 사업자등록증과 통장 사본을 요구하며, 법인은 법인등기부등본을 함께 받기도 합니다.',
    },
    {
      q: '담당자 개인정보에 동의를 받아야 하나요?',
      a: '거래 연락에 꼭 필요한 담당자 성명·연락처는 계약 체결·이행에 필요한 정보라 동의 없이 수집·이용할 수 있습니다(개인정보 보호법 제15조제1항제4호, 2023년 9월 개정). 대신 이용 목적과 보유 기간을 알리고, 필요한 범위에서만 받으세요. 이 양식은 동의 대신 안내 확인란을 둡니다.',
    },
  ],
  sources: [
    {
      label: '국세청 — 사업자등록 안내',
      href: 'https://www.nts.go.kr/',
    },
    {
      label: '개인정보보호위원회 — 개인정보 처리 안내',
      href: 'https://www.pipc.go.kr/',
    },
  ],
  related: [
    { label: '단가표 양식', href: '/forms/price-list/' },
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: '개인정보 동의서 양식', href: '/forms/privacy-consent/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
