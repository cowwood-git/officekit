/**
 * 문서용 글꼴 묶음.
 *
 * 미리보기용 글자 폭을 재는 일과 PDF에 실제로 넣는 일을 같은 글꼴 데이터로 한다.
 * 나눔고딕 Regular/Bold 두 벌만 쓴다.
 */

import { PDFDocument } from 'pdf-lib';
import { ptToMm, type Weight } from './theme';
import type { DocMetrics } from './types';

export type FontData = ArrayBuffer | Uint8Array;

export interface DocFonts {
  regular: FontData;
  bold: FontData;
  metrics: DocMetrics;
}

export async function createDocFonts(regular: FontData, bold: FontData): Promise<DocFonts> {
  const pdf = await PDFDocument.create();
  const fontkit = (await import('@pdf-lib/fontkit')).default;
  pdf.registerFontkit(fontkit);

  const regularFont = await pdf.embedFont(regular, { subset: false });
  const boldFont = await pdf.embedFont(bold, { subset: false });

  return {
    regular,
    bold,
    metrics: {
      widthOf: (text: string, sizePt: number, weight: Weight): number => {
        const font = weight === 'bold' ? boldFont : regularFont;
        return ptToMm(font.widthOfTextAtSize(text, sizePt));
      },
    },
  };
}
