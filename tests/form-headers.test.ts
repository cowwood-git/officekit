import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';
import { layoutDocument } from '../src/lib/doc/layout';
import { ptToMm } from '../src/lib/doc/theme';
import type { FormBlock } from '../src/lib/doc/types';

const metrics = {
  widthOf: (text: string, sizePt: number, weight: 'regular' | 'bold'): number =>
    text.length * ptToMm(sizePt) * (weight === 'bold' ? 0.95 : 0.9),
};

const isEditorial = (block: FormBlock): boolean =>
  block.kind === 'header' && block.variant === 'editorial';

describe('양식 헤더 전수 검사', () => {
  it('editorial 헤더의 막대·제목·작성일·구분선이 같은 기준선에 맞는다', () => {
    const forms = FORMS.filter((form) => form.blocks.some(isEditorial));
    expect(forms.length).toBe(45);

    for (const form of forms) {
      const pages = layoutDocument(
        form,
        form.sample,
        metrics,
        { mode: 'filled' },
        form.sampleRows ?? {},
      );
      const page = pages[0];
      expect(page, form.slug).toBeDefined();
      if (!page) continue;

      const texts = page.ops.filter((op) => op.kind === 'text');
      const title = texts.find((op) => op.size === 18 && op.x < 40);
      const docNo = texts.find((op) => op.text.includes('문서번호 '));
      const date = texts.find((op) => op.text.startsWith('작성일 '));
      const bar = page.ops.find((op) => op.kind === 'rect' && Math.abs(op.width - 1.2) < 0.01);
      const rule = page.ops.find((op) => op.kind === 'line' && Math.abs(op.y1 - 34.8) < 0.01);

      expect(title, `${form.slug} 제목`).toBeDefined();
      expect(docNo, `${form.slug} 문서번호`).toBeDefined();
      expect(date, `${form.slug} 작성일`).toBeDefined();
      expect(bar, `${form.slug} 세로 막대`).toBeDefined();
      expect(rule, `${form.slug} 구분선`).toBeDefined();

      expect(bar?.kind).toBe('rect');
      if (bar?.kind === 'rect') {
        expect(bar.x).toBeCloseTo(18, 1);
        expect(bar.y).toBeCloseTo(19.2, 1);
        expect(bar.height).toBeCloseTo(11, 1);
      }
      expect(date?.y).toBeCloseTo(title?.y ?? 0, 1);
      expect(title?.y).toBeLessThan(34.8);
      expect(docNo?.y).toBeLessThan(title?.y ?? 0);
      expect(rule?.kind).toBe('line');
    }
  });
});
