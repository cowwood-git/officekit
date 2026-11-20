import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';
import type { FormBlock } from '../src/lib/doc/types';
import { childConsentWarning, privacyItemWarnings } from '../src/lib/privacy-limits';
import {
  bizNoWarnings,
  invoiceRequiredWarnings,
  simpleReceiptWarnings,
} from '../src/lib/tax-limits';

const form = (slug: string) => {
  const found = FORMS.find((item) => item.slug === slug);
  if (!found) throw new Error(slug);
  return found;
};
const allText = (slug: string) => {
  const item = form(slug);
  return [...item.notes, ...item.faq.map((faq) => `${faq.q} ${faq.a}`)].join(' ');
};

describe('예시 데이터는 경고가 없다', () => {
  it.each([
    'privacy-consent',
    'personal-guarantee',
    'memorandum',
    'seal-delegation',
    'tax-invoice',
    'tax-exempt-invoice',
    'standard-receipt',
    'receipt',
    'transaction-statement',
    'transaction-spec',
    'loan-note',
  ])('%s', (slug) => {
    const item = form(slug);
    expect(item.warn?.(item.sample, item.sampleRows ?? {}) ?? []).toEqual([]);
  });
});

describe('개인정보 수집·이용 동의서', () => {
  it('주민등록번호·민감정보·고유식별정보를 알린다', () => {
    expect(privacyItemWarnings('성명, 주민등록번호').join()).toContain('제24조의2');
    expect(privacyItemWarnings('성명, 건강 상태').join()).toContain('제23조');
    expect(privacyItemWarnings('여권번호').join()).toContain('제24조)');
    expect(privacyItemWarnings('성명, 생년월일, 연락처, 이메일, 주소')).toEqual([]);
  });

  it('만 14세 미만이면 법정대리인 동의를 알린다', () => {
    expect(childConsentWarning('2013-11-22', '2026-11-21').join()).toContain('만 12세');
    expect(childConsentWarning('2012-11-21', '2026-11-21')).toEqual([]);
    expect(childConsentWarning('', '2026-11-21')).toEqual([]);
  });

  it('PDF 표에 동의 거부권과 제3자 제공 별도 동의가 들어간다', () => {
    const item = form('privacy-consent');
    const table = item.blocks.find(
      (block): block is Extract<FormBlock, { kind: 'table' }> => block.kind === 'table',
    );
    const rows = (values: Record<string, string>) => {
      const source = table?.rows;
      return typeof source === 'function' ? source(values, {}) : (source ?? []);
    };
    const base = rows(item.sample).map((row) => row.join(' '));
    expect(base.join()).toContain('동의 거부권 동의를 거부할 수 있습니다. 거부하면 채용 전형에');
    expect(base.join()).not.toContain('제3자 제공 동의');
    const shared = rows({ ...item.sample, thirdParty: '옷깃 인재 / 평판 조회 / 성명 / 1개월' });
    expect(shared.map((row) => row[0])).toContain('제3자 제공 동의');
    expect(
      rows({ ...item.sample, refusalEffect: '' })
        .map((row) => row[1])
        .join(),
    ).toContain('불이익은 없습니다');
    const warn = item.warn?.({ ...item.sample, items: '성명, 주민등록번호' }, {}) ?? [];
    expect(warn.join()).toContain('제24조의2');
  });
});

describe('세무 증빙 경고', () => {
  it('사업자등록번호 체크섬이 틀리면 알린다', () => {
    const fields = [['supplierBiz', '공급자']] as const;
    expect(bizNoWarnings({ supplierBiz: '123-45-67891' }, fields)).toEqual([]);
    expect(bizNoWarnings({ supplierBiz: '123-45-67890' }, fields)[0]).toContain('공급자');
    expect(bizNoWarnings({ supplierBiz: '' }, fields)).toEqual([]);
  });

  it('세금계산서 필요적 기재사항이 빠지면 알린다', () => {
    const invoice = form('tax-invoice');
    const warn = invoice.warn?.({ ...invoice.sample, buyerBiz: '' }, invoice.sampleRows ?? {});
    expect(warn?.join()).toContain('공급받는자 등록번호');
    expect(warn?.join()).toContain('부가가치세법 제32조');
    expect(invoiceRequiredWarnings({ supplierBiz: '1', supplierCeo: '박' }, '계산서')[0]).toContain(
      '소득세법 제163조',
    );
    expect(
      invoiceRequiredWarnings({ supplierBiz: '1', supplierCeo: '박' }, '계산서')[0],
    ).not.toContain('매입세액');
  });

  it('간이영수증은 3만 원 초과 현금 거래만 알린다', () => {
    expect(simpleReceiptWarnings(30_000)).toEqual([]);
    expect(simpleReceiptWarnings(30_001)[0]).toContain('증빙불비가산세');
    const receipt = form('receipt');
    expect(receipt.warn?.({ ...receipt.sample, amount: '50000' }, {}).join()).toContain('3만 원');
    expect(receipt.warn?.({ ...receipt.sample, amount: '50000', method: '카드' }, {})).toEqual([]);
  });

  it('계산서 근거 법령과 출금전표 영문 제목을 바로잡았다', () => {
    const exempt = form('tax-exempt-invoice');
    expect(exempt.sources.map((source) => source.label).join()).toContain('소득세법');
    expect(exempt.sources.map((source) => source.label).join()).not.toContain('부가가치세법');
    const slip = form('withdrawal-slip');
    const texts = slip.blocks.flatMap((block) => (block.kind === 'paragraph' ? [block.text] : []));
    expect(texts).toContain('WITHDRAWAL SLIP');
    expect(texts).not.toContain('DEPOSIT SLIP');
  });
});

describe('법률 문서 안내·경고', () => {
  it('신원보증서는 경과실·무한 책임 문구를 알린다', () => {
    const guarantee = form('personal-guarantee');
    const warn = guarantee.warn?.({ ...guarantee.sample, scope: '경과실을 포함한 모든 손해' }, {});
    expect(warn?.join()).toContain('제6조');
    expect(allText('personal-guarantee')).toContain('제7조');
  });

  it('각서는 위약금·사직 약속을 알리고 업무 문장은 넘어간다', () => {
    const memo = form('memorandum');
    const warn = (content: string) => memo.warn?.({ ...memo.sample, content }, {}) ?? [];
    expect(warn('위반 시 500만 원을 배상하겠습니다').join()).toContain('근로기준법 제20조');
    expect(warn('다시 위반하면 사직하겠습니다').join()).toContain('제23조');
    expect(warn('퇴사 후에도 보안을 유지하겠습니다')).toEqual([]);
  });

  it('인감 위임장은 유효 기간이 비면 알린다', () => {
    const seal = form('seal-delegation');
    expect(seal.warn?.({ ...seal.sample, validUntil: '' }, {}).join()).toContain('유효 기간');
  });

  it('내용증명은 원본 1통·등본 2통과 시효 6개월을 안내한다', () => {
    const text = allText('content-certified-mail');
    expect(text).toContain('등본 2통');
    expect(text).toContain('민법 제174조');
    expect(text).not.toContain('같은 내용 2부');
  });

  it('영수증(표준)은 확인되지 않은 별지 번호를 쓰지 않는다', () => {
    const receipt = form('standard-receipt');
    expect(`${receipt.description} ${receipt.lead} ${allText('standard-receipt')}`).not.toContain(
      '별지 제67호',
    );
  });
});
