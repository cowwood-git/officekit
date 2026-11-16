/**
 * DisplayList → PDF. 좌표만 mm에서 pt로 바꾸고, 글꼴은 나눔고딕 두 벌을 넣는다.
 */

import { PDFDocument, type PDFFont, type RGB, rgb } from 'pdf-lib';
import type { DocFonts } from './fonts';
import { mmToPt, ptToMm } from './theme';
import type { DocPage } from './types';

export interface PdfMeta {
  title: string;
  author?: string;
  subject?: string;
}

const colorCache = new Map<string, RGB>();

function parseColor(hex: string): RGB {
  const cached = colorCache.get(hex);
  if (cached) return cached;
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;
  const color = rgb(red, green, blue);
  colorCache.set(hex, color);
  return color;
}

async function embed(bytes: DocFonts['regular'], pdf: PDFDocument): Promise<PDFFont> {
  // pdf-lib의 한글 subset은 글리프 매핑이 깨지는 사례가 있어 원본을 넣는다.
  // 용량 최적화는 별도 과제로 남긴다(docs/forms-plan.md).
  return pdf.embedFont(bytes, { subset: false });
}

export async function renderPdf(
  pages: DocPage[],
  fonts: DocFonts,
  meta: PdfMeta,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fontkit = (await import('@pdf-lib/fontkit')).default;
  pdf.registerFontkit(fontkit);

  const regular = await embed(fonts.regular, pdf);
  const bold = await embed(fonts.bold, pdf);

  pdf.setTitle(meta.title);
  pdf.setAuthor(meta.author ?? '옷깃');
  pdf.setSubject(meta.subject ?? '');
  pdf.setCreator('옷깃');
  pdf.setProducer('옷깃');
  pdf.setCreationDate(new Date());

  for (const source of pages) {
    const page = pdf.addPage([mmToPt(source.width), mmToPt(source.height)]);

    for (const op of source.ops) {
      if (op.kind === 'text') {
        if (!op.text) continue;
        const font = op.weight === 'bold' ? bold : regular;
        const widthMm = ptToMm(font.widthOfTextAtSize(op.text, op.size));
        const offset = op.align === 'center' ? widthMm / 2 : op.align === 'right' ? widthMm : 0;
        page.drawText(op.text, {
          x: mmToPt(op.x - offset),
          y: mmToPt(source.height - op.y),
          size: op.size,
          font,
          color: parseColor(op.color),
        });
      } else if (op.kind === 'line') {
        page.drawLine({
          start: { x: mmToPt(op.x1), y: mmToPt(source.height - op.y1) },
          end: { x: mmToPt(op.x2), y: mmToPt(source.height - op.y2) },
          thickness: mmToPt(op.width),
          color: parseColor(op.color),
          dashArray: op.dash ? [mmToPt(op.dash[0]), mmToPt(op.dash[1])] : undefined,
        });
      } else if (op.kind === 'rect') {
        page.drawRectangle({
          x: mmToPt(op.x),
          y: mmToPt(source.height - op.y - op.height),
          width: mmToPt(op.width),
          height: mmToPt(op.height),
          color: op.fill ? parseColor(op.fill) : undefined,
          borderColor: op.stroke ? parseColor(op.stroke) : undefined,
          borderWidth: op.stroke ? mmToPt(op.strokeWidth ?? 0.2) : undefined,
        });
      } else if (op.kind === 'image') {
        const image = await pdf.embedPng(op.src);
        page.drawImage(image, {
          x: mmToPt(op.x),
          y: mmToPt(source.height - op.y - op.height),
          width: mmToPt(op.width),
          height: mmToPt(op.height),
        });
      }
    }
  }

  return pdf.save();
}
