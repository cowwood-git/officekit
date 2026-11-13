import { describe, expect, it } from 'vitest';
import { APP_GROUPS, groupFor } from '../src/data/app-groups';
import { tools } from '../src/data/tools';

describe('홈 묶음', () => {
  it('모든 도구는 정확히 한 묶음에 들어간다', () => {
    const placed = APP_GROUPS.flatMap((group) => group.items.map((tool) => tool.slug));
    expect(placed.length).toBe(tools.length);
    expect(new Set(placed).size).toBe(tools.length);
  });

  it('오피스 문서를 열거나 PDF로 바꾸는 도구는 OFFICE 에 모인다', () => {
    for (const slug of ['docx-to-pdf', 'pptx-to-pdf', 'hwpx-to-pdf', 'csv-pdf', 'sheet-viewer']) {
      expect(groupFor(slug)?.id, slug).toBe('office');
    }
  });

  it('견적서·도장·라벨처럼 새로 만드는 도구는 UTIL 에 둔다', () => {
    for (const slug of ['label-print', 'quote-generator', 'seal-maker', 'barcode-generator']) {
      expect(groupFor(slug)?.id, slug).toBe('utility');
    }
  });

  it('이름이 csv- 로 시작해도 표 데이터를 다루면 CSV, 이미지 OCR 은 IMAGE', () => {
    expect(groupFor('csv-json')?.id).toBe('sheet');
    expect(groupFor('image-ocr')?.id).toBe('image');
    expect(groupFor('json-tools')?.id).toBe('text');
  });
});
