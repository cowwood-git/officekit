import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { FORMS } from '../src/data/forms';
import { buildFormWorkbook } from '../src/lib/form-xlsx';

const quote = FORMS.find((form) => form.slug === 'quote');
if (!quote) throw new Error('quote form missing');

const readWorkbook = (template: (typeof FORMS)[number]) => {
  const bytes = buildFormWorkbook(template, template.sample, template.sampleRows ?? {});
  return XLSX.read(Buffer.from(bytes), { type: 'buffer' });
};

describe('양식 XLSX 내보내기', () => {
  it('문서 정보와 품목 시트를 만들고 금액 수식을 넣는다', () => {
    const workbook = readWorkbook(quote);
    expect(workbook.SheetNames).toContain('문서 정보');
    expect(workbook.SheetNames).toContain(quote.groups?.[0]?.label ?? '품목');

    const info = workbook.Sheets['문서 정보'];
    expect(info).toBeDefined();
    if (!info) return;
    const infoRows = XLSX.utils.sheet_to_json<string[]>(info, { header: 1 });
    expect(infoRows).toContainEqual(['양식', quote.title]);

    const items = workbook.Sheets[quote.groups?.[0]?.label ?? '품목'];
    expect(items).toBeDefined();
    if (!items) return;
    const rows = XLSX.utils.sheet_to_json<string[]>(items, { header: 1 });
    expect(rows[0]).toEqual(['품목', '수량', '단가', '금액']);
    expect(rows[1]?.[0]).toBe('웹사이트 디자인');
    expect(items.D2?.f).toContain('*');
    expect(items.D4?.f).toContain('SUM(D2:D3)');
  });

  it('반복 표가 있는 모든 양식을 XLSX로 만들 수 있다', () => {
    const withGroups = FORMS.filter((form) => (form.groups?.length ?? 0) > 0);
    expect(withGroups.length).toBeGreaterThan(0);

    for (const template of withGroups) {
      const workbook = readWorkbook(template);
      expect(workbook.SheetNames[0], template.slug).toBe('문서 정보');
      expect(workbook.SheetNames.length, template.slug).toBeGreaterThanOrEqual(
        (template.groups?.length ?? 0) + 1,
      );
    }
  });
});
