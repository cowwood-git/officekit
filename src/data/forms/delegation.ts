import { formatDateDot } from '@/lib/doc/format';
import type { FormBlock, FormField, FormTemplate } from '@/lib/doc/types';

const signatureDefault = JSON.stringify([
  { label: '위임인', enabled: true },
  { label: '수임인', enabled: true },
  { label: '입회인', enabled: false },
  { label: '보증인', enabled: false },
  { label: '기타', enabled: false },
]);

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'G-20261115-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다.',
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
    id: 'delegatorName',
    label: '성명',
    type: 'text',
    group: '위임인',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'delegatorBirth',
    label: '생년월일',
    type: 'date',
    group: '위임인',
    help: '주민등록번호 전체 대신 생년월일만 적습니다.',
  },
  {
    id: 'delegatorAddress',
    label: '주소',
    type: 'text',
    group: '위임인',
    placeholder: '예: 서울특별시 마포구 옷깃로 12, 3층',
    maxLength: 120,
    span: 3,
  },
  {
    id: 'delegatorContact',
    label: '연락처',
    type: 'text',
    group: '위임인',
    placeholder: '010-1234-5678',
    maxLength: 40,
  },
  {
    id: 'delegateeName',
    label: '성명',
    type: 'text',
    group: '수임인',
    placeholder: '김수임',
    required: true,
    maxLength: 30,
  },
  {
    id: 'delegateeBirth',
    label: '생년월일',
    type: 'date',
    group: '수임인',
  },
  {
    id: 'delegateeRelationship',
    label: '관계',
    type: 'select',
    group: '수임인',
    options: ['가족', '지인', '직원', '대리인', '기타'],
    defaultValue: '직원',
  },
  {
    id: 'delegateeAddress',
    label: '주소',
    type: 'text',
    group: '수임인',
    placeholder: '예: 서울특별시 마포구 옷깃로 12, 2층',
    maxLength: 120,
    span: 3,
  },
  {
    id: 'delegateeContact',
    label: '연락처',
    type: 'text',
    group: '수임인',
    placeholder: '010-9876-5432',
    maxLength: 40,
  },
  {
    id: 'matter',
    label: '위임 사항',
    type: 'textarea',
    group: '위임 내용',
    placeholder: '누가·어디서·무엇을 대신할지 구체적으로 적습니다.',
    required: true,
    rows: 5,
    maxLength: 800,
    span: 3,
    help: '백지 위임을 막기 위해 업무와 범위를 구체적으로 적으세요.',
  },
  {
    id: 'scope',
    label: '위임 범위·기간',
    type: 'textarea',
    group: '위임 내용',
    placeholder: '예: 2026년 11월 15일부터 12월 31일까지, 통장 재발급에 한함',
    required: true,
    rows: 3,
    maxLength: 400,
    span: 3,
  },
  {
    id: 'purpose',
    label: '제출처·용도',
    type: 'text',
    group: '위임 내용',
    placeholder: '예: ○○은행 통장 재발급',
    required: true,
    maxLength: 80,
    span: 2,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '위임 내용',
    placeholder: '첨부 서류, 특이 사항',
    rows: 2,
    maxLength: 300,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명',
    type: 'roles',
    group: '서명',
    options: ['위임인', '수임인', '입회인', '보증인', '기타'],
    defaultValue: signatureDefault,
    required: true,
    maxSelected: 5,
    editable: true,
    help: '최대 5명까지 선택할 수 있고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const blocks: FormBlock[] = [
  {
    kind: 'header',
    variant: 'editorial',
    title: '위임장',
    docNoField: 'docNo',
    dateField: 'date',
  },
  {
    kind: 'paragraph',
    text: '본인은 아래 사람에게 다음 사항을 위임합니다.',
    size: 10,
    after: 4,
  },
  { kind: 'section', title: '위임인·수임인' },
  {
    kind: 'parties',
    left: {
      label: '위임인 (본인)',
      lines: (values) => [
        `성명  ${values.delegatorName ?? ''}`,
        `생년월일  ${values.delegatorBirth ? formatDateDot(values.delegatorBirth) : ''}`,
        `주소  ${values.delegatorAddress ?? ''}`,
        `연락처  ${values.delegatorContact ?? ''}`,
      ],
    },
    right: {
      label: '수임인 (대리인)',
      lines: (values) => [
        `성명  ${values.delegateeName ?? ''}`,
        `생년월일  ${values.delegateeBirth ? formatDateDot(values.delegateeBirth) : ''}`,
        `관계  ${values.delegateeRelationship ?? ''}`,
        `주소  ${values.delegateeAddress ?? ''}`,
        `연락처  ${values.delegateeContact ?? ''}`,
      ],
    },
  },
  { kind: 'section', title: '위임 사항' },
  { kind: 'text', field: 'matter', minLines: 4 },
  { kind: 'section', title: '위임 범위·기간' },
  { kind: 'text', field: 'scope', minLines: 2 },
  { kind: 'section', title: '제출처·용도' },
  { kind: 'kv', columns: 1, rows: [{ label: '제출처·용도', field: 'purpose' }] },
  { kind: 'text', label: '비고', field: 'note', minLines: 2 },
  { kind: 'section', title: '첨부 서류' },
  {
    kind: 'checklist',
    columns: 2,
    items: [
      '위임인 신분증 사본',
      '수임인 신분증 사본',
      '관계 증명 서류(해당 시)',
      '위임 사항 증빙(계약서 등)',
    ],
  },
  {
    kind: 'signature',
    roles: ['위임인', '수임인'],
    rolesField: 'approvalRoles',
    bottom: true,
  },
];

export const delegation: FormTemplate = {
  slug: 'delegation',
  title: '위임장',
  family: 'admin',
  category: 'proof',
  description:
    '관공서·은행·계약 업무를 다른 사람에게 맡기는 위임장을 브라우저에서 작성하고 A4 PDF로 저장합니다. 위임 사항과 범위를 구체적으로 적고, 입력한 내용은 서버로 전송되지 않습니다.',
  keywords: ['위임장 양식', '위임장 PDF', '위임장 만들기', '금융 위임장', '업무 위임장'],
  updated: '2026-11-15',
  docPrefix: 'DG',
  lead: '본인을 대신해 업무를 처리할 사람과 범위를 정하는 위임장입니다. 위임인·수임인 정보와 위임 사항, 범위·기간을 한 장에 정리하고 서명란을 만들 수 있습니다.',
  useCases: [
    '관공서 서류를 대신 제출할 때',
    '은행 통장·카드 업무를 대리할 때',
    '계약서·물품을 대신 수령할 때',
    '회사 업무를 다른 담당자에게 맡길 때',
  ],
  howTo: [
    '문서 번호와 작성일을 확인합니다.',
    '위임인과 수임인의 성명·생년월일·주소·연락처를 적습니다.',
    '위임 사항과 범위·기간을 구체적으로 적습니다. “모든 업무” 같은 포괄 표현은 피하세요.',
    '제출처와 첨부 서류를 확인하고, 서명란을 선택한 뒤 PDF로 내려받습니다.',
  ],
  notes: [
    '이 위임장은 참고 서식입니다. 위임의 효력은 위임 사항·관계 법령·제출 기관의 요구에 따라 달라질 수 있습니다.',
    '백지 위임장은 만들지 마세요. 위임 사항과 범위를 구체적으로 적어야 악용을 막을 수 있습니다.',
    '주민등록번호 전체는 꼭 필요한 경우에만 출력 후 직접 적고, 제출 후 안전하게 파기하세요.',
    '금융·부동산·소송 등 중요한 위임은 변호사 등 전문가의 확인을 받으세요.',
    '기관마다 정해진 서식이 있을 수 있으니 제출 전에 요구 사항을 확인하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  blocks,
  sample: {
    docNo: 'G-20261115-001',
    date: '2026-11-15',
    delegatorName: '김옷깃',
    delegatorBirth: '1990-05-12',
    delegatorAddress: '서울특별시 마포구 옷깃로 12, 3층',
    delegatorContact: '010-1234-5678',
    delegateeName: '박수임',
    delegateeBirth: '1992-08-20',
    delegateeRelationship: '직원',
    delegateeAddress: '서울특별시 마포구 옷깃로 12, 2층',
    delegateeContact: '010-9876-5432',
    matter:
      '본인을 대신하여 ○○은행 ○○지점에서 통장 재발급을 신청하고, 관련 서류를 제출·수령하는 업무',
    scope:
      '2026년 11월 15일부터 2026년 12월 31일까지. 통장 재발급에 한하며, 대출 실행·계좌 해지 권한은 포함하지 않습니다.',
    purpose: '○○은행 통장 재발급',
    note: '위임인 신분증 사본과 인감증명서를 첨부합니다.',
  },
  validate: (values) => {
    const errors: string[] = [];
    if ((values.matter ?? '').trim().length < 10) {
      errors.push('위임 사항을 10자 이상 구체적으로 적어 주세요.');
    }
    if ((values.scope ?? '').trim().length < 5) {
      errors.push('위임 범위와 기간을 구체적으로 적어 주세요.');
    }
    return errors;
  },
  faq: [
    {
      q: '위임장은 어떤 경우에 쓰나요?',
      a: '본인이 직접 처리하기 어려운 관공서·은행·계약 업무를 다른 사람에게 맡길 때 씁니다. 누가, 무엇을, 어디까지 대신할 수 있는지 구체적으로 적는 것이 핵심입니다.',
    },
    {
      q: '백지 위임장은 왜 위험한가요?',
      a: '위임 사항과 범위가 비어 있으면 수임인이 예상하지 못한 일을 처리할 수 있습니다. 업무·기간·한도를 명시하고, 빈칸이 없는지 확인한 뒤 서명하세요.',
    },
    {
      q: '주민등록번호를 꼭 적어야 하나요?',
      a: '이 양식은 생년월일만 입력합니다. 기관이 주민등록번호 전체를 요구하면 PDF로 출력한 뒤 직접 적고, 제출 후 안전하게 파기하세요.',
    },
    {
      q: '이 위임장만 있으면 법적 효력이 있나요?',
      a: '문서의 효력은 위임 내용과 관계 법령, 제출 기관의 요구에 따라 달라집니다. 인감증명서·신분증 사본이 필요한 경우가 많으니 제출 전에 확인하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다.',
    },
  ],
  sources: [
    {
      label: '법제처 — 국가법령정보센터',
      href: 'https://www.law.go.kr/',
    },
    {
      label: '개인정보보호위원회 — 개인정보 안전성 확보조치',
      href: 'https://www.pipc.go.kr/',
    },
    {
      label: '금융감독원 — 금융 소비자 보호',
      href: 'https://www.fss.or.kr/',
    },
  ],
  related: [
    { label: '재직증명서', href: '/forms/employment-certificate/' },
    { label: '인수인계서', href: '/forms/handover/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: 'PDF 합치기', href: '/tools/pdf-merge/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
