import { describe, expect, it } from 'vitest';
import { travelExpense } from '../src/data/forms/travel-expense';
import { travelReport } from '../src/data/forms/travel-report';
import { travelRequest } from '../src/data/forms/travel-request';
import { layoutDocument } from '../src/lib/doc/layout';
import { ptToMm } from '../src/lib/doc/theme';
import type { DocPage, FormRows } from '../src/lib/doc/types';

const metrics = {
  widthOf: (text: string, sizePt: number, weight: 'regular' | 'bold'): number =>
    text.length * ptToMm(sizePt) * (weight === 'bold' ? 0.95 : 0.9),
};

const texts = (page: DocPage): string[] =>
  page.ops.filter((op) => op.kind === 'text').map((op) => op.text);

const allText = (pages: DocPage[]): string => pages.flatMap(texts).join(' ');

describe('출장 팩', () => {
  it('출장신청서는 예상 경비 합계와 일금을 계산한다', () => {
    const pages = layoutDocument(
      travelRequest,
      travelRequest.sample,
      metrics,
      { mode: 'filled' },
      travelRequest.sampleRows ?? {},
    );
    expect(pages).toHaveLength(1);
    const text = allText(pages);

    expect(text).toContain('출장신청서');
    expect(text).toContain('부산');
    expect(text).toContain('KTX 왕복');
    expect(text).toContain('330,000원');
    expect(text).toContain('일금 삼십삼만 원정');
  });

  it('출장보고서는 일정과 기간을 그린다', () => {
    const pages = layoutDocument(
      travelReport,
      travelReport.sample,
      metrics,
      { mode: 'filled' },
      travelReport.sampleRows ?? {},
    );
    expect(pages.length).toBeGreaterThan(0);
    const text = allText(pages);

    expect(text).toContain('출장보고서');
    expect(text).toContain('거래처 미팅');
    expect(text).toContain('2026. 11. 20.');
    expect(text).toContain('기간');
  });

  it('출장비 정산서는 지출 합계와 잔액을 계산한다', () => {
    const pages = layoutDocument(
      travelExpense,
      travelExpense.sample,
      metrics,
      { mode: 'filled' },
      travelExpense.sampleRows ?? {},
    );
    expect(pages).toHaveLength(1);
    const text = allText(pages);

    expect(text).toContain('출장비 정산서');
    expect(text).toContain('330,000원');
    expect(text).toContain('300,000원');
    expect(text).toContain('30,000원 추가 지급');
  });

  it('정산서는 품목이 많으면 붙임으로 분리한다', () => {
    const rows: FormRows = {
      expenses: Array.from({ length: 20 }, (_, index) => ({
        date: '2026-11-20',
        category: '교통비',
        item: `지출 ${index + 1}`,
        amount: '10000',
        note: '',
      })),
    };
    const pages = layoutDocument(
      travelExpense,
      travelExpense.sample,
      metrics,
      { mode: 'filled', attachment: true },
      rows,
    );
    expect(pages.length).toBeGreaterThan(1);
    const first = pages[0];
    expect(first).toBeDefined();
    if (!first) return;

    const firstText = allText([first]);
    expect(firstText).toContain('붙임 1. 지출 내역서 1부.');
    expect(firstText).toContain('외 17건');
    expect(firstText).toContain('200,000원');

    const restText = allText(pages.slice(1));
    expect(restText).toContain('붙임 1. 지출 내역서');
    expect(restText).toContain('지출 20');
  });
});
