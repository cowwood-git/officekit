import { formatKoreanAmount } from '@/lib/doc/format';
import type { FormTemplate } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

export const expenseRequest: FormTemplate = {
  slug: 'expense-request',
  title: '지출품의서',
  family: 'finance',
  category: 'money',
  description:
    '지출이 발생하기 전에 건명·금액·지급처를 정리해 승인을 받는 지출품의서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '지출품의서',
    '지출품의서 양식',
    '지출 품의서',
    '비용 품의서',
    '지출 승인 요청서',
    '지출품의 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'ER',
  lead: '지출을 집행하기 전에 건명과 금액, 지급처, 계정과목을 정리해 결재를 받는 지출품의서입니다. 금액과 일금이 자동으로 표시됩니다.',
  useCases: [
    '회의비·소모품비를 지출하기 전에 승인을 받을 때',
    '법인카드 결제 전에 사용 내역을 올릴 때',
    '행사·교육 비용을 사전에 품의할 때',
    '거래처 대금 지급을 결재받을 때',
  ],
  howTo: [
    '문서 번호와 작성일, 신청자 정보를 확인합니다.',
    '건명과 지급처, 지급 방법, 계정과목을 입력합니다.',
    '금액과 부가세 구분을 적으면 금액과 일금이 자동으로 표시됩니다.',
    '지출 내용과 비고를 적고 결재선을 골라 PDF로 내려받습니다.',
  ],
  notes: [
    '이 양식은 지출 전 승인을 위한 품의서입니다. 실제 지출·정산은 회사의 회계 규정과 증빙 절차를 따르세요.',
    '부가세 포함·별도 구분은 세금계산서·영수증과 일치해야 합니다. 계정과목은 회사 계정 체계에 맞춰 적으세요.',
    '지출 후에는 지출결의서와 증빙을 함께 보관하는 것이 좋습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields: [
    {
      id: 'docNo',
      label: '문서 번호',
      type: 'text',
      group: '기본 정보',
      placeholder: 'ER-20261117-001',
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
      id: 'name',
      label: '성명',
      type: 'text',
      group: '신청자',
      placeholder: '홍길동',
      required: true,
      maxLength: 30,
    },
    {
      id: 'department',
      label: '부서',
      type: 'text',
      group: '신청자',
      placeholder: '경영지원팀',
      maxLength: 40,
    },
    {
      id: 'position',
      label: '직위',
      type: 'text',
      group: '신청자',
      placeholder: '대리',
      maxLength: 30,
    },
    {
      id: 'title',
      label: '건명',
      type: 'text',
      group: '지출 정보',
      placeholder: '예: 11월 팀 회의 다과 및 사무용품',
      required: true,
      maxLength: 100,
      span: 3,
    },
    {
      id: 'payee',
      label: '지급처',
      type: 'text',
      group: '지출 정보',
      placeholder: '예: 옷깃마트',
      required: true,
      maxLength: 60,
    },
    {
      id: 'method',
      label: '지급 방법',
      type: 'select',
      group: '지출 정보',
      options: ['법인카드', '계좌이체', '현금', '기타'],
      defaultValue: '법인카드',
      required: true,
    },
    {
      id: 'account',
      label: '계정과목',
      type: 'text',
      group: '지출 정보',
      placeholder: '예: 복리후생비',
      maxLength: 40,
    },
    {
      id: 'amount',
      label: '금액',
      type: 'text',
      group: '지출 정보',
      placeholder: '330,000',
      required: true,
      maxLength: 20,
      help: '부가세를 포함한 실제 지출 금액을 적습니다.',
    },
    {
      id: 'vat',
      label: '부가세',
      type: 'select',
      group: '지출 정보',
      options: ['포함', '별도', '해당 없음'],
      defaultValue: '포함',
    },
    {
      id: 'amountLabel',
      label: '금액 표시',
      type: 'computed',
      group: '지출 정보',
      help: '입력한 금액을 원 단위로 표시합니다.',
    },
    {
      id: 'amountKorean',
      label: '일금',
      type: 'computed',
      group: '지출 정보',
      help: '금액을 한글로 표시합니다.',
      span: 2,
    },
    {
      id: 'detail',
      label: '지출 내용',
      type: 'textarea',
      group: '내용',
      placeholder: '무엇에 쓰는지, 왜 필요한지 적습니다.',
      required: true,
      maxLength: 800,
      rows: 4,
      span: 3,
    },
    {
      id: 'note',
      label: '비고',
      type: 'textarea',
      group: '내용',
      placeholder: '증빙 종류, 예산 항목, 납품 일정 등',
      maxLength: 300,
      rows: 2,
      span: 3,
    },
    {
      id: 'approvalRoles',
      label: '결재선',
      type: 'roles',
      group: '결재',
      options: ['신청인', '팀장', '부서장', '본부장', '대표'],
      defaultValue: JSON.stringify([
        { label: '신청인', enabled: true },
        { label: '팀장', enabled: false },
        { label: '부서장', enabled: true },
        { label: '본부장', enabled: false },
        { label: '대표', enabled: true },
      ]),
      required: true,
      maxSelected: 5,
      editable: true,
      help: '최대 5개까지 선택할 수 있고, 이름을 직접 고칠 수 있습니다. 선택한 순서대로 문서에 표시됩니다.',
      span: 3,
    },
  ],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '지출품의서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '신청자' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '성명', field: 'name' },
        { label: '부서', field: 'department' },
        { label: '직위', field: 'position' },
      ],
    },
    { kind: 'section', title: '지출 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '건명', field: 'title' }] },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '지급처', field: 'payee' },
        { label: '지급 방법', field: 'method' },
        { label: '계정과목', field: 'account' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '금액', field: 'amountLabel' },
        { label: '부가세', field: 'vat' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '일금', field: 'amountKorean' }] },
    { kind: 'section', title: '지출 내용' },
    { kind: 'text', field: 'detail', minLines: 4 },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['신청인', '부서장', '대표'],
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
    const amount = parseAmount(values.amount ?? '');
    if (!values.amount?.trim()) {
      errors.push('금액을 입력하세요.');
    } else if (amount <= 0) {
      errors.push('금액은 1원 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'ER-20261117-001',
    date: '2026-11-17',
    name: '김옷깃',
    department: '경영지원팀',
    position: '대리',
    title: '11월 팀 회의 다과 및 사무용품',
    payee: '옷깃마트',
    method: '법인카드',
    account: '복리후생비',
    amount: '330000',
    vat: '포함',
    detail: '11월 팀 회의 다과와 사무용품(복사용지·토너) 구입 비용입니다.',
    note: '영수증 2매 첨부 예정',
  },
  faq: [
    {
      q: '지출품의서와 지출결의서는 무엇이 다른가요?',
      a: '지출품의서는 지출 전에 승인을 받는 문서이고, 지출결의서는 실제 지출 후 증빙과 함께 정산하는 문서입니다. 회사 규정에 따라 둘 다 또는 하나만 쓰기도 합니다.',
    },
    {
      q: '부가세는 어떻게 적어야 하나요?',
      a: '영수증·세금계산서의 부가세 포함 여부와 같게 적습니다. 부가세 포함 금액이면 금액에 포함해 적고, 별도면 비고에 부가세를 따로 적으세요.',
    },
    {
      q: '금액은 자동으로 계산되나요?',
      a: '입력한 금액을 원 단위와 한글 일금으로 표시합니다. 부가세나 합계를 자동으로 계산하지는 않으므로 증빙과 대조해 확인하세요.',
    },
    {
      q: '증빙은 어떻게 첨부하나요?',
      a: '이 양식은 품의서 PDF만 만듭니다. 영수증·세금계산서는 PDF 합치기나 지출결의서와 함께 보관하세요.',
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
      label: '국세청 홈택스',
      href: 'https://www.hometax.go.kr/',
    },
  ],
  related: [
    { label: '지출결의서 양식', href: '/forms/expense-report/' },
    { label: '품의서 양식', href: '/forms/approval-request/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
