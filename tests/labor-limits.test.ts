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

  it('근로계약서는 계약 형태·단시간·연소근로자 누락을 알려 준다', () => {
    const contract = form('employment-contract');
    const base = { ...contract.sample };
    const warn = (patch: Record<string, string>) =>
      contract.warn?.({ ...base, ...patch }, {}) ?? [];
    expect(warn({ contractType: '기간제' }).join()).toContain('근로 종료일을 적으세요');
    expect(warn({ endDate: '2027-11-30' }).join()).toContain('기간제로 바꾸세요');
    expect(warn({ contractType: '단시간' }).join()).toContain('기간제법 제17조');
    expect(warn({ contractType: '단시간', dailySchedule: '월~금 10:00~14:00' })).toEqual([]);
    // 단시간 월급은 소정근로시간을 모르므로 209시간 기준으로 비교하지 않는다
    expect(warn({ contractType: '단시간', dailySchedule: '월~금 4시간', wage: '1100000' })).toEqual(
      [],
    );
    expect(warn({ employeeBirth: '2009-12-02' }).join()).toContain('만 16세인 연소근로자');
    expect(warn({ employeeBirth: '2008-12-01' }).join()).not.toContain('연소근로자');
    expect(warn({ employeeBirth: '2012-01-01' }).join()).toContain('취직인허증');
  });

  it('육아휴직 신청서는 신청 기한·단기 육아휴직·단축 시간을 확인한다', () => {
    const leave = form('parental-leave');
    const base = { ...leave.sample };
    const warn = (patch: Record<string, string>) => leave.warn?.({ ...base, ...patch }, {}) ?? [];
    expect(warn({})).toEqual([]);
    expect(leave.compute?.(base, {})?.leaveTypeLabel).toBe('육아휴직');
    expect(warn({ date: '2026-11-20' }).join()).toContain('시행령 제11조');
    expect(warn({ date: '2026-11-01' })).toEqual([]);
    const short = { leaveType: '단기 육아휴직(1~2주)', startDate: '2026-12-01' };
    expect(warn({ ...short, endDate: '2026-12-10' }).join()).toContain('1주(7일) 또는 2주(14일)');
    expect(warn({ ...short, endDate: '2026-12-14' }).join()).toContain('사유');
    expect(
      warn({
        ...short,
        endDate: '2026-12-14',
        shortReason: '자녀 질병·사고 입원',
        date: '2026-12-01',
      }),
    ).toEqual([]);
    expect(
      warn({
        ...short,
        startDate: '2026-08-01',
        endDate: '2026-08-07',
        shortReason: '방학',
      }).join(),
    ).toContain('8월 20일');
    expect(leave.compute?.({ ...base, ...short, shortReason: '방학' }, {})?.leaveTypeLabel).toBe(
      '단기 육아휴직(1~2주) — 방학',
    );
    const reduced = { leaveType: '육아기 근로시간 단축' };
    expect(warn(reduced).join()).toContain('15~35시간');
    expect(warn({ ...reduced, reducedHours: '40' }).join()).toContain('35시간 이하');
    expect(warn({ ...reduced, reducedHours: '25' })).toEqual([]);
    expect(warn({ endDate: '2027-12-31' }).join()).toContain('6개월까지 더');
    expect(warn({ childBirth: '2016-01-01' }).join()).toContain('만 10세');
    expect(warn({ ...reduced, reducedHours: '25', childBirth: '2016-01-01' })).toEqual([]);
  });

  it('근로자 명부는 시행령 제20조 기재 사항을 모두 담고 퇴직자를 따로 센다', () => {
    const register = form('employee-register');
    const labels = register.groups?.[0]?.columns.map((column) => column.label) ?? [];
    for (const label of [
      '성명',
      '성별',
      '생년월일',
      '주소',
      '이력',
      '종사 업무·직위',
      '고용일',
      '계약 종료일',
      '퇴직일',
      '퇴직 사유',
    ]) {
      expect(labels).toContain(label);
    }
    const computed = register.compute?.(register.sample, register.sampleRows ?? {});
    expect(computed?.totalCountLabel).toBe('재직 3명 · 퇴직 1명');
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
    ['math-notebook-5mm', 'kids'],
    ['quote', 'general'],
  ])('%s → %s', (slug, kind) => {
    expect(disclaimerKind(form(slug))).toBe(kind);
  });
});
