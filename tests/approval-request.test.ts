import { describe, expect, it } from 'vitest';
import { approvalRequest } from '../src/data/forms/approval-request';
import { layoutDocument } from '../src/lib/doc/layout';
import { ptToMm } from '../src/lib/doc/theme';
import type { DocPage } from '../src/lib/doc/types';

const metrics = {
  widthOf: (text: string, sizePt: number, weight: 'regular' | 'bold'): number =>
    text.length * ptToMm(sizePt) * (weight === 'bold' ? 0.95 : 0.9),
};

const texts = (page: DocPage): string[] =>
  page.ops.filter((op) => op.kind === 'text').map((op) => op.text);

describe('품의서', () => {
  it('예시 입력으로 한 장을 만든다', () => {
    const pages = layoutDocument(approvalRequest, approvalRequest.sample, metrics, {
      mode: 'filled',
    });
    expect(pages).toHaveLength(1);
    const page = pages[0];
    expect(page).toBeDefined();
    if (!page) return;

    const text = texts(page).join(' ');
    expect(text).toContain('품의서');
    expect(text).toContain('김옷깃');
    expect(text).toContain('11월 팀 워크숍 운영비 품의');
    expect(text).toContain('1,200,000원');
    expect(text).toContain('일금 일백이십만 원정');
    expect(text).toContain('담당');
    expect(text).toContain('대표');
  });
});
