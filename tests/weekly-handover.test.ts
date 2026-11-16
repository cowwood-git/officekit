import { describe, expect, it } from 'vitest';
import { handover } from '../src/data/forms/handover';
import { weeklyReport } from '../src/data/forms/weekly-report';
import { layoutDocument } from '../src/lib/doc/layout';
import { ptToMm } from '../src/lib/doc/theme';
import type { DocPage } from '../src/lib/doc/types';

const metrics = {
  widthOf: (text: string, sizePt: number, weight: 'regular' | 'bold'): number =>
    text.length * ptToMm(sizePt) * (weight === 'bold' ? 0.95 : 0.9),
};

const texts = (page: DocPage): string[] =>
  page.ops.filter((op) => op.kind === 'text').map((op) => op.text);

const allText = (pages: DocPage[]): string => pages.flatMap(texts).join(' ');

describe('주간업무보고', () => {
  it('업무 표와 진행률, 다음 주 계획을 그린다', () => {
    const pages = layoutDocument(
      weeklyReport,
      weeklyReport.sample,
      metrics,
      { mode: 'filled' },
      weeklyReport.sampleRows ?? {},
    );
    expect(pages.length).toBeGreaterThan(0);
    const text = allText(pages);

    expect(text).toContain('주간업무보고');
    expect(text).toContain('11월 정산 마감');
    expect(text).toContain('100%');
    expect(text).toContain('2026. 11. 9.');
    expect(text).toContain('다음 주 계획');
  });

  it('빈 양식에서는 예시 값 없이 표와 서명란만 남긴다', () => {
    const pages = layoutDocument(weeklyReport, {}, metrics, { mode: 'blank' });
    const text = allText(pages);

    expect(text).toContain('주간업무보고');
    expect(text).toContain('이번 주 업무');
    expect(text).toContain('작성자');
    expect(text).not.toContain('11월 정산 마감');
    expect(text).not.toContain('김옷깃');
  });

  it('진행률이 0~100을 벗어나면 안내한다', () => {
    expect(weeklyReport.validate?.({}, { tasks: [{ task: '정산', progress: '120' }] })).toEqual([
      '진행률은 0~100 사이 숫자로 입력하세요.',
    ]);
    expect(weeklyReport.validate?.({}, { tasks: [{ task: '정산', progress: '80' }] })).toEqual([]);
  });
});

describe('인수인계서', () => {
  it('업무 내용과 확인 체크리스트를 그린다', () => {
    const pages = layoutDocument(handover, handover.sample, metrics, {
      mode: 'filled',
    });
    expect(pages.length).toBeGreaterThan(0);
    const text = allText(pages);

    expect(text).toContain('인수인계서');
    expect(text).toContain('김옷깃');
    expect(text).toContain('박인수');
    expect(text).toContain('확인 항목');
    expect(text).toContain('업무 목록과 담당자 정리');
    const boxes = pages.flatMap((page) =>
      page.ops.filter((op) => op.kind === 'rect' && Math.abs(op.width - 3.1) < 0.01),
    );
    expect(boxes).toHaveLength(6);
    expect(text).toContain('인수인계자');
    expect(text).toContain('인수자');
    expect(text).toContain('부서장');
  });

  it('빈 양식에서도 확인 체크리스트는 그대로 남는다', () => {
    const pages = layoutDocument(handover, {}, metrics, { mode: 'blank' });
    const text = allText(pages);

    expect(text).toContain('인수인계서');
    expect(text).toContain('확인 항목');
    expect(text).toContain('업무 목록과 담당자 정리');
    expect(text).not.toContain('김옷깃');
    expect(text).not.toContain('박인수');
  });
});
