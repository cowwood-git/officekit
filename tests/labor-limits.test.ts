import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';
import { disclaimerKind } from '../src/lib/form-disclaimer';
import {
  annualRateFrom,
  exceedsYears,
  hoursFrom,
  minimumWageFor,
  monthsFrom,
} from '../src/lib/labor-limits';

const form = (slug: string) => {
  const found = FORMS.find((item) => item.slug === slug);
  if (!found) throw new Error(`${slug} 양식이 없습니다.`);
  return found;
};

describe('법정 한도 계산', () => {
  it('근로 시작 연도에 맞는 최저임금을 고른다', () => {
    expect(minimumWageFor('2026-12-01')).toEqual({ year: 2026, hourly: 10_320 });
    expect(minimumWageFor('2027-01-01')).toEqual({ year: 2027, hourly: 10_700 });
    expect(minimumWageFor('2030-03-01').year).toBe(2027);
    expect(minimumWageFor('').year).toBe(2027);
  });

  it.each([
    ['연 5%', 5],
    ['연 24 %', 24],
    ['월 2%', 24],
    ['25퍼센트', 25],
    ['없음', null],
    ['', null],
  ])('이자 문구 %s → 연 %s%%', (text, rate) => {
    expect(annualRateFrom(text)).toBe(rate);
  });

  it('시간·기간 문구를 숫자로 읽는다', () => {
    expect(hoursFrom('12시간')).toBe(12);
    expect(hoursFrom('주 15시간')).toBe(15);
    expect(monthsFrom('입사일로부터 3년')).toBe(36);
    expect(monthsFrom('1년 6개월')).toBe(18);
    expect(monthsFrom('계약 기간 동안')).toBeNull();
  });

  it('2년 경계를 정확히 판단한다', () => {
    expect(exceedsYears('2026-12-01', '2028-11-30', 2)).toBe(false);
    expect(exceedsYears('2026-12-01', '2028-12-01', 2)).toBe(true);
    expect(exceedsYears('2026-12-01', '', 2)).toBe(false);
  });
});

describe('양식 경고', () => {
  it('최저임금보다 낮은 근로계약서 임금을 알린다', () => {
    const contract = form('employment-contract');
    const base = { ...contract.sample };
    expect(contract.warn?.(base, {})).toEqual([]);
    expect(contract.warn?.({ ...base, wage: '2000000' }, {})[0]).toContain('2026년 최저임금');
    expect(
      contract.warn?.(
        { ...base, startDate: '2027-01-02', wageCycle: '시급', wage: '10500' },
        {},
      )[0],
    ).toContain('2027년 최저임금');
    expect(contract.warn?.({ ...base, endDate: '2029-12-01' }, {})[0]).toContain('2년');
  });

  it('이자 20%·연장근로 12시간·신원보증 2년을 넘으면 알린다', () => {
    const loan = form('loan-note');
    expect(loan.warn?.({ ...loan.sample }, {})).toEqual([]);
    expect(loan.warn?.({ ...loan.sample, interest: '월 3%' }, {})[0]).toContain('연 36%');

    const overtime = form('overtime-agreement');
    expect(overtime.warn?.({ ...overtime.sample }, {})).toEqual([]);
    expect(overtime.warn?.({ ...overtime.sample, weeklyLimit: '16시간' }, {})[0]).toContain(
      '16시간',
    );

    const guarantee = form('personal-guarantee');
    expect(guarantee.warn?.({ ...guarantee.sample }, {})).toEqual([]);
    expect(guarantee.warn?.({ ...guarantee.sample, term: '5년' }, {})[0]).toContain('2년');
  });

  it('급여명세서는 가산 수당의 시간 수, 임금대장은 근로자 정보를 확인한다', () => {
    const payslip = form('payslip');
    const rows = payslip.sampleRows ?? {};
    expect(payslip.warn?.({ ...payslip.sample }, rows)).toEqual([]);
    const noHours = {
      ...rows,
      earnings: [{ item: '야간수당', calc: '', amount: '50000' }],
    };
    expect(payslip.warn?.({ ...payslip.sample }, noHours)[0]).toContain('야간수당');

    const ledger = form('wage-ledger');
    const ledgerRows = ledger.sampleRows ?? {};
    expect(ledger.warn?.({ ...ledger.sample }, ledgerRows)).toEqual([]);
    expect(
      ledger.warn?.({ ...ledger.sample, basis: '' }, { wages: ledgerRows.wages ?? [] }),
    ).toHaveLength(2);
  });
});

describe('문서 성격별 안내 문구', () => {
  it.each([
    ['payslip', 'labor'],
    ['tax-invoice', 'tax'],
    ['loan-note', 'legal'],
    ['employment-certificate', 'certificate'],
    ['math-notebook-5mm', 'school'],
    ['quote', 'general'],
  ])('%s → %s', (slug, kind) => {
    expect(disclaimerKind(form(slug))).toBe(kind);
  });
});
