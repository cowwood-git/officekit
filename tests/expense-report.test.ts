import { describe, expect, it } from 'vitest';
import { expenseReport } from '../src/data/forms/expense-report';
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

describe('지출결의서', () => {
  it('예시 입력으로 한 장을 만든다', () => {
    const pages = layoutDocument(
      expenseReport,
      expenseReport.sample,
      metrics,
      { mode: 'filled' },
      expenseReport.sampleRows ?? {},
    );
    expect(pages).toHaveLength(1);
    const text = allText(pages);

    expect(text).toContain('지출결의서');
    expect(text).toContain('김옷깃');
    expect(text).toContain('회의 다과');
    expect(text).toContain('95,000원');
    expect(text).toContain('일금 구만오천 원정');
  });

  it('지출이 많으면 붙임 배치로 본문과 내역서를 분리한다', () => {
    const rows: FormRows = {
      expenses: Array.from({ length: 20 }, (_, index) => ({
        date: '2026-11-15',
        item: `지출 항목 ${index + 1}`,
        amount: '10000',
        note: '',
      })),
    };
    const pages = layoutDocument(
      expenseReport,
      expenseReport.sample,
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
    expect(restText).toContain('지출 항목 20');
    expect(restText).toContain('200,000원');
  });
});
