import { describe, expect, it } from 'vitest';
import {
  chunkRows,
  columnWidths,
  type PdfTableOptions,
  pdfTableFileName,
  rowsPerPage,
  tablePages,
  truncateCell,
} from '../src/lib/csv-pdf';

const rows = [
  ['이름', '부서', '금액'],
  ['김오피스', '개발', '1200000'],
  ['이데이터', '영업', '950000'],
  ['박영업', '영업', '800000'],
];

const options: PdfTableOptions = {
  pageWidth: 842,
  pageHeight: 595,
  margin: 32,
  fontSize: 9,
  header: true,
};

describe('chunkRows', () => {
  it('N개씩 나눈다', () => {
    expect(chunkRows([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkRows([], 2)).toEqual([]);
  });
});

describe('columnWidths', () => {
  it('문자 수에 비례해 너비를 배분한다', () => {
    const widths = columnWidths(rows, 300);
    expect(widths).toHaveLength(3);
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(300, 5);
    expect(widths[2]).toBeGreaterThan(widths[0] ?? 0);
  });

  it('빈 표는 빈 배열', () => {
    expect(columnWidths([], 300)).toEqual([]);
  });
});

describe('truncateCell', () => {
  it('긴 셀을 줄임표로 자른다', () => {
    expect(truncateCell('가나다라마바사아자차', 50, 10)).toContain('…');
    expect(truncateCell('짧음', 100, 10)).toBe('짧음');
  });
});

describe('rowsPerPage', () => {
  it('페이지 높이에 맞는 행 수를 준다', () => {
    expect(rowsPerPage(options)).toBeGreaterThan(20);
  });
});

describe('tablePages', () => {
  it('헤더를 반복하고 페이지 번호를 붙인다', () => {
    const many = [rows[0] ?? [], ...Array.from({ length: 80 }, () => ['가', '나', '다'])];
    const pages = tablePages(many, options);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0]?.rows[0]).toEqual(['이름', '부서', '금액']);
    expect(pages[1]?.rows[0]).toEqual(['이름', '부서', '금액']);
    expect(pages[1]?.pageNumber).toBe(2);
  });

  it('헤더를 끄면 첫 행도 데이터다', () => {
    const pages = tablePages(rows, { ...options, header: false });
    expect(pages[0]?.rows).toHaveLength(4);
  });
});

describe('pdfTableFileName', () => {
  it('PDF 파일명을 만든다', () => {
    expect(pdfTableFileName('회원.csv')).toBe('회원.pdf');
  });
});
