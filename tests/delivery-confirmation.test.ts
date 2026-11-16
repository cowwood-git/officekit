import { describe, expect, it } from 'vitest';
import { deliveryConfirmation } from '../src/data/forms/delivery-confirmation';
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

describe('납품확인서', () => {
  it('예시 입력으로 한 장을 만든다', () => {
    const pages = layoutDocument(
      deliveryConfirmation,
      deliveryConfirmation.sample,
      metrics,
      { mode: 'filled' },
      deliveryConfirmation.sampleRows ?? {},
    );
    expect(pages).toHaveLength(1);
    const text = allText(pages);

    expect(text).toContain('납품확인서');
    expect(text).toContain('옷깃');
    expect(text).toContain('거래처 주식회사');
    expect(text).toContain('A4 복사용지');
    expect(text).toContain('517,000원');
    expect(text).toContain('인수자');
  });

  it('품목이 많으면 붙임 배치로 본문과 내역서를 분리한다', () => {
    const rows: FormRows = {
      items: Array.from({ length: 20 }, (_, index) => ({
        name: `품목 ${index + 1}`,
        spec: '규격',
        quantity: '1',
        unitPrice: '10000',
      })),
    };
    const pages = layoutDocument(
      deliveryConfirmation,
      deliveryConfirmation.sample,
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
