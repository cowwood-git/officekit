/**
 * 견적서·거래명세서를 옷깃 페이퍼 엔진으로 그린다.
 * 화면(견적서 도구)은 기존 입력 UI를 그대로 쓰고, 출력만 새 문서 스타일로 바꾼다.
 */

import type { DocFonts } from '@/lib/doc/fonts';
import { layoutDocument } from '@/lib/doc/layout';
import type { DocumentSpec, FormBlock, FormValues } from '@/lib/doc/types';
import {
  formatDate,
  formatWon,
  itemAmount,
  type Party,
  type QuoteForm,
  type QuoteTotals,
  quoteTypeLabel,
  vatModeLabel,
} from '@/lib/quote';

const partyLines = (party: Party, role = '대표'): string[] =>
  [
    party.company,
    party.businessNumber ? `사업자 ${party.businessNumber}` : '',
    party.representative ? `${role} ${party.representative}` : '',
    party.address,
    party.contact,
  ].filter(Boolean);

function buildSpec(form: QuoteForm, totals: QuoteTotals): DocumentSpec {
  const typeLabel = quoteTypeLabel(form.type);
  const items = form.items.filter((item) => item.name.trim());
  const rows = items.map((item, index) => [
    String(index + 1),
    item.name,
    String(item.quantity),
    formatWon(item.unitPrice),
    formatWon(itemAmount(item)),
  ]);

  const blocks: FormBlock[] = [
    {
      kind: 'header',
      title: typeLabel,
      docNoField: 'docNo',
      dateField: 'date',
    },
    {
      kind: 'parties',
      left: { label: '공급자', lines: partyLines(form.supplier) },
      right: { label: '공급받는자', lines: partyLines(form.buyer, '담당') },
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        {
          label: '유효기간',
          value: form.validUntil ? formatDate(form.validUntil) : '',
        },
        { label: '부가세', value: vatModeLabel(form.vatMode) },
      ],
    },
    { kind: 'section', title: '품목' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 12, align: 'center' },
        { label: '품목', width: 76 },
        { label: '수량', width: 18, align: 'right' },
        { label: '단가', width: 34, align: 'right' },
        { label: '금액', width: 34, align: 'right' },
      ],
      rows,
      minRows: 4,
    },
    {
      kind: 'totals',
      rows: [
        { label: '공급가액', value: formatWon(totals.supply) },
        { label: vatModeLabel(form.vatMode), value: formatWon(totals.vat) },
        { label: '합계', value: formatWon(totals.total), strong: true },
      ],
    },
  ];

  if (form.note.trim()) {
    blocks.push({ kind: 'text', label: '비고', field: 'note', minLines: 2 });
  }

  blocks.push({
    kind: 'signature',
    roles: ['공급자'],
    bottom: true,
  });

  return {
    fields: [
      { id: 'docNo', label: '문서 번호', type: 'text', group: '문서' },
      { id: 'date', label: '작성일', type: 'date', group: '문서' },
      { id: 'note', label: '비고', type: 'textarea', group: '문서' },
    ],
    blocks,
    footer: '본 문서는 참고용으로 작성되었습니다. 세무 신고용 서식이 아닙니다.',
  };
}

export async function buildQuotePdf(
  form: QuoteForm,
  totals: QuoteTotals,
  fonts: DocFonts,
): Promise<Uint8Array> {
  const spec = buildSpec(form, totals);
  const values: FormValues = {
    docNo: form.number,
    date: form.date,
    note: form.note,
  };
  const pages = layoutDocument(spec, values, fonts.metrics, { mode: 'filled' });
  const { renderPdf } = await import('@/lib/doc/pdf');
  return renderPdf(pages, fonts, {
    title: `${quoteTypeLabel(form.type)} ${form.number}`.trim(),
    author: form.supplier.company || '옷깃',
    subject: `${form.buyer.company} ${quoteTypeLabel(form.type)}`.trim(),
  });
}
