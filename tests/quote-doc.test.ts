import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { createDocFonts } from '../src/lib/doc/fonts';
import { computeTotals, type QuoteForm } from '../src/lib/quote';
import { buildQuotePdf } from '../src/lib/quote-pdf';

const regularUrl = new URL('../public/fonts/NanumGothic-OfficeKit.ttf', import.meta.url);
const boldUrl = new URL('../public/fonts/NanumGothic-Bold-OfficeKit.ttf', import.meta.url);

const baseForm: QuoteForm = {
  type: 'quote',
  number: 'Q-20261115-001',
  date: '2026-11-15',
  validUntil: '2026-11-30',
  supplier: {
    company: '옷깃',
    businessNumber: '123-45-67891',
    representative: '홍길동',
    address: '서울시 강남구 테헤란로 1',
    contact: '010-1234-5678',
  },
  buyer: {
    company: '거래처 주식회사',
    businessNumber: '220-81-62517',
    representative: '김담당',
    address: '부산시 해운대구 1',
    contact: '051-123-4567',
  },
  items: [
    { name: '웹사이트 디자인', quantity: 2, unitPrice: 500_000 },
    { name: '유지보수', quantity: 1, unitPrice: 100_000 },
  ],
  vatMode: 'excluded',
  note: '납기: 계약 후 30일',
};

describe('견적서 문서', () => {
  it('옷깃 페이퍼 스타일의 A4 PDF를 만든다', async () => {
    const [regular, bold] = await Promise.all([readFile(regularUrl), readFile(boldUrl)]);
    const fonts = await createDocFonts(regular, bold);
    const totals = computeTotals(baseForm.items, baseForm.vatMode);
    const bytes = await buildQuotePdf(baseForm, totals, fonts);

    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    expect(bytes.byteLength).toBeLessThan(2_000_000);

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getTitle()).toBe('견적서 Q-20261115-001');
  }, 30_000);

  it('품목이 많으면 다음 페이지로 넘긴다', async () => {
    const [regular, bold] = await Promise.all([readFile(regularUrl), readFile(boldUrl)]);
    const fonts = await createDocFonts(regular, bold);
    const longForm: QuoteForm = {
      ...baseForm,
      items: Array.from({ length: 25 }, (_, index) => ({
        name: `품목 ${index + 1}`,
        quantity: 1,
        unitPrice: 10_000,
      })),
    };
    const totals = computeTotals(longForm.items, longForm.vatMode);
    const bytes = await buildQuotePdf(longForm, totals, fonts);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
  }, 30_000);
});
