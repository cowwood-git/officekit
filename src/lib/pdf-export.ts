/**
 * 문서 → PDF 내보내기 공용 도구.
 * 브라우저에서 페이지를 캔버스에 그린 뒤 PDF에 이미지로 넣는다(서버 전송 없음).
 * 글자 선택은 되지 않지만, 원본 화면과 같은 모양을 유지한다.
 */

export const A4_POINTS = { width: 595.28, height: 841.89 } as const;

export interface RasterPage {
  bytes: Uint8Array;
  width: number;
  height: number;
}

export interface PdfPageSize {
  width: number;
  height: number;
}

/** 캔버스를 JPEG 바이트로 바꾼다. PDF에는 JPEG로 넣어 파일 크기를 줄인다. */
export async function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.88): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
  if (!blob) throw new Error('페이지 이미지를 만들지 못했습니다.');
  return new Uint8Array(await blob.arrayBuffer());
}

/** SVG 문자열을 지정한 너비의 캔버스에 그린 뒤 JPEG로 만든다. */
export async function svgToJpeg(
  svg: string,
  targetWidth: number,
  quality = 0.88,
): Promise<RasterPage> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    const width = Math.max(1, Math.round(targetWidth));
    const ratio = image.naturalHeight / image.naturalWidth;
    const height = Math.max(1, Math.round(width * (Number.isFinite(ratio) ? ratio : Math.SQRT2)));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('캔버스를 만들지 못했습니다.');
    // 투명 배경이 검게 나오지 않도록 흰색을 깔아 둔다.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return { bytes: await canvasToJpeg(canvas, quality), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** DOM 요소를 캔버스에 그린 뒤 JPEG로 만든다. */
export async function elementToJpeg(
  element: HTMLElement,
  width: number,
  height: number,
  pixelRatio = 2,
  quality = 0.88,
): Promise<RasterPage> {
  const { toCanvas } = await import('html-to-image');
  const canvas = await toCanvas(element, {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    pixelRatio,
    backgroundColor: '#ffffff',
    cacheBust: false,
    skipFonts: true,
  });
  return { bytes: await canvasToJpeg(canvas, quality), width: canvas.width, height: canvas.height };
}

/** 페이지 이미지를 모아 PDF 바이트를 만든다. */
export async function imagesToPdf(
  pages: readonly RasterPage[],
  pageSize: PdfPageSize,
  title: string,
): Promise<Uint8Array> {
  if (pages.length === 0) throw new Error('PDF로 만들 페이지가 없습니다.');
  const { PDFDocument } = await import('pdf-lib');
  const document = await PDFDocument.create();
  document.setTitle(title);
  document.setProducer('옷깃');
  document.setCreator('옷깃');
  document.setCreationDate(new Date());

  for (const page of pages) {
    const image = await document.embedJpg(page.bytes);
    const pdfPage = document.addPage([pageSize.width, pageSize.height]);
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: pageSize.width,
      height: pageSize.height,
    });
  }

  return document.save();
}

/** PDF 바이트를 내려받을 수 있는 Blob URL로 만든다. */
export function pdfBlobUrl(bytes: Uint8Array): string {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
}

export function pdfFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'document'}.pdf`;
}

/** 이미지 픽셀 크기를 A4 비율(96dpi 기준 794×1123)로 맞춘다. */
export function a4PixelWidth(dpi = 150): number {
  return Math.round((210 / 25.4) * dpi);
}
