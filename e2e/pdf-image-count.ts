import { join } from 'node:path';
/** 페이지에서 그려지는 이미지 객체 수를 센다. (테스트 검증용) */
export async function countPageImages(buffer: Buffer, pageNumber: number): Promise<number> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: `${join(process.cwd(), 'public', 'pdfjs', 'standard_fonts')}/`,
  });
  const doc = await task.promise;
  const page = await doc.getPage(pageNumber);
  const operatorList = await page.getOperatorList();
  let count = 0;
  for (const fn of operatorList.fnArray) {
    if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject) {
      count += 1;
    }
  }
  page.cleanup();
  await task.destroy();
  return count;
}
