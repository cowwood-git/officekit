import type { FormField, FormTemplate } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'MM-20261117-001',
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
    id: 'title',
    label: '각서 제목',
    type: 'text',
    group: '작성자',
    required: true,
    placeholder: '예: 비밀유지 서약',
    maxLength: 100,
    span: 3,
  },
  {
    id: 'writer',
    label: '작성자',
    type: 'text',
    group: '작성자',
    required: true,
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '소속',
    type: 'text',
    group: '작성자',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'contact',
    label: '연락처',
    type: 'text',
    group: '작성자',
    placeholder: '010-1234-5678',
    maxLength: 40,
  },
  {
    id: 'recipient',
    label: '제출처',
    type: 'text',
    group: '작성자',
    placeholder: '예: 회사 대표이사',
    maxLength: 60,
  },
  {
    id: 'content',
    label: '서약 내용',
    type: 'textarea',
    group: '서약 내용',
    placeholder: '지킬 내용을 구체적으로 적습니다.',
    required: true,
    maxLength: 1200,
    rows: 5,
    span: 3,
  },
  {
    id: 'background',
    label: '배경·사유',
    type: 'textarea',
    group: '배경·사유',
    placeholder: '각서를 작성하게 된 배경',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '참고 사항',
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명',
    type: 'roles',
    group: '서명',
    options: ['작성자'],
    defaultValue: JSON.stringify([{ label: '작성자', enabled: true }]),
    maxSelected: 1,
    editable: true,
    help: '작성자 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

export const memorandum: FormTemplate = {
  slug: 'memorandum',
  title: '각서',
  family: 'admin',
  category: 'proof',
  description:
    '특정 사항을 지키겠다는 의사를 문서로 남기는 각서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 서약 내용과 제출처, 서명란을 갖춥니다.',
  keywords: ['각서', '각서 양식', '서약서', '비밀유지 각서', '이행 각서', '각서 PDF'],
  updated: '2026-11-21',
  docPrefix: 'MM',
  lead: '지키겠다는 의사를 공식적으로 남기는 각서입니다. 서약 내용과 배경, 제출처를 적고 작성자 서명·날인을 넣습니다.',
  useCases: [
    '비밀유지·보안 서약을 남길 때',
    '반납·이행 조건을 약속할 때',
    '사내 규정 준수를 확인할 때',
    '구두 약속을 문서로 남길 때',
  ],
  howTo: [
    '문서 번호와 작성일, 각서 제목을 확인합니다.',
    '작성자·소속·연락처와 제출처를 적습니다.',
    '서약 내용과 배경을 구체적으로 적습니다.',
    'PDF로 내려받아 작성자 서명·날인을 합니다.',
  ],
  notes: [
    '각서 내용은 실제로 이행할 수 있는 범위에서 구체적으로 적으세요.',
    '법적 강제력이 필요한 사안은 별도 계약서나 법률 검토를 권장합니다.',
    '개인정보·회사 기밀은 제출처와 공유 범위를 확인하세요.',
    '회사가 근로자에게 받는 각서에 “위반하면 ○○만 원을 배상한다”처럼 위약금·손해배상액을 미리 정하면 무효입니다(근로기준법 제20조). 실제 손해는 따로 입증해 청구해야 합니다.',
    '“다시 위반하면 사직하겠다”는 각서를 받아 두어도 그것만으로 해고나 사직이 정당해지지 않습니다. 징계·해고는 취업규칙 절차와 정당한 이유가 필요합니다(근로기준법 제23조).',
    '사회질서에 어긋나거나 궁박한 상황을 이용해 받은 현저히 불공정한 약속은 서명했어도 무효입니다(민법 제103조·제104조).',
  ],
  fields,
  warn: (values) => {
    const text = `${values.content ?? ''} ${values.background ?? ''}`;
    const warnings: string[] = [];
    if (/위약금|위약벌|벌금|배상하겠|배상한다|변상하겠|변상한다|물어내/.test(text)) {
      warnings.push(
        '서약 내용에 위약금·배상 약속이 있습니다. 회사가 근로자에게 받는 각서라면 위약금이나 손해배상액을 미리 정하는 약정은 무효입니다(근로기준법 제20조).',
      );
    }
    if (
      /(사직|퇴사)(하겠|를\s?감수|도\s?감수|에\s?이의)|해고[^.]{0,6}(감수|이의)|(사직|퇴사)[^.]{0,6}이의/.test(
        text,
      )
    ) {
      warnings.push(
        '서약 내용에 사직·해고를 감수한다는 약속이 있습니다. 이런 각서만으로 해고가 정당해지지 않으며, 징계는 취업규칙 절차와 정당한 이유가 필요합니다(근로기준법 제23조).',
      );
    }
    return warnings;
  },
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '각서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    {
      kind: 'paragraph',
      text: '아래와 같이 서약합니다.',
      align: 'center',
      before: 2,
      after: 2,
    },
    { kind: 'section', title: '작성자' },
    { kind: 'kv', columns: 1, rows: [{ label: '제목', field: 'title' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '성명', field: 'writer' },
        { label: '소속', field: 'department' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '연락처', field: 'contact' },
        { label: '제출처', field: 'recipient' },
      ],
    },
    { kind: 'section', title: '서약 내용' },
    { kind: 'text', field: 'content', minLines: 5 },
    { kind: 'section', title: '배경·사유' },
    { kind: 'text', field: 'background', minLines: 2 },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자'],
      rolesField: 'approvalRoles',
      bottom: true,
      seal: true,
    },
  ],
  sample: {
    docNo: 'MM-20261117-001',
    date: '2026-11-17',
    title: '비밀유지 서약',
    writer: '김옷깃',
    department: '경영지원팀',
    contact: '010-1234-5678',
    recipient: '옷깃 주식회사',
    content:
      '본인은 업무 중 알게 된 회사의 고객 정보, 계약 조건, 내부 자료를 외부에 공개하거나 목적 외로 사용하지 않겠습니다. 퇴사 후에도 같은 의무를 지키겠습니다.',
    background: '12월 1일 자 인사 이동에 따라 고객 정보 접근 권한을 부여받기 전에 작성합니다.',
    note: '관련 규정은 사내 보안 지침을 따릅니다.',
  },
  faq: [
    {
      q: '각서와 서약서는 무엇이 다른가요?',
      a: '거의 같은 의미로 쓰입니다. 각서는 특정 사항을 지키겠다는 의사를 남기는 문서이고, 서약서는 서약 내용을 강조하는 표현입니다.',
    },
    {
      q: '회사가 “어기면 배상한다”는 각서를 쓰라고 하면요?',
      a: '근로계약 불이행에 대해 위약금이나 손해배상액을 미리 정하는 약정은 근로기준법 제20조로 금지되어, 서명해도 그 부분은 무효입니다. 다만 실제로 고의·과실로 손해를 입혔다면 회사가 손해를 입증해 청구할 수는 있습니다.',
    },
    {
      q: '각서에 법적 효력이 있나요?',
      a: '작성자가 서명하면 의사 표시의 증거로 활용할 수 있지만, 강제력은 내용과 관련 법령에 따라 달라집니다. 중요한 사안은 법률 검토를 권장합니다.',
    },
    {
      q: '어떤 내용을 적어야 하나요?',
      a: '지킬 행동과 범위, 기간을 구체적으로 적습니다. “비밀을 지키겠다”보다 어떤 정보를 어떻게 다루지 않겠다는지 명시하세요.',
    },
    {
      q: '회사가 보관해도 되나요?',
      a: '네. 제출처에서 사본을 보관하고 작성자에게도 사본을 주는 것이 좋습니다.',
    },
  ],
  sources: [
    {
      label: '국가법령정보센터 — 민법',
      href: 'https://www.law.go.kr/',
    },
  ],
  related: [
    { label: '비밀유지계약서(NDA) 양식', href: '/forms/nda/' },
    { label: '합의서 양식', href: '/forms/agreement/' },
    { label: '개인정보 동의서 양식', href: '/forms/privacy-consent/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
