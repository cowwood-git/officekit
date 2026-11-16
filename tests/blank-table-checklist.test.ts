import { describe, expect, it } from 'vitest';
import { blankTable } from '../src/data/forms/blank-table';
import { checklist } from '../src/data/forms/checklist';
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

const boxes = (pages: DocPage[]): number =>
  pages.flatMap((page) =>
    page.ops.filter(
      (op) =>
        op.kind === 'rect' && Math.abs(op.width - 3.1) < 0.01 && Math.abs(op.height - 3.1) < 0.01,
    ),
  ).length;

describe('빈 표', () => {
  it('제목과 열 이름, 입력한 행을 한 장에 그린다', () => {
    const pages = layoutDocument(
      blankTable,
      blankTable.sample,
      metrics,
      { mode: 'filled' },
      blankTable.sampleRows ?? {},
    );
    expect(pages).toHaveLength(1);
    const text = allText(pages);

    expect(text).toContain('11월 업무 현황');
    expect(text).toContain('업무');
    expect(text).toContain('담당');
    expect(text).toContain('11월 정산 마감');
    expect(text).toContain('이상 없음');
    expect(text).toContain('비고');
  });

  it('열 수를 줄이면 뒤쪽 열은 PDF에서 제외한다', () => {
    const pages = layoutDocument(
      blankTable,
      { ...blankTable.sample, columnCount: '3' },
      metrics,
      { mode: 'filled' },
      blankTable.sampleRows ?? {},
    );
    const text = allText(pages);

    expect(text).toContain('11월 정산 마감');
    expect(text).not.toContain('진행률');
    expect(text).not.toContain('이상 없음');
  });

  it('빈 양식에서는 제목과 열 이름을 지우고 빈 행만 남긴다', () => {
    const pages = layoutDocument(blankTable, {}, metrics, { mode: 'blank' });
    const text = allText(pages);

    expect(text).toContain('표');
    expect(text).toContain('작성 정보');
    expect(text).not.toContain('11월 업무 현황');
    expect(text).not.toContain('11월 정산 마감');
  });
});

describe('체크리스트', () => {
  it('완료 수와 진행률, 체크 표시를 그린다', () => {
    const pages = layoutDocument(
      checklist,
      checklist.sample,
      metrics,
      { mode: 'filled' },
      checklist.sampleRows ?? {},
    );
    expect(pages).toHaveLength(1);
    const text = allText(pages);

    expect(text).toContain('11월 정산 체크리스트');
    expect(text).toContain('2 / 5');
    expect(text).toContain('40%');
    expect(text).toContain('정산서 금액 확인');
    expect(text).toContain('완료');
    expect(text).toContain('확인');

    expect(boxes(pages)).toBe(5);
    const checks = pages.flatMap((page) =>
      page.ops.filter((op) => op.kind === 'line' && Math.abs(op.width - 0.45) < 0.001),
    );
    expect(checks).toHaveLength(4);
  });

  it('항목이 많으면 표 머리글을 반복하며 다음 페이지로 이어진다', () => {
    const rows: FormRows = {
      items: Array.from({ length: 30 }, (_, index) => ({
        item: `점검 항목 ${index + 1}`,
        owner: '김옷깃',
        status: index < 10 ? '완료' : '미확인',
        note: '',
      })),
    };
    const pages = layoutDocument(
      checklist,
      checklist.sample,
      metrics,
      {
        mode: 'filled',
      },
      rows,
    );
    expect(pages.length).toBeGreaterThan(1);

    for (const page of pages.slice(1)) {
      expect(texts(page).join(' ')).toContain('점검 항목');
    }
  });

  it('빈 양식에서는 반복 입력값도 지우고 점검란만 남긴다', () => {
    const pages = layoutDocument(
      checklist,
      checklist.sample,
      metrics,
      { mode: 'blank' },
      checklist.sampleRows ?? {},
    );
    const text = allText(pages);

    expect(text).toContain('체크리스트');
    expect(text).toContain('점검 항목');
    expect(text).not.toContain('김옷깃');
    expect(text).not.toContain('정산서 금액 확인');
    expect(boxes(pages)).toBe(8);
  });

  it('완료 항목이 없으면 진행률을 비운다', () => {
    expect(checklist.compute?.({}, { items: [] })).toEqual({
      doneLabel: '',
      progressLabel: '',
    });
  });
});
