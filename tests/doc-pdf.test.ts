import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { leaveRequest } from '../src/data/forms/leave-request';
import { createDocFonts } from '../src/lib/doc/fonts';
import { layoutDocument } from '../src/lib/doc/layout';
import { renderPdf } from '../src/lib/doc/pdf';

const regularUrl = new URL('../public/fonts/NanumGothic-OfficeKit.ttf', import.meta.url);
const boldUrl = new URL('../public/fonts/NanumGothic-Bold-OfficeKit.ttf', import.meta.url);

describe('PDF 출력', () => {
  it('휴가신청서를 텍스트가 살아 있는 A4 PDF로 만든다', async () => {
    const [regular, bold] = await Promise.all([readFile(regularUrl), readFile(boldUrl)]);
    const fonts = await createDocFonts(regular, bold);
    const pages = layoutDocument(leaveRequest, leaveRequest.sample, fonts.metrics, {
      mode: 'filled',
    });
    const bytes = await renderPdf(pages, fonts, {
      title: '휴가신청서',
      author: '김옷깃',
    });

    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    expect(bytes.byteLength).toBeLessThan(2_000_000);

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(pages.length);
    expect(pdf.getTitle()).toBe('휴가신청서');
  }, 30_000);

  it('빈 양식도 같은 페이지 수로 만든다', async () => {
    const [regular, bold] = await Promise.all([readFile(regularUrl), readFile(boldUrl)]);
    const fonts = await createDocFonts(regular, bold);
    const filled = layoutDocument(leaveRequest, leaveRequest.sample, fonts.metrics, {
      mode: 'filled',
    });
    const blank = layoutDocument(leaveRequest, leaveRequest.sample, fonts.metrics, {
      mode: 'blank',
    });
    expect(blank.length).toBe(filled.length);
  }, 30_000);
});
