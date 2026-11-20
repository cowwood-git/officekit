import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { leaveRequest } from '../src/data/forms/leave-request';
import { createSubsetter } from '../src/lib/doc/font-subset';
import { createDocFonts } from '../src/lib/doc/fonts';
import { layoutDocument } from '../src/lib/doc/layout';
import { renderPdf } from '../src/lib/doc/pdf';

const regularUrl = new URL('../public/fonts/NanumGothic-OfficeKit.ttf', import.meta.url);
const boldUrl = new URL('../public/fonts/NanumGothic-Bold-OfficeKit.ttf', import.meta.url);

describe('PDF 글꼴 서브셋', () => {
  const wasmUrl = new URL('../node_modules/harfbuzzjs/dist/harfbuzz-subset.wasm', import.meta.url);

  async function textOf(bytes: Uint8Array): Promise<string> {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const doc = await pdfjs.getDocument({ data: bytes.slice(), verbosity: 0 }).promise;
    let text = '';
    for (let index = 1; index <= doc.numPages; index += 1) {
      const content = await (await doc.getPage(index)).getTextContent();
      text += content.items.map((item) => ('str' in item ? item.str : '')).join('|');
    }
    return text;
  }

  it('쓰인 글자만 남긴 글꼴로 PDF를 작게 만들고 글자는 원본 글꼴과 같다', async () => {
    const [regular, bold, wasm] = await Promise.all([
      readFile(regularUrl),
      readFile(boldUrl),
      readFile(wasmUrl),
    ]);
    const fonts = await createDocFonts(regular, bold);
    const pages = layoutDocument(leaveRequest, leaveRequest.sample, fonts.metrics, {
      mode: 'filled',
    });
    const subsetter = await createSubsetter(wasm);
    const small = await renderPdf(pages, fonts, { title: '휴가신청서' }, { subsetter });
    const full = await renderPdf(pages, fonts, { title: '휴가신청서' }, { subsetter: null });

    expect(full.byteLength).toBeGreaterThan(1_000_000);
    expect(small.byteLength).toBeLessThan(150_000);
    expect(await textOf(small)).toBe(await textOf(full));
  }, 60_000);

  it('공백이 글꼴의 마지막 글리프여도 읽힌다(fontkit 빈 글리프 버그 회피)', async () => {
    const wasm = await readFile(wasmUrl);
    const subset = (await createSubsetter(wasm))(await readFile(regularUrl), '연차 휴가 (L)');
    expect(subset).not.toBeNull();
    const fontkit = (await import('@pdf-lib/fontkit')).default;
    const font = fontkit.create(subset as Uint8Array);
    expect(font.layout('연차 휴가 (L)').glyphs.every((glyph) => glyph.advanceWidth > 0)).toBe(true);
  });
});

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
