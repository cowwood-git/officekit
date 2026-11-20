import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { FORMS } from '../src/data/forms';
import { DOC_NO_HIDDEN } from '../src/lib/doc/format';
import { layoutDocument } from '../src/lib/doc/layout';
import { ptToMm } from '../src/lib/doc/theme';
import type { DocPage } from '../src/lib/doc/types';
import { buildFormWorkbook } from '../src/lib/form-xlsx';
import { buildHwpxParts } from '../src/lib/hwpx-native/document';

const metrics = {
  widthOf: (text: string, sizePt: number, weight: 'regular' | 'bold'): number =>
    text.length * ptToMm(sizePt) * (weight === 'bold' ? 0.95 : 0.9),
};

const form = (slug: string) => {
  const found = FORMS.find((item) => item.slug === slug);
  if (!found) throw new Error(slug);
  return found;
};

const texts = (pages: readonly DocPage[]) =>
  pages.flatMap((page) =>
    page.ops.flatMap((op) => (op.kind === 'text' ? [{ text: op.text, size: op.size }] : [])),
  );

const layout = (slug: string, hidden: boolean) => {
  const item = form(slug);
  const values = { ...item.sample, ...(hidden ? { [DOC_NO_HIDDEN]: '1' } : {}) };
  return layoutDocument(item, values, metrics, { mode: 'filled' }, item.sampleRows ?? {});
};

describe('문서번호 표시 끄기', () => {
  it('PDF 머리글에서 문서번호를 빼고 제목을 키운다', () => {
    const item = form('expense-report');
    const shown = texts(layout('expense-report', false));
    const hidden = texts(layout('expense-report', true));
    const docNo = item.sample.docNo ?? '';
    expect(docNo).not.toBe('');

    expect(shown.some((op) => op.text.includes(docNo))).toBe(true);
    expect(hidden.some((op) => op.text.includes(docNo) || op.text.startsWith('문서번호'))).toBe(
      false,
    );

    const titleSize = (list: typeof shown) => list.find((op) => op.text === item.title)?.size ?? 0;
    expect(titleSize(shown)).toBe(18);
    expect(titleSize(hidden)).toBeGreaterThan(18);
  });

  it('긴 제목은 작성일과 겹치지 않게 18pt까지 줄인다', () => {
    const item = form('asset-disposal');
    const values = {
      ...item.sample,
      [DOC_NO_HIDDEN]: '1',
    };
    const longTitle = '아주 긴 제목이 들어간 사내 업무 처리 결과 보고서 양식 예시';
    const long = {
      ...item,
      blocks: item.blocks.map((block) =>
        block.kind === 'header' ? { ...block, title: longTitle } : block,
      ),
    };
    const pages = layoutDocument(long, values, metrics, { mode: 'filled' }, item.sampleRows ?? {});
    const title = texts(pages).find((op) => op.text === longTitle);
    expect(title?.size).toBe(18);
  });

  it('빈 양식(blank)에서도 “문서번호” 칸 이름을 빼준다', () => {
    const item = form('expense-report');
    const pages = layoutDocument(
      item,
      { [DOC_NO_HIDDEN]: '1' },
      metrics,
      { mode: 'blank' },
      item.sampleRows ?? {},
    );
    expect(texts(pages).some((op) => op.text.startsWith('문서번호'))).toBe(false);
  });

  it('HWPX에서도 문서번호를 뺀다', () => {
    const item = form('expense-report');
    const docNo = item.sample.docNo ?? '';
    const parts = buildHwpxParts(item, {
      values: { ...item.sample, [DOC_NO_HIDDEN]: '1' },
      rows: item.sampleRows ?? {},
      mode: 'filled',
    });
    expect(parts.sectionXml).not.toContain(docNo);
    expect(parts.sectionXml).toContain(item.title);
  });

  it('엑셀 내보내기에서 문서 번호 줄을 뺀다', () => {
    const item = form('expense-report');
    const bytes = buildFormWorkbook(
      item,
      { ...item.sample, [DOC_NO_HIDDEN]: '1' },
      item.sampleRows ?? {},
    );
    const book = XLSX.read(bytes);
    const first = book.SheetNames[0] ?? '';
    const rows = XLSX.utils.sheet_to_json<string[]>(book.Sheets[first] ?? {}, { header: 1 });
    expect(rows.some((row) => row[0] === '문서 번호')).toBe(false);
  });
});
