import { describe, expect, it } from 'vitest';
import { quote } from '../src/data/forms/quote';
import { statement } from '../src/data/forms/statement';
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

const sampleRows = quote.sampleRows ?? {};

describe('견적서 양식', () => {
  it('예시 입력으로 견적서 한 장을 만든다', () => {
    const pages = layoutDocument(quote, quote.sample, metrics, { mode: 'filled' }, sampleRows);
    expect(pages).toHaveLength(1);
    const text = allText(pages);

    expect(text).toContain('견적서');
    expect(text).toContain('옷깃');
    expect(text).toContain('거래처 주식회사');
    expect(text).toContain('웹사이트 디자인');
    expect(text).toContain('1,000,000원');
    expect(text).toContain('1,210,000원');
    expect(text).toContain('부가세 별도');
    expect(text).toContain('공급자');
  });

  it('부가세 포함이면 공급가액과 부가세를 역산한다', () => {
    const pages = layoutDocument(
      quote,
      { ...quote.sample, vatMode: '부가세 포함' },
      metrics,
      { mode: 'filled' },
      sampleRows,
    );
    const text = allText(pages);
    expect(text).toContain('1,100,000원');
    expect(text).toContain('부가세 포함');
  });

  it('품목이 많으면 다음 페이지로 넘기고 표 머리글을 반복한다', () => {
    const rows: FormRows = {
      items: Array.from({ length: 25 }, (_, index) => ({
        name: `품목 ${index + 1}`,
        quantity: '1',
        unitPrice: '10000',
      })),
    };
    const pages = layoutDocument(quote, quote.sample, metrics, { mode: 'filled' }, rows);
    expect(pages.length).toBeGreaterThan(1);
    const text = allText(pages);
    expect(text).toContain('품목 25');
    expect(text).toContain('250,000원');
  });

  it('붙임 배치에서는 본문 1장에 요약을 두고 품목 전체를 붙임으로 보낸다', () => {
    const rows: FormRows = {
      items: Array.from({ length: 20 }, (_, index) => ({
        name: `품목 ${index + 1}`,
        quantity: '1',
        unitPrice: '10000',
      })),
    };
    const pages = layoutDocument(
      quote,
      quote.sample,
      metrics,
      { mode: 'filled', attachment: true },
      rows,
    );
    expect(pages.length).toBeGreaterThan(1);
    const first = pages[0];
    expect(first).toBeDefined();
    if (!first) return;

    const firstText = allText([first]);
    expect(firstText).toContain('붙임 1. 품목 내역서 1부.');
    expect(firstText).toContain('외 17건');
    expect(firstText).toContain('220,000원');

    const restText = allText(pages.slice(1));
    expect(restText).toContain('붙임 1. 품목 내역서');
    expect(restText).toContain('품목 20');
    expect(restText).toContain('220,000원');
  });
});

describe('거래명세서 양식', () => {
  it('견적서와 다른 제목·문서번호 접두사를 쓴다', () => {
    const pages = layoutDocument(
      statement,
      statement.sample,
      metrics,
      { mode: 'filled' },
      statement.sampleRows ?? {},
    );
    const text = allText(pages);
    expect(text).toContain('거래명세서');
    expect(text).toContain('S-20261115-001');
    expect(text).toContain('거래일');
    expect(text).toContain('1,210,000원');
  });
});
