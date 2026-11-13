/** 견적서·거래명세서 계산과 검증 — 화면과 PDF가 같은 값을 쓰도록 분리한다. */

export type QuoteType = 'quote' | 'statement';
export type VatMode = 'excluded' | 'included' | 'none';

export interface QuoteItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Party {
  company: string;
  businessNumber: string;
  representative: string;
  address: string;
  contact: string;
}

export interface QuoteForm {
  type: QuoteType;
  number: string;
  date: string;
  validUntil: string;
  supplier: Party;
  buyer: Party;
  items: QuoteItem[];
  vatMode: VatMode;
  note: string;
}

export interface QuoteTotals {
  supply: number;
  vat: number;
  total: number;
}

export function formatWon(value: number): string {
  return `${new Intl.NumberFormat('ko-KR').format(Math.max(0, Math.round(value)))}원`;
}

export function parseAmount(value: string): number {
  const parsed = Number(value.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function itemAmount(item: QuoteItem): number {
  return Math.round(Math.max(0, item.quantity) * Math.max(0, item.unitPrice));
}

/** 부가세 별도·포함·없음을 모두 같은 합계 규칙으로 계산한다. */
export function computeTotals(items: readonly QuoteItem[], mode: VatMode): QuoteTotals {
  const sum = items.reduce((total, item) => total + itemAmount(item), 0);
  if (mode === 'none') return { supply: sum, vat: 0, total: sum };
  if (mode === 'included') {
    const supply = Math.round(sum / 1.1);
    return { supply, vat: sum - supply, total: sum };
  }
  const vat = Math.round(sum * 0.1);
  return { supply: sum, vat, total: sum + vat };
}

export function formatDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[1]}. ${Number(match[2])}. ${Number(match[3])}.`;
}

export function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function defaultDocumentNumber(type: QuoteType, date: string): string {
  const compact = date.replaceAll('-', '') || '00000000';
  return `${type === 'quote' ? 'Q' : 'S'}-${compact}-001`;
}

export function quotePdfFileName(type: QuoteType, date: string): string {
  return `${type === 'quote' ? '견적서' : '거래명세서'}-${date || 'document'}.pdf`;
}

export function quoteTypeLabel(type: QuoteType): string {
  return type === 'quote' ? '견적서' : '거래명세서';
}

export function vatModeLabel(mode: VatMode): string {
  if (mode === 'included') return '부가세 포함';
  if (mode === 'none') return '부가세 없음';
  return '부가세 별도';
}

export function validateQuote(form: QuoteForm): string[] {
  const errors: string[] = [];
  if (!form.number.trim()) errors.push('문서 번호를 입력하세요.');
  if (!form.date) errors.push('작성일을 선택하세요.');
  if (!form.supplier.company.trim()) errors.push('공급자 상호를 입력하세요.');
  if (!form.buyer.company.trim()) errors.push('공급받는자 상호를 입력하세요.');
  const items = form.items.filter((item) => item.name.trim());
  if (items.length === 0) errors.push('품목을 하나 이상 입력하세요.');
  if (items.some((item) => item.quantity <= 0)) errors.push('수량은 1 이상이어야 합니다.');
  if (items.some((item) => item.unitPrice < 0)) errors.push('단가는 0원 이상이어야 합니다.');
  return errors;
}
