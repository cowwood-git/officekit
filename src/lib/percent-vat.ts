export interface VatResult {
  supply: number;
  vat: number;
  total: number;
}

export function percentOf(value: number, percent: number): number {
  return (value * percent) / 100;
}

/** part가 whole의 몇 %인지. whole이 0이면 null. */
export function percentRatio(part: number, whole: number): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole === 0) return null;
  return (part / whole) * 100;
}

/** from → to 증감률(%). from이 0이면 null. */
export function percentChange(from: number, to: number): number | null {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return 10;
  return Math.min(100, Math.max(0, rate));
}

/** 공급가액에서 부가세와 합계를 계산한다. 원 단위 반올림. */
export function vatFromSupply(supply: number, rate = 10): VatResult {
  const safeSupply = Number.isFinite(supply) ? Math.round(supply) : 0;
  const safeRate = clampRate(rate);
  const vat = Math.round((safeSupply * safeRate) / 100);
  return { supply: safeSupply, vat, total: safeSupply + vat };
}

/** 부가세 포함 금액에서 공급가액을 역산한다. 합계는 입력값을 유지한다. */
export function supplyFromTotal(total: number, rate = 10): VatResult {
  const safeTotal = Number.isFinite(total) ? Math.round(total) : 0;
  const safeRate = clampRate(rate);
  const supply = Math.round(safeTotal / (1 + safeRate / 100));
  return { supply, vat: safeTotal - supply, total: safeTotal };
}

/** 숫자 입력의 쉼표·공백·원 표시를 제거한다. 비어 있으면 null. */
export function parseNumberInput(raw: string): number | null {
  const cleaned = raw.replace(/[,\s₩원]/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** 1,234,567 형식으로 표시한다. */
export function formatNumber(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '-';
  const fixed = value.toFixed(digits);
  const [integer = '0', decimal] = fixed.split('.');
  const withComma = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal ? `${withComma}.${decimal}` : withComma;
}

export function formatWon(value: number): string {
  return `${formatNumber(Math.round(value))}원`;
}

export function formatPercent(value: number | null, digits = 2): string {
  if (value === null) return '-';
  const formatted = formatNumber(value, digits);
  const trimmed = formatted.includes('.')
    ? formatted.replace(/0+$/, '').replace(/\.$/, '')
    : formatted;
  return `${trimmed}%`;
}
