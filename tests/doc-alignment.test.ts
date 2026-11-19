import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';
import { layoutDocument } from '../src/lib/doc/layout';
import { ptToMm } from '../src/lib/doc/theme';
import type { DocPage } from '../src/lib/doc/types';

const metrics = {
  widthOf: (text: string, sizePt: number, weight: 'regular' | 'bold'): number =>
    text.length * ptToMm(sizePt) * (weight === 'bold' ? 0.95 : 0.9),
};

const CONTENT_LEFT = 18;
const CONTENT_RIGHT = 192;
const TOTALS_ACCENT = '#0b6b5b';

const layoutAll = (form: (typeof FORMS)[number]): DocPage[] =>
  layoutDocument(
    form,
    form.sample,
    metrics,
    { mode: 'filled' },
    form.sampleRows ?? {},
  ) as DocPage[];

const capTop = (y: number, size: number): number => y - 0.72 * ptToMm(size);
const descenderBottom = (y: number, size: number): number => y + 0.22 * ptToMm(size);
const glyphCenter = (y: number, size: number): number =>
  (capTop(y, size) + descenderBottom(y, size)) / 2;

describe('문서 가로선·글자 정렬 전수 검사', () => {
  it('표 머리글과 행 글자는 행 높이의 세로 가운데에 놓인다', () => {
    for (const form of FORMS) {
      // 실제 종이 크기 시트(sheet)는 A4 본문 좌표가 아니라 전표 자체 좌표를 쓴다.
      if (form.sheet) continue;
      for (const page of layoutAll(form)) {
        const bands = page.ops.filter(
          (op) =>
            op.kind === 'rect' && op.fill && op.height >= 7 && op.height <= 9 && op.width >= 100,
        );
        for (const band of bands) {
          if (band.kind !== 'rect') continue;
          const labels = page.ops.filter(
            (op) => op.kind === 'text' && op.y > band.y && op.y < band.y + band.height,
          );
          expect(labels.length, `${form.slug} 머리글`).toBeGreaterThan(0);
          for (const label of labels) {
            if (label.kind !== 'text') continue;
            const center = glyphCenter(label.y, label.size);
            expect(
              Math.abs(center - (band.y + band.height / 2)),
              `${form.slug} 머리글 "${label.text}"`,
            ).toBeLessThanOrEqual(0.6);
          }
        }

        const rules = page.ops
          .filter(
            (op) =>
              op.kind === 'line' && op.y1 === op.y2 && !op.dash && Math.abs(op.x2 - op.x1) >= 100,
          )
          .sort((a, b) => (a.kind === 'line' && b.kind === 'line' ? a.y1 - b.y1 : 0));

        for (let index = 1; index < rules.length; index += 1) {
          const top = rules[index - 1];
          const bottom = rules[index];
          if (top?.kind !== 'line' || bottom?.kind !== 'line') continue;
          const rowHeight = bottom.y1 - top.y1;
          if (rowHeight < 6 || rowHeight > 12) continue;
          const cells = page.ops.filter(
            (op) => op.kind === 'text' && op.y > top.y1 && op.y < bottom.y1,
          );
          for (const cell of cells) {
            if (cell.kind !== 'text') continue;
            const center = glyphCenter(cell.y, cell.size);
            expect(
              Math.abs(center - (top.y1 + rowHeight / 2)),
              `${form.slug} "${cell.text}" 행 세로 정렬`,
            ).toBeLessThanOrEqual(0.6);
          }
        }
      }
    }
  });

  it('합계 금액은 표의 금액 열과 같은 오른쪽 끝을 쓴다', () => {
    for (const form of FORMS) {
      if (form.sheet) continue;
      for (const page of layoutAll(form)) {
        const accents = page.ops.filter(
          (op) =>
            op.kind === 'line' &&
            op.y1 === op.y2 &&
            op.color === TOTALS_ACCENT &&
            op.width >= 0.4 &&
            op.x2 - op.x1 >= 40,
        );
        for (const accent of accents) {
          if (accent.kind !== 'line') continue;
          const labels = page.ops.filter(
            (op) =>
              op.kind === 'text' &&
              op.align === 'left' &&
              Math.abs(op.x - (accent.x1 + 2.5)) < 0.01 &&
              op.y > accent.y1 &&
              op.y < accent.y1 + 40,
          );
          expect(labels.length, form.slug).toBeGreaterThan(0);
          for (const label of labels) {
            if (label.kind !== 'text') continue;
            const values = page.ops.filter(
              (op) => op.kind === 'text' && op.align === 'right' && Math.abs(op.y - label.y) < 0.01,
            );
            expect(values.length, `${form.slug} "${label.text}" 값`).toBeGreaterThan(0);
            for (const value of values) {
              if (value.kind !== 'text') continue;
              const inset = accent.x2 - value.x;
              expect(inset, `${form.slug} "${value.text}"`).toBeGreaterThanOrEqual(2);
              expect(inset, `${form.slug} "${value.text}"`).toBeLessThanOrEqual(3.2);
            }
          }
        }
      }
    }
  });

  it('합계 행에 강조선 바로 아래 이중 선을 긋지 않는다', () => {
    for (const form of FORMS) {
      if (form.sheet) continue;
      for (const page of layoutAll(form)) {
        const accents = page.ops.filter(
          (op) => op.kind === 'line' && op.color === TOTALS_ACCENT && op.width >= 0.4,
        );
        for (const accent of accents) {
          if (accent.kind !== 'line') continue;
          const doubles = page.ops.filter(
            (op) =>
              op.kind === 'line' &&
              !op.dash &&
              Math.abs(op.x2 - accent.x2) < 0.5 &&
              op.y1 > accent.y1 &&
              op.y1 - accent.y1 < 4,
          );
          expect(doubles, `${form.slug} 합계 이중선`).toHaveLength(0);
        }
      }
    }
  });

  it('본문 가로선은 모두 본문 폭 안에서 시작하고 끝난다', () => {
    for (const form of FORMS) {
      if (form.sheet) continue;
      for (const page of layoutAll(form)) {
        for (const op of page.ops) {
          if (op.kind !== 'line' || op.y1 !== op.y2) continue;
          expect(op.x1, `${form.slug} 선 시작`).toBeGreaterThanOrEqual(CONTENT_LEFT - 0.01);
          expect(op.x2, `${form.slug} 선 끝`).toBeLessThanOrEqual(CONTENT_RIGHT + 0.01);
          if (!op.dash && op.x2 - op.x1 >= 150) {
            expect(op.x1).toBeCloseTo(CONTENT_LEFT, 1);
            expect(op.x2).toBeCloseTo(CONTENT_RIGHT, 1);
          }
        }
      }
    }
  });
});
