import { describe, expect, it } from 'vitest';
import {
  addDays,
  computeTotals,
  defaultDocumentNumber,
  formatDate,
  formatWon,
  itemAmount,
  parseAmount,
  type QuoteForm,
  quotePdfFileName,
  validateQuote,
} from '../src/lib/quote';

const item = (name: string, quantity: number, unitPrice: number) => ({
  name,
  quantity,
  unitPrice,
});

describe('견적서 계산', () => {
  it('품목 금액과 부가세 별도 합계를 계산한다', () => {
    const items = [item('디자인', 2, 100000), item('개발', 1, 500000)];
    expect(itemAmount(item('디자인', 2, 100000))).toBe(200000);
    expect(computeTotals(items, 'excluded')).toEqual({
      supply: 700000,
      vat: 70000,
      total: 770000,
    });
  });

  it('부가세 포함 합계를 역산한다', () => {
    expect(computeTotals([item('용역', 1, 110000)], 'included')).toEqual({
      supply: 100000,
      vat: 10000,
      total: 110000,
    });
  });

  it('부가세 없음은 합계만 계산한다', () => {
    expect(computeTotals([item('면세', 1, 50000)], 'none')).toEqual({
      supply: 50000,
      vat: 0,
      total: 50000,
    });
  });

  it('금액과 날짜를 한국어 형식으로 표시한다', () => {
    expect(formatWon(1234567)).toBe('1,234,567원');
    expect(parseAmount('1,200,000원')).toBe(1200000);
    expect(formatDate('2026-11-13')).toBe('2026. 11. 13.');
    expect(addDays('2026-11-13', 14)).toBe('2026-11-27');
  });

  it('문서 번호와 파일 이름을 만든다', () => {
    expect(defaultDocumentNumber('quote', '2026-11-13')).toBe('Q-20261113-001');
    expect(quotePdfFileName('statement', '2026-11-13')).toBe('거래명세서-2026-11-13.pdf');
  });

  it('필수 입력을 검증한다', () => {
    const base: QuoteForm = {
      type: 'quote',
      number: '',
      date: '',
      validUntil: '',
      supplier: { company: '', businessNumber: '', representative: '', address: '', contact: '' },
      buyer: { company: '', businessNumber: '', representative: '', address: '', contact: '' },
      items: [item('', 0, 0)],
      vatMode: 'excluded',
      note: '',
    };
    expect(validateQuote(base).length).toBeGreaterThan(0);
    expect(
      validateQuote({
        ...base,
        number: 'Q-1',
        date: '2026-11-13',
        supplier: { ...base.supplier, company: '옷깃' },
        buyer: { ...base.buyer, company: '거래처' },
        items: [item('디자인', 1, 100000)],
      }),
    ).toEqual([]);
  });
});
