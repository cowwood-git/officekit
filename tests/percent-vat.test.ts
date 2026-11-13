import { describe, expect, it } from 'vitest';
import {
  formatNumber,
  formatPercent,
  formatWon,
  parseNumberInput,
  percentChange,
  percentOf,
  percentRatio,
  supplyFromTotal,
  vatFromSupply,
} from '../src/lib/percent-vat';

describe('percent helpers', () => {
  it('X의 Y%를 계산한다', () => {
    expect(percentOf(200, 15)).toBe(30);
    expect(percentOf(0, 50)).toBe(0);
  });

  it('비율과 증감률을 계산한다', () => {
    expect(percentRatio(25, 200)).toBe(12.5);
    expect(percentRatio(1, 0)).toBeNull();
    expect(percentChange(100, 120)).toBeCloseTo(20);
    expect(percentChange(100, 80)).toBeCloseTo(-20);
    expect(percentChange(0, 80)).toBeNull();
  });
});

describe('VAT', () => {
  it('공급가액에서 부가세를 계산한다', () => {
    expect(vatFromSupply(1_000_000)).toEqual({
      supply: 1_000_000,
      vat: 100_000,
      total: 1_100_000,
    });
  });

  it('부가세 포함 금액에서 역산한다', () => {
    expect(supplyFromTotal(1_100_000)).toEqual({
      supply: 1_000_000,
      vat: 100_000,
      total: 1_100_000,
    });
  });

  it('원 단위로 반올림한다', () => {
    expect(vatFromSupply(12_345)).toEqual({ supply: 12_345, vat: 1_235, total: 13_580 });
    expect(supplyFromTotal(13_580)).toEqual({ supply: 12_345, vat: 1_235, total: 13_580 });
  });

  it('세율 0%도 처리한다', () => {
    expect(vatFromSupply(50_000, 0)).toEqual({ supply: 50_000, vat: 0, total: 50_000 });
  });
});

describe('number formatting', () => {
  it('쉼표를 넣는다', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(-1234.5, 2)).toBe('-1,234.50');
    expect(formatWon(1000)).toBe('1,000원');
    expect(formatPercent(12.345)).toBe('12.35%');
    expect(formatPercent(null)).toBe('-');
  });

  it('입력에서 쉼표·원·공백을 제거한다', () => {
    expect(parseNumberInput('1,100,000원')).toBe(1_100_000);
    expect(parseNumberInput(' - ')).toBeNull();
    expect(parseNumberInput('abc')).toBeNull();
  });
});
