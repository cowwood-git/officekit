import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '지연 품목',
  help: '납기가 지연되는 품목과 수량을 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 2,
  maxRows: 30,
  addLabel: '+ 품목 추가',
  required: true,
  group: '납품 정보',
  columns: [
    {
      id: 'name',
      label: '품목',
      type: 'text',
      required: true,
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
      width: 2.2,
    },
    {
      id: 'quantity',
      label: '수량',
      type: 'number',
      required: true,
      placeholder: '1',
      width: 1,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '대체 일정 등',
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
    placeholder: 'DL-20261117-001',
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
    id: 'buyer',
    label: '수신처',
    type: 'text',
    group: '납품 정보',
    required: true,
    placeholder: '예: 거래처 주식회사',
    maxLength: 60,
  },
  {
    id: 'contact',
    label: '담당자',
    type: 'text',
    group: '납품 정보',
    placeholder: '김담당 과장',
    maxLength: 40,
  },
  {
    id: 'orderNo',
    label: '주문 번호',
    type: 'text',
    group: '납품 정보',
    placeholder: 'PO-20261110-001',
    maxLength: 40,
  },
  {
    id: 'itemCountLabel',
    label: '지연 품목 수',
    type: 'computed',
    group: '납품 정보',
    help: '아래 표에 입력한 품목 수입니다.',
  },
  {
    id: 'originalDate',
    label: '당초 납기일',
    type: 'date',
    group: '납품 정보',
    required: true,
  },
  {
    id: 'newDate',
    label: '변경 납기일',
    type: 'date',
    group: '납품 정보',
    required: true,
  },
  {
    id: 'reason',
    label: '지연 사유',
    type: 'textarea',
    group: '지연 사유',
    placeholder: '지연 원인과 현재 진행 상황을 구체적으로 적습니다.',
    required: true,
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'action',
    label: '후속 조치',
    type: 'textarea',
    group: '후속 조치',
    placeholder: '재납기 계획, 대체 납품, 보상 방안 등',
    maxLength: 500,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['작성자', '팀장', '대표'],
    defaultValue: JSON.stringify([
      { label: '작성자', enabled: true },
      { label: '팀장', enabled: true },
      { label: '대표', enabled: false },
    ]),
    required: true,
    maxSelected: 3,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.name ?? '').trim());

export const delayNotice: FormTemplate = {
  slug: 'delay-notice',
  title: '납품 지연 통보서',
  family: 'sales',
  category: 'money',
  description:
    '납품 일정이 지연될 때 당초·변경 납기와 사유, 후속 조치를 거래처에 알리는 통보서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '납품 지연 통보서',
    '납기 지연 통보',
    '납품 지연 안내문',
    '납기 변경 통보서',
    '납품 지연 사유서',
    '납품 지연 통보서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'DL',
  lead: '납기 지연 사실과 변경 일정, 사유, 후속 조치를 거래처에 정중히 알리는 문서입니다. 지연 품목과 수량을 표로 명확히 전달합니다.',
  useCases: [
    '생산·물류 문제로 납기가 늦어질 때',
    '거래처에 변경 일정과 사유를 공식 통보할 때',
    '대체 납품·보상 방안을 함께 안내할 때',
    '납기 변경 이력을 남겨 분쟁을 예방할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 수신처를 확인합니다.',
    '주문 번호와 당초·변경 납기일을 적습니다.',
    '지연되는 품목과 수량을 입력합니다.',
    '지연 사유와 후속 조치를 적고 PDF로 내려받아 발송합니다.',
  ],
  notes: [
    '지연 사실을 가능한 한 빨리 알리고, 변경 일정은 확정 가능한 날짜로 적으세요.',
    '거래처와 합의한 보상·대체 납품 내용은 별도 계약·메일로도 남겨 두세요.',
    '이 문서는 통보용이며, 계약상 책임은 계약 조항과 협의 결과에 따릅니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '납품 지연 통보서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '납품 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '수신처', field: 'buyer' },
        { label: '담당자', field: 'contact' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '주문 번호', field: 'orderNo' },
        { label: '지연 품목 수', field: 'itemCountLabel' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '당초 납기일', field: 'originalDate' },
        { label: '변경 납기일', field: 'newDate' },
      ],
    },
    { kind: 'section', title: '지연 품목' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '품목', width: 60 },
        { label: '규격', width: 44 },
        { label: '수량', width: 16, align: 'right' },
        { label: '비고', width: 44 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row, index) => [
          String(index + 1),
          (row.name ?? '').trim(),
          (row.spec ?? '').trim(),
          row.quantity ? String(Number(row.quantity)) : '',
          (row.note ?? '').trim(),
        ]),
      minRows: 3,
    },
    { kind: 'section', title: '지연 사유' },
    { kind: 'text', field: 'reason', minLines: 3 },
    { kind: 'section', title: '후속 조치' },
    { kind: 'text', field: 'action', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const count = itemsOf(rows).length;
    return { itemCountLabel: count > 0 ? `${count}개` : '' };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) {
      errors.push('지연 품목을 한 줄 이상 입력하세요.');
    }
    if (list.some((row) => Number(row.quantity) <= 0)) {
      errors.push('수량은 1 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'DL-20261117-001',
    date: '2026-11-17',
    buyer: '거래처 주식회사',
    contact: '김담당 과장',
    orderNo: 'PO-20261110-001',
    originalDate: '2026-11-18',
    newDate: '2026-11-24',
    reason:
      '공급처의 복사용지 입고가 3일 지연되었고, 검수 과정에서 일부 포장 손상이 확인되어 재포장이 필요했습니다.',
    action:
      '11월 24일 오전까지 전량 납품하고, 긴급 물량은 11월 20일 부분 납품으로 먼저 공급하겠습니다. 담당자는 박표 대리입니다.',
  },
  sampleRows: {
    items: [
      { name: 'A4 복사용지', spec: '80g 2,500매', quantity: '10', note: '박스' },
      { name: '토너 카트리지', spec: '검정', quantity: '2', note: '' },
      { name: '볼펜', spec: '0.7mm', quantity: '5', note: '박스' },
    ],
  },
  faq: [
    {
      q: '납품 지연 통보서는 언제 보내나요?',
      a: '지연이 확정되는 즉시 보내는 것이 좋습니다. 당초 납기일이 지난 뒤에 알리면 신뢰를 잃을 수 있습니다.',
    },
    {
      q: '변경 납기일은 어떻게 정하나요?',
      a: '생산·물류 일정을 확인해 지킬 수 있는 날짜로 정합니다. 불확실하면 “잠정”임을 명시하고 확정 후 다시 알리세요.',
    },
    {
      q: '보상 조항도 적어야 하나요?',
      a: '계약에 지연 배상 조항이 있으면 그 기준을 따르고, 합의한 대체 납품·할인은 후속 조치에 적습니다. 중요한 합의는 별도 문서로 남기세요.',
    },
    {
      q: '부분 납품도 표시할 수 있나요?',
      a: '네. 비고에 “부분 납품” 일정을 적고, 후속 조치에 잔여 물량 일정을 함께 적으면 됩니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '공정거래위원회 — 계약·거래 안내',
      href: 'https://www.ftc.go.kr/',
    },
    {
      label: '대한상공회의소 — 기업 거래 안내',
      href: 'https://www.korcham.net/',
    },
  ],
  related: [
    { label: '납품서 양식', href: '/forms/delivery-note/' },
    { label: '클레임 접수대장 양식', href: '/forms/claim-log/' },
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
