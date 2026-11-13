import { join } from 'node:path';

/** Node에서 PDF 텍스트를 페이지별로 추출한다. (테스트 검증용) */
export async function extractPdfText(buffer: Buffer): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: false,
    standardFontDataUrl: `${join(process.cwd(), 'public', 'pdfjs', 'standard_fonts')}/`,
  });
  const doc = await task.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ')
        .trim(),
    );
    page.cleanup();
  }

  await task.destroy();
  return pages;
}
