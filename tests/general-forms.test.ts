import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';

const form = (slug: string) => {
  const found = FORMS.find((item) => item.slug === slug);
  if (!found) throw new Error(slug);
  return found;
};
const compute = (slug: string, values: Record<string, string>, rows: Record<string, unknown>) =>
  form(slug).compute?.(values, rows as never) ?? {};

describe('예시 데이터는 경고가 없다', () => {
  it.each(['recruitment', 'vehicle-log', 'quote-comparison', 'vendor-registration'])(
    '%s',
    (slug) => {
      const item = form(slug);
      expect(item.warn?.(item.sample, item.sampleRows ?? {}) ?? []).toEqual([]);
    },
  );
});

describe('법인차량 운행일지', () => {
  it('비업무 운행은 업무사용비율에서 빠진다', () => {
    const out = compute(
      'vehicle-log',
      {},
      {
        trips: [
          { purpose: '거래처 방문', use: '일반 업무', startKm: '1000', endKm: '1060' },
          { purpose: '출근', use: '출퇴근', startKm: '1060', endKm: '1080' },
          { purpose: '개인 용무', use: '비업무', startKm: '1080', endKm: '1100' },
        ],
      },
    );
    expect(out.totalDistanceLabel).toBe('100km');
    expect(out.businessDistanceLabel).toBe('80km');
    expect(out.businessRatioLabel).toBe('80.0%');
  });

  it('구분을 고르지 않으면 일반 업무로 본다', () => {
    const out = compute(
      'vehicle-log',
      {},
      { trips: [{ purpose: '외근', startKm: '0', endKm: '50' }] },
    );
    expect(out.businessRatioLabel).toBe('100.0%');
  });
});

describe('견적 비교표', () => {
  it('일부 품목 단가가 빈 업체는 최저가로 뽑지 않는다', () => {
    const out = compute(
      'quote-comparison',
      { vendor1: 'A상사', vendor2: 'B상사' },
      {
        items: [
          { item: '복사지', quantity: '10', price1: '30000', price2: '28000' },
          { item: '토너', quantity: '1', price1: '90000', price2: '' },
        ],
      },
    );
    expect(out.bestLabel).toBe('A상사 · 390,000원');
    expect(out.total2).toContain('일부 품목 단가 없음');
  });

  it('업체 3은 비워도 된다', () => {
    const vendor3 = form('quote-comparison').fields.find((field) => field.id === 'vendor3');
    expect(vendor3?.required).toBeFalsy();
  });
});

describe('체크리스트', () => {
  it('해당 없음은 진행률 분모에서 뺀다', () => {
    const out = compute(
      'checklist',
      {},
      {
        items: [
          { item: '가', status: '완료' },
          { item: '나', status: '완료' },
          { item: '다', status: '해당 없음' },
        ],
      },
    );
    expect(out.doneLabel).toBe('2 / 2');
    expect(out.progressLabel).toBe('100%');
  });
});

describe('공문', () => {
  it('붙임이 없으면 본문 끝에 “끝.”을 붙인다', () => {
    const out = compute('official-letter', { body: '협조 바랍니다.' }, {});
    expect(out.bodyText).toBe('협조 바랍니다.  끝.');
    expect(out.attachmentText).toBe('');
  });

  it('붙임이 있으면 붙임 끝에만 붙이고, 이미 있으면 다시 붙이지 않는다', () => {
    const out = compute(
      'official-letter',
      { body: '협조 바랍니다.', attachment: '1. 단가표 1부.  끝.' },
      {},
    );
    expect(out.bodyText).toBe('협조 바랍니다.');
    expect(out.attachmentText).toBe('1. 단가표 1부.  끝.');
  });
});

describe('채용공고', () => {
  const warn = (values: Record<string, string>) => form('recruitment').warn?.(values, {}) ?? [];

  it('나이 제한을 경고한다', () => {
    expect(warn({ requirements: '35세 이하' }).join(' ')).toContain('고령자고용법');
    expect(warn({ requirements: '1990년 이후 출생' }).join(' ')).toContain('고령자고용법');
  });

  it('성별 조건을 경고한다', () => {
    expect(warn({ preferred: '남성 우대' }).join(' ')).toContain('남녀고용평등법');
  });

  it('경력 연수는 경고하지 않는다', () => {
    expect(warn({ requirements: '경력 3년 이상' })).toEqual([]);
  });
});

describe('거래처 등록신청서', () => {
  it('사업자등록증 순서대로 업태·종목 라벨을 쓴다', () => {
    const fields = form('vendor-registration').fields;
    expect(fields.find((field) => field.id === 'businessType')?.label).toBe('업태');
    expect(fields.find((field) => field.id === 'businessItem')?.label).toBe('종목');
  });
});
