import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const items: RepeatGroup = {
  id: 'items',
  label: '요청 품목',
  group: '요청 정보',
  help: '반품·교환할 품목과 수량, 구입 단가를 적습니다. 금액과 합계가 자동으로 계산됩니다.',
  minRows: 2,
  maxRows: 20,
  addLabel: '+ 품목 추가',
  required: true,
  summaryField: 'totalLabel',
  summaryLabel: '요청 금액',
  columns: [
    {
      id: 'name',
      label: '품목',
      type: 'text',
      required: true,
      placeholder: '예: 무선 키보드',
      maxLength: 60,
      width: 3,
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
      id: 'unitPrice',
      label: '구입 단가',
      type: 'money',
      placeholder: '0',
      width: 1.5,
    },
    {
      id: 'reason',
      label: '사유',
      type: 'text',
      placeholder: '예: 결함, 파손, 색상 차이',
      maxLength: 60,
      width: 2.4,
    },
    {
      id: 'amount',
      label: '금액',
      type: 'computed',
      width: 1.5,
      align: 'right',
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '기본 정보',
    placeholder: 'RR-20261117-001',
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
    label: '신청인',
    type: 'text',
    group: '신청인',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '신청인',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'position',
    label: '직위',
    type: 'text',
    group: '신청인',
    placeholder: '대리',
    maxLength: 30,
  },
  {
    id: 'contact',
    label: '연락처',
    type: 'text',
    group: '신청인',
    placeholder: '010-1234-5678',
    maxLength: 40,
    help: '수거·교환 일정을 안내받을 연락처입니다.',
  },
  {
    id: 'company',
    label: '판매처',
    type: 'text',
    group: '주문 정보',
    placeholder: '예: 옷깃마트',
    required: true,
    maxLength: 60,
  },
  {
    id: 'orderNo',
    label: '주문 번호',
    type: 'text',
    group: '주문 정보',
    placeholder: '20261110-0001',
    maxLength: 40,
    help: '주문서·영수증에 적힌 주문 번호를 그대로 적습니다.',
  },
  {
    id: 'orderDate',
    label: '주문일',
    type: 'date',
    group: '주문 정보',
  },
  {
    id: 'requestType',
    label: '요청 구분',
    type: 'select',
    group: '요청 정보',
    options: ['반품', '교환', '환불'],
    defaultValue: '교환',
    required: true,
  },
  {
    id: 'method',
    label: '처리 방법',
    type: 'select',
    group: '요청 정보',
    options: ['방문 수거', '직접 발송', '방문 교환', '기타'],
    defaultValue: '방문 수거',
    required: true,
  },
  {
    id: 'itemCount',
    label: '요청 건수',
    type: 'computed',
    group: '요청 정보',
    help: '입력한 품목 줄 수입니다.',
  },
  {
    id: 'totalLabel',
    label: '요청 금액',
    type: 'computed',
    group: '요청 정보',
    help: '품목별 금액의 합계입니다.',
  },
  {
    id: 'reason',
    label: '요청 사유',
    type: 'textarea',
    group: '내용',
    placeholder: '언제, 어떤 문제가 있었는지 구체적으로 적습니다.',
    required: true,
    maxLength: 800,
    rows: 4,
    span: 3,
  },
  {
    id: 'request',
    label: '조치 요청',
    type: 'textarea',
    group: '내용',
    placeholder: '원하는 처리 방법과 일정, 환불 계좌 등',
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'refundMethod',
    label: '환불 방법',
    type: 'select',
    group: '환불',
    options: ['카드 취소', '계좌 이체', '현금', '해당 없음'],
    defaultValue: '카드 취소',
  },
  {
    id: 'account',
    label: '환불 계좌',
    type: 'text',
    group: '환불',
    placeholder: '은행 · 계좌번호 · 예금주',
    maxLength: 80,
    sensitive: true,
    help: '계좌 이체로 환불받을 때만 적습니다.',
  },
  {
    id: 'note',
    label: '기타',
    type: 'textarea',
    group: '기타',
    placeholder: '첨부 사진, 포장 상태, 방문 가능 시간 등',
    maxLength: 400,
    rows: 2,
    span: 3,
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

const lineAmount = (row: Record<string, string>): number => {
  const quantity = Number((row.quantity ?? '').replace(/,/g, ''));
  const price = parseAmount(row.unitPrice ?? '');
  return Number.isFinite(quantity) && quantity > 0 ? quantity * price : 0;
};

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.name ?? '').trim());

export const returnRequest: FormTemplate = {
  slug: 'return-request',
  title: '반품·교환 요청서',
  family: 'sales',
  category: 'money',
  description:
    '구입한 물품의 반품·교환·환불을 요청하는 반품·교환 요청서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 품목과 금액 합계가 자동으로 계산됩니다.',
  keywords: [
    '반품 요청서',
    '교환 요청서',
    '반품 교환 신청서',
    '환불 요청서',
    '반품 요청서 양식',
    '교환 신청서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'RQ',
  lead: '받은 물품을 반품하거나 교환할 때 사유와 요청 사항을 정리하는 문서입니다. 품목·수량·단가를 적으면 요청 금액이 자동으로 계산됩니다.',
  useCases: [
    '받은 물품에 결함·파손이 있어 교환을 요청할 때',
    '주문과 다른 상품이 배송되어 반품할 때',
    '단순 변심으로 반품·환불을 요청할 때',
    '수량이 부족하거나 잘못 납품되어 정정을 요청할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 신청인 정보를 확인합니다.',
    '판매처와 주문 번호·주문일을 적고 요청 구분과 처리 방법을 고릅니다.',
    '반품·교환할 품목과 수량, 구입 단가, 사유를 한 줄씩 입력합니다.',
    '요청 사유와 조치 요청을 적고 PDF로 내려받아 판매처에 보냅니다.',
  ],
  notes: [
    '이 양식은 요청 내용을 정리하는 문서입니다. 반품·환불 조건과 기한은 판매처의 정책과 관련 법령을 따르세요.',
    '제품 사진과 주문 내역, 영수증을 함께 보관하면 처리가 빠릅니다.',
    '계좌 이체로 환불받을 때는 계좌번호와 예금주를 정확히 적고, 공용 PC에서는 사용 후 초기화하세요.',
    '입력값은 이 브라우저에만 임시 저장되며 서버로 전송되지 않습니다.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '반품·교환 요청서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '신청 정보' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '신청인', field: 'name' },
        { label: '부서', field: 'department' },
        { label: '직위', field: 'position' },
      ],
    },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '연락처', field: 'contact' },
        { label: '판매처', field: 'company' },
        { label: '주문 번호', field: 'orderNo' },
      ],
    },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '주문일', field: 'orderDate' },
        { label: '요청 구분', field: 'requestType' },
        { label: '처리 방법', field: 'method' },
      ],
    },
    { kind: 'section', title: '요청 품목' },
    {
      kind: 'table',
      columns: [
        { label: '품목', width: 60 },
        { label: '수량', width: 14, align: 'right' },
        { label: '구입 단가', width: 28, align: 'right' },
        { label: '금액', width: 30, align: 'right' },
        { label: '사유', width: 42 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row) => [
          (row.name ?? '').trim(),
          (row.quantity ?? '').trim(),
          parseAmount(row.unitPrice ?? '') > 0 ? formatWon(parseAmount(row.unitPrice ?? '')) : '',
          lineAmount(row) > 0 ? formatWon(lineAmount(row)) : '',
          (row.reason ?? '').trim(),
        ]),
      minRows: 2,
    },
    {
      kind: 'totals',
      rows: [{ label: '요청 금액', field: 'totalLabel', strong: true }],
      width: 70,
    },
    { kind: 'section', title: '요청 사유' },
    { kind: 'text', field: 'reason', minLines: 3 },
    { kind: 'section', title: '조치 요청' },
    { kind: 'text', field: 'request', minLines: 2 },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '환불 방법', field: 'refundMethod' },
        { label: '환불 계좌', field: 'account' },
      ],
    },
    { kind: 'section', title: '기타' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['신청인', '접수자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = itemsOf(rows);
    const total = list.reduce((sum, row) => sum + lineAmount(row), 0);
    return {
      itemCount: list.length > 0 ? `${list.length}건` : '',
      totalLabel: total > 0 ? formatWon(total) : '',
    };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) {
      errors.push('반품·교환할 품목을 한 줄 이상 입력하세요.');
    }
    if (list.some((row) => Number((row.quantity ?? '').replace(/,/g, '')) <= 0)) {
      errors.push('수량은 1 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'RR-20261117-001',
    date: '2026-11-17',
    name: '김옷깃',
    department: '경영지원팀',
    position: '대리',
    contact: '010-1234-5678',
    company: '옷깃마트',
    orderNo: '20261110-0001',
    orderDate: '2026-11-10',
    requestType: '교환',
    method: '방문 수거',
    reason:
      '11월 10일 주문한 무선 키보드 2개 중 1개에서 키 입력이 반복되는 결함이 확인되었습니다. 개봉 후 테스트 과정에서 발견했고, 외관 파손은 없습니다.',
    request: '같은 모델로 교환을 요청합니다. 11월 20일 오전에 방문 수거가 가능하면 좋겠습니다.',
    refundMethod: '카드 취소',
    account: '',
    note: '제품 사진 3장과 주문 내역을 함께 첨부합니다.',
  },
  sampleRows: {
    items: [
      {
        name: '무선 키보드',
        quantity: '1',
        unitPrice: '59000',
        reason: '키 입력 반복 결함',
      },
      {
        name: '키보드 손목받침',
        quantity: '1',
        unitPrice: '12000',
        reason: '함께 주문한 구성품',
      },
    ],
  },
  faq: [
    {
      q: '반품과 교환 중 무엇을 골라야 하나요?',
      a: '같은 상품으로 바꾸려면 교환, 구입을 취소하고 돈을 돌려받으려면 반품·환불을 고릅니다. 판매처 정책에 따라 선택지가 다를 수 있습니다.',
    },
    {
      q: '요청 금액은 어떻게 계산되나요?',
      a: '품목별로 수량 × 구입 단가를 계산해 합산합니다. 배송비나 할인 금액은 자동 반영되지 않으므로 조치 요청에 따로 적어 주세요.',
    },
    {
      q: '주문 번호를 모르면 어떻게 하나요?',
      a: '주문서·영수증·문자 안내에 적힌 주문 번호를 확인해 적습니다. 없으면 주문일과 품목으로 판매처가 찾을 수 있게 비고에 적어 주세요.',
    },
    {
      q: '환불 계좌는 꼭 적어야 하나요?',
      a: '카드 취소나 현금 환불이면 비워 두어도 됩니다. 계좌 이체로 받을 때만 은행·계좌번호·예금주를 정확히 적으세요.',
    },
  ],
  sources: [
    {
      label: '공정거래위원회 — 소비자 분쟁 해결 기준',
      href: 'https://www.ftc.go.kr/',
    },
    {
      label: '한국소비자원 — 소비자24',
      href: 'https://www.consumer.go.kr/',
    },
  ],
  related: [
    { label: '납품서 양식', href: '/forms/delivery-note/' },
    { label: '거래명세서 양식', href: '/forms/statement/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
