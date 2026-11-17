import { formatDateDot } from '@/lib/doc/format';
import type { FormBlock, FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import {
  computeTotals,
  formatWon,
  itemAmount,
  parseAmount,
  type QuoteItem,
  type VatMode,
  vatModeLabel,
} from '@/lib/quote';

type TradeType = 'quote' | 'statement';

const VAT_OPTIONS = ['부가세 별도', '부가세 포함', '부가세 없음'] as const;

const toVatMode = (value: string | undefined): VatMode => {
  if (value === '부가세 포함') return 'included';
  if (value === '부가세 없음') return 'none';
  return 'excluded';
};

const toItems = (rows: FormRows): QuoteItem[] =>
  (rows.items ?? [])
    .filter((row) => (row.name ?? '').trim())
    .map((row) => ({
      name: (row.name ?? '').trim(),
      quantity: Number(row.quantity ?? 0),
      unitPrice: parseAmount(row.unitPrice ?? ''),
    }));

const rowAmount = (row: Record<string, string>): number =>
  itemAmount({
    name: row.name ?? '',
    quantity: Number(row.quantity ?? 0),
    unitPrice: parseAmount(row.unitPrice ?? ''),
  });

const itemsGroup: RepeatGroup = {
  id: 'items',
  label: '품목',
  group: '조건',
  help: '품목·수량·단가를 입력하면 금액과 합계가 자동으로 계산됩니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 1,
  maxRows: 30,
  addLabel: '+ 품목 추가',
  required: true,
  summaryField: 'totalLabel',
  summaryLabel: '합계',
  columns: [
    {
      id: 'name',
      label: '품목',
      type: 'text',
      required: true,
      placeholder: '예: 웹사이트 디자인',
      maxLength: 80,
      width: 3,
    },
    { id: 'quantity', label: '수량', type: 'number', placeholder: '1', width: 1 },
    {
      id: 'unitPrice',
      label: '단가',
      type: 'money',
      placeholder: '0',
      width: 1.5,
    },
    {
      id: 'amount',
      label: '금액',
      type: 'computed',
      width: 1.5,
      align: 'right',
    },
  ],
  computeRow: (row) => {
    const amount = rowAmount(row);
    return { amount: amount > 0 ? formatWon(amount) : '' };
  },
};

const partyFields = (prefix: 'supplier' | 'buyer', companyLabel: string): FormField[] => [
  {
    id: `${prefix}Company`,
    label: `${companyLabel} 상호`,
    type: 'text',
    group: companyLabel,
    required: true,
    placeholder: prefix === 'supplier' ? '예: 옷깃' : '예: 거래처',
    maxLength: 60,
    span: 2,
  },
  {
    id: `${prefix}Biz`,
    label: '사업자번호',
    type: 'text',
    group: companyLabel,
    placeholder: '000-00-00000',
    maxLength: 20,
  },
  {
    id: `${prefix}Ceo`,
    label: '대표자',
    type: 'text',
    group: companyLabel,
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: `${prefix}Address`,
    label: '주소',
    type: 'text',
    group: companyLabel,
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: `${prefix}Contact`,
    label: '연락처',
    type: 'text',
    group: companyLabel,
    placeholder: '전화 또는 이메일',
    maxLength: 60,
  },
];

const partyLines = (
  values: Record<string, string>,
  prefix: 'supplier' | 'buyer',
  role: string,
): string[] =>
  [
    values[`${prefix}Company`] ?? '',
    values[`${prefix}Biz`] ? `사업자 ${values[`${prefix}Biz`]}` : '',
    values[`${prefix}Ceo`] ? `${role} ${values[`${prefix}Ceo`]}` : '',
    values[`${prefix}Address`] ?? '',
    values[`${prefix}Contact`] ?? '',
  ].filter((line) => line.trim() !== '');

export function buildTradeTemplate(type: TradeType): FormTemplate {
  const isQuote = type === 'quote';
  const title = isQuote ? '견적서' : '거래명세서';
  const otherTitle = isQuote ? '거래명세서' : '견적서';
  const otherHref = isQuote ? '/forms/statement/' : '/forms/quote/';
  const docPrefix = isQuote ? 'Q' : 'S';

  const fields: FormField[] = [
    {
      id: 'docNo',
      label: '문서 번호',
      type: 'text',
      group: '문서',
      placeholder: `${docPrefix}-20261115-001`,
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
    ...partyFields('supplier', '공급자'),
    ...partyFields('buyer', '공급받는자'),
    ...(isQuote
      ? [
          {
            id: 'validUntil',
            label: '유효기간',
            type: 'date' as const,
            group: '조건',
          },
        ]
      : []),
    {
      id: 'vatMode',
      label: '부가세',
      type: 'select',
      group: '조건',
      options: VAT_OPTIONS,
      defaultValue: '부가세 별도',
    },
    {
      id: 'note',
      label: '비고',
      type: 'textarea',
      group: '비고',
      placeholder: '납기, 입금 조건, 특약 사항',
      rows: 2,
      maxLength: 300,
      span: 3,
    },
  ];

  const conditionRows = isQuote
    ? [
        { label: '유효기간', field: 'validLabel' },
        { label: '부가세', field: 'vatLabel' },
      ]
    : [
        { label: '거래일', field: 'date' },
        { label: '부가세', field: 'vatLabel' },
      ];

  const description = isQuote
    ? '공급자·공급받는자·품목·부가세를 입력해 A4 견적서를 만들고 PDF로 저장합니다. 입력한 내용은 서버로 전송되지 않습니다.'
    : '공급자·공급받는자·품목·부가세를 입력해 A4 거래명세서를 만들고 PDF로 저장합니다. 입력한 내용은 서버로 전송되지 않습니다.';

  const lead = isQuote
    ? '거래 전에 제안하는 금액과 조건을 적는 견적서입니다. 품목과 수량·단가를 입력하면 공급가액·부가세·합계가 자동으로 계산되고, 오른쪽 미리보기가 바로 바뀝니다.'
    : '거래한 품목과 금액을 확인하는 거래명세서입니다. 품목·수량·단가를 입력하면 합계가 자동으로 계산되고, 납품·정산 자료로 바로 쓸 수 있습니다.';

  const useCases = isQuote
    ? [
        '거래 전에 견적서를 보내야 할 때',
        '프로젝트 비용과 부가세를 한 장으로 정리할 때',
        '단가·수량을 바꿔 여러 안을 비교할 때',
        '인쇄해서 도장을 찍거나 PDF로 제출할 때',
      ]
    : [
        '납품 후 거래 내역을 확인할 때',
        '세금계산서·입금 내역과 금액을 맞출 때',
        '거래처에 품목과 수량을 확인받을 때',
        '인쇄해서 도장을 찍거나 PDF로 보관할 때',
      ];

  const howTo = [
    '문서 번호와 작성일을 확인합니다. 문서 번호는 날짜에 맞춰 자동으로 바뀝니다.',
    '공급자와 공급받는자 정보를 입력합니다. 회사 정보는 다음에 다시 쓸 수 있습니다.',
    '품목·수량·단가를 입력하면 줄별 금액과 합계가 자동으로 계산됩니다.',
    isQuote
      ? '부가세 기준과 유효기간을 확인하고 PDF로 내려받습니다.'
      : '부가세 기준을 확인하고 PDF로 내려받습니다.',
  ];

  const notes = [
    '이 문서는 참고용입니다. 세금계산서 발행은 국세청 홈택스나 회계 프로그램을 이용하세요.',
    '부가세 별도는 품목 합계에 10%를 더하고, 부가세 포함은 입력 금액에서 공급가액과 부가세를 역산합니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
    '직인·서명이 필요한 문서는 회사 규정에 따라 출력 후 날인하거나 PDF 서명 도구를 함께 사용하세요.',
  ];

  const tableColumns = [
    { label: 'No', width: 12, align: 'center' },
    { label: '품목', width: 76 },
    { label: '수량', width: 18, align: 'right' },
    { label: '단가', width: 34, align: 'right' },
    { label: '금액', width: 34, align: 'right' },
  ] as const;

  const itemRows = (rows: FormRows, limit?: number): readonly (readonly string[])[] => {
    const items = (rows.items ?? []).filter((row) => (row.name ?? '').trim());
    const list = typeof limit === 'number' ? items.slice(0, limit) : items;
    return list.map((row, index) => {
      const quantity = Number(row.quantity ?? 0);
      const unitPrice = parseAmount(row.unitPrice ?? '');
      const amount = itemAmount({
        name: row.name ?? '',
        quantity,
        unitPrice,
      });
      return [
        String(index + 1),
        (row.name ?? '').trim(),
        quantity > 0 ? String(quantity) : '',
        unitPrice > 0 ? formatWon(unitPrice) : '',
        amount > 0 ? formatWon(amount) : '',
      ];
    });
  };

  const summaryRows = (rows: FormRows): readonly (readonly string[])[] => {
    const items = (rows.items ?? []).filter((row) => (row.name ?? '').trim());
    const top = itemRows(rows, 3);
    if (items.length > 3) {
      return [...top, ['', `외 ${items.length - 3}건`, '', '', '']];
    }
    return top;
  };

  const headerBlock: FormBlock = {
    kind: 'header',
    variant: 'editorial',
    title,
    docNoField: 'docNo',
    dateField: 'date',
    logo: true,
  };

  const partiesBlock: FormBlock = {
    kind: 'parties',
    left: {
      label: '공급자',
      lines: (values) => partyLines(values, 'supplier', '대표'),
    },
    right: {
      label: '공급받는자',
      lines: (values) => partyLines(values, 'buyer', '담당'),
    },
  };

  const kvBlock: FormBlock = { kind: 'kv', columns: 2, rows: conditionRows };
  const noteBlock: FormBlock = { kind: 'text', label: '비고', field: 'note', minLines: 2 };
  const signatureBlock: FormBlock = {
    kind: 'signature',
    roles: ['공급자'],
    bottom: true,
    seal: true,
  };
  const totalsBlock: FormBlock = {
    kind: 'totals',
    rows: [
      { label: '공급가액', field: 'supplyLabel' },
      { label: '부가세', field: 'vatAmountLabel' },
      { label: '합계', field: 'totalLabel', strong: true },
    ],
  };

  const bodyBlocks: FormBlock[] = [
    headerBlock,
    partiesBlock,
    kvBlock,
    { kind: 'section', title: '품목' },
    {
      kind: 'table',
      columns: tableColumns,
      rows: (_values, rows) => itemRows(rows),
      minRows: 4,
    },
    totalsBlock,
    noteBlock,
    signatureBlock,
  ];

  const summaryBlocks: FormBlock[] = [
    headerBlock,
    partiesBlock,
    kvBlock,
    { kind: 'section', title: '품목' },
    {
      kind: 'table',
      columns: tableColumns,
      rows: (_values, rows) => summaryRows(rows),
      minRows: 0,
    },
    totalsBlock,
    noteBlock,
    { kind: 'notice', text: '붙임 1. 품목 내역서 1부.' },
    signatureBlock,
  ];

  const attachmentBlocks: FormBlock[] = [
    {
      kind: 'pageBreak',
      title: '붙임 1. 품목 내역서',
      note: '본 붙임은 본문 견적서의 일부입니다.',
    },
    {
      kind: 'table',
      columns: tableColumns,
      rows: (_values, rows) => itemRows(rows),
      minRows: 0,
    },
    totalsBlock,
  ];

  return {
    slug: type,
    title,
    family: 'finance',
    category: 'money',
    description,
    keywords: isQuote
      ? ['견적서 양식', '견적서 PDF', '견적서 만들기', '무료 견적서', '부가세 견적서']
      : ['거래명세서 양식', '거래명세서 PDF', '거래명세서 만들기', '납품명세서'],
    updated: '2026-11-15',
    docPrefix,
    companyParty: 'supplier',
    lead,
    useCases,
    howTo,
    notes,
    fields,
    groups: [itemsGroup],
    blocks: bodyBlocks,
    buildBlocks: ({ attachment }) =>
      attachment ? [...summaryBlocks, ...attachmentBlocks] : bodyBlocks,
    sample: {
      docNo: `${docPrefix}-20261115-001`,
      date: '2026-11-15',
      ...(isQuote ? { validUntil: '2026-11-30' } : {}),
      supplierCompany: '옷깃',
      supplierBiz: '123-45-67891',
      supplierCeo: '홍길동',
      supplierAddress: '서울시 강남구 테헤란로 1',
      supplierContact: '010-1234-5678',
      buyerCompany: '거래처 주식회사',
      buyerBiz: '220-81-62517',
      buyerCeo: '김담당',
      buyerAddress: '부산시 해운대구 1',
      buyerContact: '051-123-4567',
      vatMode: '부가세 별도',
      note: isQuote
        ? '납기: 계약 후 30일\n입금: 납품 후 14일'
        : '납품일: 2026. 11. 15.\n입금: 납품 후 14일',
    },
    sampleRows: {
      items: [
        { name: '웹사이트 디자인', quantity: '2', unitPrice: '500000' },
        { name: '유지보수', quantity: '1', unitPrice: '100000' },
      ],
    },
    compute: (values, rows) => {
      const vatMode = toVatMode(values.vatMode);
      const totals = computeTotals(toItems(rows), vatMode);
      return {
        validLabel: values.validUntil ? formatDateDot(values.validUntil) : '',
        vatLabel: vatModeLabel(vatMode),
        supplyLabel: formatWon(totals.supply),
        vatAmountLabel: formatWon(totals.vat),
        totalLabel: formatWon(totals.total),
      };
    },
    validate: (_values, rows) => {
      const items = toItems(rows);
      const errors: string[] = [];
      if (items.length === 0) errors.push('품목을 한 줄 이상 입력하세요.');
      if (items.some((item) => item.quantity <= 0)) {
        errors.push('수량은 1 이상이어야 합니다.');
      }
      if (items.some((item) => item.unitPrice < 0)) {
        errors.push('단가는 0원 이상이어야 합니다.');
      }
      return errors;
    },
    faq: isQuote
      ? [
          {
            q: '견적서와 거래명세서는 무엇이 다른가요?',
            a: '견적서는 거래 전에 제안하는 금액과 조건을 적고, 거래명세서는 거래한 품목과 금액을 확인하는 문서입니다. 이 사이트에서는 두 양식을 따로 열어 각각 만들 수 있습니다.',
          },
          {
            q: '부가세는 어떻게 계산되나요?',
            a: '부가세 별도는 품목 합계에 10%를 더하고, 부가세 포함은 입력 금액에서 공급가액과 부가세를 역산합니다. 부가세 없음은 합계만 표시합니다.',
          },
          {
            q: '회사 정보를 저장할 수 있나요?',
            a: '입력값은 이 브라우저에 임시 저장됩니다. 같은 브라우저에서 다시 열면 이어서 쓸 수 있고, 서버로는 전송되지 않습니다.',
          },
          {
            q: '세금계산서도 발행할 수 있나요?',
            a: '아니요. 이 양식은 참고용입니다. 세금계산서 발행은 국세청 홈택스나 회계 프로그램을 이용하세요.',
          },
          {
            q: 'PDF 글자를 선택할 수 있나요?',
            a: '네. 문서를 이미지가 아니라 텍스트로 그려 PDF 글자를 선택·검색·복사할 수 있습니다.',
          },
        ]
      : [
          {
            q: '거래명세서는 언제 쓰나요?',
            a: '납품·거래 후 품목과 수량, 금액을 확인하는 문서입니다. 세금계산서와 함께 보관하거나 거래처에 확인을 받을 때 씁니다.',
          },
          {
            q: '견적서와 거래명세서를 같이 만들 수 있나요?',
            a: '두 양식은 입력 구조가 같습니다. 견적서에서 작성한 내용을 참고해 거래명세서를 다시 작성하거나, 반대로 확인할 수 있습니다.',
          },
          {
            q: '부가세 포함 금액도 계산되나요?',
            a: '네. 부가세 기준에서 “부가세 포함”을 고르면 입력한 금액에서 공급가액과 부가세를 역산합니다.',
          },
          {
            q: '입력한 내용이 서버로 전송되나요?',
            a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다.',
          },
        ],
    sources: [
      {
        label: '국세청 홈택스 — 전자세금계산서 안내',
        href: 'https://www.hometax.go.kr/',
      },
      {
        label: '국세청 — 부가가치세 안내',
        href: 'https://www.nts.go.kr/',
      },
    ],
    related: [
      { label: otherTitle, href: otherHref },
      { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
      { label: '도장·서명 만들기', href: '/tools/seal-maker/' },
      { label: '양식 전체 보기', href: '/forms/' },
    ],
  };
}
