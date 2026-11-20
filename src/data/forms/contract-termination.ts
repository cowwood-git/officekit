import type { FormField, FormTemplate } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'CTM-20261118-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  { id: 'date', label: '작성일', type: 'date', group: '문서', defaultToday: true, required: true },
  {
    id: 'contractName',
    label: '계약명',
    type: 'text',
    group: '계약 정보',
    placeholder: '예: 홈페이지 유지보수 계약',
    required: true,
    maxLength: 100,
    span: 2,
  },
  { id: 'contractDate', label: '계약일', type: 'date', group: '계약 정보' },
  {
    id: 'partyA',
    label: '갑',
    type: 'text',
    group: '계약 정보',
    placeholder: '예: 거래처 주식회사',
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
    id: 'terminationDate',
    label: '해지일',
    type: 'date',
    group: '해지 내용',
    required: true,
  },
  {
    id: 'reason',
    label: '해지 사유',
    type: 'textarea',
    group: '해지 내용',
    placeholder: '해지하게 된 사유와 양 당사자 합의 내용',
    required: true,
    maxLength: 600,
    rows: 4,
    span: 3,
  },
  {
    id: 'settlement',
    label: '정산 내용',
    type: 'textarea',
    group: '정산',
    placeholder: '미지급 금액·반환 물품·위약금 등 정산 내용을 적습니다.',
    maxLength: 500,
    rows: 3,
    span: 3,
  },
  {
    id: 'settlementDate',
    label: '정산 완료일',
    type: 'date',
    group: '정산',
  },
  {
    id: 'note',
    label: '기타',
    type: 'textarea',
    group: '기타',
    placeholder: '비밀유지 등 해지 후에도 유지되는 조항',
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

export const contractTermination: FormTemplate = {
  slug: 'contract-termination',
  title: '계약 해지 합의서',
  family: 'sales',
  category: 'money',
  description:
    '기존 계약을 양 당사자 합의로 종료할 때 해지일·사유·정산 내용을 정리하는 계약 해지 합의서를 브라우저에서 작성하고 PDF로 저장합니다.',
  keywords: [
    '계약 해지 합의서',
    '계약 해지 합의서 양식',
    '계약 해지서',
    '계약 종료 합의',
    '계약 해지 PDF',
    '합의 해지',
  ],
  updated: '2026-11-21',
  docPrefix: 'CTM',
  lead: '진행 중인 계약을 양쪽 합의로 끝낼 때 해지일과 사유, 정산 내용을 정리하는 문서입니다. 해지 후 남는 의무까지 함께 적습니다.',
  useCases: [
    '서비스 계약을 양쪽 합의로 종료할 때',
    '거래 관계를 정리하고 미지급 금액을 정산할 때',
    '계약 기간 중 사정이 바뀌어 해지할 때',
    '해지 사실과 정산 내역을 문서로 남길 때',
  ],
  howTo: [
    '문서 번호와 작성일, 계약 정보를 확인합니다.',
    '갑·을 당사자와 해지일을 적습니다.',
    '해지 사유와 정산 내용을 구체적으로 입력합니다.',
    'PDF로 내려받아 양쪽이 서명하고 사본을 보관합니다.',
  ],
  notes: [
    '이 양식은 합의 해지 내용을 정리하는 참고 자료입니다. 분쟁이 예상되면 법률 검토를 권장합니다.',
    '미지급 금액·반환 물품·위약금이 있다면 정산 내용에 구체적으로 적으세요.',
    '비밀유지·개인정보 보호 등 해지 후에도 유지되는 조항을 기타에 명시하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '계약 해지 합의서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    {
      kind: 'paragraph',
      text: '양 당사자는 아래 계약을 합의로 해지하기로 한다.',
      align: 'center',
      before: 2,
      after: 2,
    },
    { kind: 'section', title: '계약 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '계약명', field: 'contractName' }] },
    { kind: 'kv', columns: 1, rows: [{ label: '계약일', field: 'contractDate' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '갑', field: 'partyA' },
        { label: '을', field: 'partyB' },
      ],
    },
    { kind: 'section', title: '해지 내용' },
    { kind: 'kv', columns: 1, rows: [{ label: '해지일', field: 'terminationDate' }] },
    { kind: 'text', field: 'reason', minLines: 4 },
    { kind: 'section', title: '정산' },
    { kind: 'text', field: 'settlement', minLines: 3 },
    { kind: 'kv', columns: 1, rows: [{ label: '정산 완료일', field: 'settlementDate' }] },
    { kind: 'section', title: '기타' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'notice',
      text: '해지 후에도 비밀유지·개인정보 보호 등 원 계약의 일부 조항은 유효할 수 있습니다. 서명 전 내용을 확인하세요.',
    },
    { kind: 'signature', roles: ['갑', '을'], rolesField: 'approvalRoles', bottom: true },
  ],
  validate: (values) => {
    const errors: string[] = [];
    if (
      values.contractDate &&
      values.terminationDate &&
      values.terminationDate < values.contractDate
    ) {
      errors.push('해지일은 계약일보다 빠를 수 없습니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'CTM-20261118-001',
    date: '2026-11-18',
    contractName: '홈페이지 유지보수 계약',
    contractDate: '2026-03-01',
    partyA: '거래처 주식회사',
    partyB: '옷깃 주식회사',
    terminationDate: '2026-12-31',
    reason:
      '서비스 운영 방향이 바뀌어 유지보수 계약을 2026년 12월 31일자로 종료하기로 양 당사자가 합의했습니다.',
    settlement:
      '2026년 12월까지의 유지보수비 1,100,000원을 2027년 1월 15일까지 지급하고, 제공된 자료와 계정은 해지일까지 반환합니다.',
    settlementDate: '2027-01-15',
    note: '비밀유지 의무는 해지 후 1년간 유지합니다.',
  },
  faq: [
    {
      q: '해지와 해제는 무엇이 다른가요?',
      a: '해지는 계약을 앞으로만 끝내 이미 이행한 부분은 그대로 두고, 해제는 계약을 처음부터 없던 것으로 돌려 서로 받은 것을 돌려줘야 합니다(민법 제548조·제550조). 계속 거래 중인 계약을 끝낼 때는 보통 해지를 씁니다.',
    },
    {
      q: '나중에 다른 청구를 못 하게 하려면요?',
      a: '정산 내용이나 기타에 “이 합의에서 정한 것 외에 이 계약과 관련해 서로 어떤 청구도 하지 않는다”는 청산 조항을 넣으세요. 다만 아직 드러나지 않은 손해까지 포기하는 것인지 분쟁이 생길 수 있으니 대상과 범위를 구체적으로 적는 것이 좋습니다.',
    },
    {
      q: '계약 해지 합의서와 해지 통지서는 무엇이 다른가요?',
      a: '합의서는 양쪽이 동의해 계약을 끝내는 문서이고, 통지서는 한쪽이 해지 의사를 알리는 문서입니다. 상대의 동의를 받았다면 합의서를 쓰세요.',
    },
    {
      q: '정산 내용에는 무엇을 적나요?',
      a: '미지급 금액, 반환할 물품·자료, 위약금, 정산 기한을 적습니다. 금액과 날짜를 구체적으로 쓰세요.',
    },
    {
      q: '해지 후에도 유지되는 조항이 있나요?',
      a: '비밀유지, 개인정보 보호, 손해배상 등은 해지 후에도 유지되는 경우가 많습니다. 기타에 명시하세요.',
    },
    {
      q: '법적 효력이 있나요?',
      a: '양 당사자가 서명하면 합의 해지의 효력이 생길 수 있지만, 분쟁이 예상되면 법률 전문가의 검토를 권장합니다.',
    },
  ],
  sources: [
    { label: '국가법령정보센터 — 민법', href: 'https://www.law.go.kr/' },
    { label: '공정거래위원회 — 계약·거래 안내', href: 'https://www.ftc.go.kr/' },
  ],
  related: [
    { label: '계약 변경 합의서 양식', href: '/forms/contract-amendment/' },
    { label: '계약 갱신 합의서 양식', href: '/forms/contract-renewal/' },
    { label: '합의서 양식', href: '/forms/agreement/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
