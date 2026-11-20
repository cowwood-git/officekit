import type { FormField, FormRows, FormTemplate, LabelSlot, RepeatGroup } from '@/lib/doc/types';

const recipients: RepeatGroup = {
  id: 'recipients',
  label: '수신자 목록',
  help: '라벨에 인쇄할 받는 곳 정보를 한 줄에 하나씩 적습니다.',
  minRows: 2,
  maxRows: 8,
  addLabel: '+ 라벨 추가',
  required: true,
  group: '발신 정보',
  columns: [
    {
      id: 'recipient',
      label: '받는 곳',
      type: 'text',
      required: true,
      placeholder: '예: 거래처 주식회사',
      maxLength: 50,
      width: 2.2,
    },
    {
      id: 'address',
      label: '주소',
      type: 'text',
      placeholder: '도로명 주소',
      maxLength: 100,
      width: 3.2,
    },
    {
      id: 'phone',
      label: '연락처',
      type: 'text',
      placeholder: '010-1234-5678',
      maxLength: 40,
      width: 1.4,
    },
    {
      id: 'orderNo',
      label: '주문번호',
      type: 'text',
      placeholder: 'PO-20261118-001',
      maxLength: 40,
      width: 1.6,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '취급 주의 등',
      maxLength: 40,
      width: 1.6,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'senderCompany',
    label: '보내는 곳',
    type: 'text',
    group: '발신 정보',
    placeholder: '옷깃 주식회사',
    required: true,
    maxLength: 60,
    span: 2,
  },
  {
    id: 'senderContact',
    label: '보내는 곳 연락처',
    type: 'text',
    group: '발신 정보',
    placeholder: '02-123-4567',
    maxLength: 40,
  },
  {
    id: 'senderAddress',
    label: '보내는 곳 주소',
    type: 'text',
    group: '발신 정보',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 100,
    span: 2,
  },
];

const recipientsOf = (rows: FormRows): FormRows['recipients'] =>
  (rows.recipients ?? []).filter((row) => (row.recipient ?? '').trim());

export const shippingLabel: FormTemplate = {
  slug: 'shipping-label',
  title: '물류 라벨',
  family: 'label',
  category: 'print',
  description:
    '받는 곳·주소·연락처를 A4 8칸 라벨로 인쇄하는 물류 라벨을 브라우저에서 만들고 PDF·HWPX로 저장합니다. 재단선이 포함됩니다.',
  keywords: ['물류 라벨', '택배 라벨', '주소 라벨', '배송 라벨 양식', '라벨 인쇄', '물류 라벨 PDF'],
  updated: '2026-11-18',
  docPrefix: 'SHP',
  lead: '받는 곳과 주소를 A4 한 장에 8칸으로 배치하는 물류 라벨입니다. 재단선을 따라 잘라 붙이면 됩니다.',
  useCases: [
    '택배·물류 상자에 받는 곳 라벨을 붙일 때',
    '여러 거래처에 물품을 보낼 때',
    '주문번호와 연락처를 함께 표기할 때',
    'A4 라벨 용지에 맞춰 인쇄할 때',
  ],
  howTo: [
    '보내는 곳 정보를 적습니다.',
    '수신자별 받는 곳·주소·연락처를 입력합니다.',
    '미리보기에서 8칸 배치를 확인합니다.',
    'PDF로 내려받아 A4에 인쇄하고 재단선을 따라 자릅니다.',
  ],
  notes: [
    '실제 라벨 용지에 인쇄할 때는 인쇄 배율을 100%(실제 크기)로 맞추세요.',
    '받는 곳 주소는 우편번호와 함께 확인하면 배송 오류를 줄일 수 있습니다.',
    '개인정보가 담긴 라벨은 사용 후 안전하게 폐기하세요.',
  ],
  fields,
  groups: [recipients],
  showFooter: false,
  blocks: [
    {
      kind: 'labelGrid',
      columns: 2,
      rows: 4,
      gap: 3,
      padding: 4,
      cutLines: true,
      rowHeight: 55,
      slots: (values, rows): LabelSlot[] =>
        recipientsOf(rows).map((row) => ({
          title: (row.recipient ?? '').trim() || '받는 곳',
          subtitle: (row.address ?? '').trim(),
          lines: [
            (row.phone ?? '').trim(),
            row.orderNo ? `주문 ${row.orderNo}` : '',
            (row.note ?? '').trim(),
          ],
          note: values.senderCompany
            ? `보내는 곳 ${values.senderCompany}${values.senderContact ? ` · ${values.senderContact}` : ''}`
            : '',
        })),
    },
  ],
  validate: (_values, rows) =>
    recipientsOf(rows).length === 0 ? ['받는 곳을 한 줄 이상 입력하세요.'] : [],
  sample: {
    senderCompany: '옷깃 주식회사',
    senderContact: '02-123-4567',
    senderAddress: '서울시 강남구 테헤란로 1',
  },
  sampleRows: {
    recipients: [
      {
        recipient: '거래처 주식회사',
        address: '부산시 해운대구 센텀중앙로 90',
        phone: '051-123-4567',
        orderNo: 'PO-20261118-001',
        note: '취급 주의',
      },
      {
        recipient: '페이퍼랩',
        address: '서울시 마포구 월드컵북로 21',
        phone: '02-987-6543',
        orderNo: 'PO-20261118-002',
        note: '',
      },
      {
        recipient: '김거래',
        address: '경기도 성남시 분당구 판교로 12',
        phone: '010-1111-2222',
        orderNo: 'PO-20261118-003',
        note: '오전 배송',
      },
    ],
  },
  faq: [
    {
      q: '라벨 용지에 맞춰 인쇄하려면?',
      a: 'A4 2×4 라벨 용지에 맞춘 배치입니다. 인쇄 창에서 용지는 A4, 배율은 100%(실제 크기)로 두고 여백은 없음으로 설정하세요.',
    },
    {
      q: '받는 곳이 8개보다 적으면?',
      a: '남는 칸은 빈 라벨로 인쇄됩니다. 필요 없는 칸은 잘라내거나 빈 라벨 용지로 사용하세요.',
    },
    {
      q: 'HWPX에서도 재단선이 보이나요?',
      a: 'HWPX에서는 라벨이 표로 만들어지고 칸 테두리가 재단선 역할을 합니다. 한글에서 표 테두리를 조정할 수 있습니다.',
    },
  ],
  sources: [
    {
      label: '우정사업본부 — 우편물 주소 작성 안내',
      href: 'https://www.koreapost.go.kr/',
    },
  ],
  related: [
    { label: '명찰 양식', href: '/forms/name-badge/' },
    { label: '초대장 양식', href: '/forms/invitation/' },
    { label: '티켓 양식', href: '/forms/ticket/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
