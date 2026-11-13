import {
  formatDate,
  formatWon,
  itemAmount,
  type Party,
  type QuoteForm,
  type QuoteTotals,
  quoteTypeLabel,
  vatModeLabel,
} from '@/lib/quote';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COLUMNS = [24, 245, 52, 88, 94.28];
const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 22;
const PAGE_BREAK_Y = 255;

interface Fonts {
  regular: import('pdf-lib').PDFFont;
}

interface Colors {
  ink: import('pdf-lib').RGB;
  muted: import('pdf-lib').RGB;
  line: import('pdf-lib').RGB;
  fill: import('pdf-lib').RGB;
  white: import('pdf-lib').RGB;
}

const clipText = (
  text: string,
  font: import('pdf-lib').PDFFont,
  size: number,
  width: number,
): string => {
  const value = text.trim();
  if (!value) return '';
  if (font.widthOfTextAtSize(value, size) <= width) return value;
  let shortened = value;
  while (shortened.length > 1 && font.widthOfTextAtSize(`${shortened}…`, size) > width) {
    shortened = shortened.slice(0, -1);
  }
  return `${shortened}…`;
};

const wrap = (
  text: string,
  font: import('pdf-lib').PDFFont,
  size: number,
  width: number,
  maxLines: number,
): string[] => {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let current = '';
    for (const char of paragraph) {
      const next = current + char;
      if (font.widthOfTextAtSize(next, size) > width && current) {
        lines.push(current);
        current = char;
        if (lines.length >= maxLines) break;
      } else {
        current = next;
      }
    }
    if (lines.length >= maxLines) break;
    if (current) lines.push(current);
  }
  return lines.slice(0, maxLines);
};

const partyLines = (party: Party, role = '대표'): string[] =>
  [
    party.company,
    party.businessNumber ? `사업자 ${party.businessNumber}` : '',
    party.representative ? `${role} ${party.representative}` : '',
    party.address,
    party.contact,
  ].filter(Boolean);

export async function buildQuotePdf(
  form: QuoteForm,
  totals: QuoteTotals,
  fontBytes: ArrayBuffer,
): Promise<Uint8Array> {
  const { PDFDocument, rgb } = await import('pdf-lib');
  const fontkit = (await import('@pdf-lib/fontkit')).default;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(`${quoteTypeLabel(form.type)} ${form.number}`.trim());
  pdf.setProducer('옷깃');
  pdf.setCreator('옷깃');
  pdf.setCreationDate(new Date());

  const font = await pdf.embedFont(fontBytes, { subset: false });
  const fonts: Fonts = { regular: font };
  const colors: Colors = {
    ink: rgb(0.07, 0.09, 0.11),
    muted: rgb(0.38, 0.42, 0.46),
    line: rgb(0.78, 0.8, 0.82),
    fill: rgb(0.94, 0.96, 0.96),
    white: rgb(1, 1, 1),
  };

  const typeLabel = quoteTypeLabel(form.type);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const text = (
    value: string,
    x: number,
    yTop: number,
    size: number,
    color: import('pdf-lib').RGB = colors.ink,
    fontFace: import('pdf-lib').PDFFont = fonts.regular,
  ) => {
    page.drawText(value, { x, y: yTop - size, size, font: fontFace, color });
  };

  const rightText = (
    value: string,
    right: number,
    yTop: number,
    size: number,
    color = colors.ink,
  ) => {
    page.drawText(value, {
      x: right - font.widthOfTextAtSize(value, size),
      y: yTop - size,
      size,
      font,
      color,
    });
  };

  const line = (x1: number, y1: number, x2: number, y2: number) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 0.6,
      color: colors.line,
    });
  };

  const drawHeader = (continued = false) => {
    if (!continued) {
      const title = typeLabel.split('').join(' ');
      const titleSize = 23;
      const titleWidth = font.widthOfTextAtSize(title, titleSize);
      text(title, (PAGE_WIDTH - titleWidth) / 2, y, titleSize);
      y -= 35;
      text(`문서번호 ${form.number}`, MARGIN, y, 9, colors.muted);
      rightText(`작성일 ${formatDate(form.date)}`, PAGE_WIDTH - MARGIN, y, 9, colors.muted);
      y -= 18;
      if (form.validUntil) {
        rightText(
          `유효기간 ${formatDate(form.validUntil)}`,
          PAGE_WIDTH - MARGIN,
          y,
          9,
          colors.muted,
        );
        y -= 8;
      }

      const boxTop = y - 4;
      const boxHeight = 86;
      const boxWidth = (CONTENT_WIDTH - 13) / 2;
      const drawParty = (party: Party, x: number, label: string, role = '대표') => {
        page.drawRectangle({
          x,
          y: boxTop - boxHeight,
          width: boxWidth,
          height: boxHeight,
          borderColor: colors.line,
          borderWidth: 0.7,
          color: colors.white,
        });
        text(label, x + 9, boxTop - 8, 8.5, colors.muted);
        let lineY = boxTop - 24;
        for (const value of partyLines(party, role)) {
          const fitted = clipText(value, font, 9.5, boxWidth - 18);
          if (!fitted) continue;
          text(fitted, x + 9, lineY, 9.5);
          lineY -= 13;
          if (lineY < boxTop - boxHeight + 8) break;
        }
      };
      drawParty(form.supplier, MARGIN, '공급자');
      drawParty(form.buyer, MARGIN + boxWidth + 13, '공급받는자', '담당');
      y = boxTop - boxHeight - 22;
    } else {
      text(`${typeLabel} (계속)`, MARGIN, y, 11, colors.muted);
      rightText(form.number, PAGE_WIDTH - MARGIN, y, 8, colors.muted);
      y -= 28;
    }
  };

  const drawTableHeader = () => {
    page.drawRectangle({
      x: MARGIN,
      y: y - HEADER_HEIGHT,
      width: CONTENT_WIDTH,
      height: HEADER_HEIGHT,
      color: colors.fill,
    });
    const labels = ['No', '품목', '수량', '단가', '금액'];
    let x = MARGIN;
    for (let index = 0; index < labels.length; index += 1) {
      const width = COLUMNS[index] ?? 0;
      const value = labels[index] ?? '';
      if (index === 2 || index === 3 || index === 4) {
        rightText(value, x + width - 6, y - 6, 8.5, colors.muted);
      } else {
        text(value, x + 6, y - 6, 8.5, colors.muted);
      }
      x += width;
    }
    y -= HEADER_HEIGHT;
  };

  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    drawHeader(true);
    drawTableHeader();
  };

  drawHeader();
  drawTableHeader();

  const namedItems = form.items.filter((item) => item.name.trim());
  for (const [index, item] of namedItems.entries()) {
    if (y - ROW_HEIGHT < PAGE_BREAK_Y) newPage();
    const amount = itemAmount(item);
    let x = MARGIN;
    const cells = [
      String(index + 1),
      item.name,
      String(item.quantity),
      formatWon(item.unitPrice),
      formatWon(amount),
    ];
    for (let column = 0; column < cells.length; column += 1) {
      const width = COLUMNS[column] ?? 0;
      const value = cells[column] ?? '';
      if (column >= 2) {
        rightText(clipText(value, font, 9, width - 8), x + width - 5, y - 7, 9);
      } else {
        text(clipText(value, font, 9, width - 9), x + 5, y - 7, 9);
      }
      x += width;
    }
    y -= ROW_HEIGHT;
    line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  }

  y -= 18;
  if (y < PAGE_BREAK_Y) {
    newPage();
    y -= 10;
  }

  const totalsWidth = 220;
  const totalsX = PAGE_WIDTH - MARGIN - totalsWidth;
  const totalRows = [
    ['공급가액', formatWon(totals.supply)],
    [vatModeLabel(form.vatMode), formatWon(totals.vat)],
    ['합계', formatWon(totals.total)],
  ];
  page.drawRectangle({
    x: totalsX,
    y: y - 64,
    width: totalsWidth,
    height: 64,
    borderColor: colors.line,
    borderWidth: 0.7,
    color: colors.white,
  });
  let totalY = y - 8;
  for (const [label, value] of totalRows) {
    text(label ?? '', totalsX + 9, totalY, 9, colors.muted);
    rightText(value ?? '', PAGE_WIDTH - MARGIN - 9, totalY, 9);
    totalY -= 19;
  }
  y -= 82;

  if (form.note.trim()) {
    text('비고', MARGIN, y, 8.5, colors.muted);
    y -= 14;
    const lines = wrap(form.note, font, 9, CONTENT_WIDTH, 4);
    for (const value of lines) {
      text(value, MARGIN, y, 9);
      y -= 13;
    }
  }

  // 마지막 페이지 아래에 참고용 고지와 쪽 번호를 넣는다.
  const pages = pdf.getPages();
  pages.forEach((current, index) => {
    const footer = '본 문서는 참고용으로 작성되었습니다. 세무 신고용 서식이 아닙니다.';
    const size = 7.5;
    const width = font.widthOfTextAtSize(footer, size);
    current.drawText(footer, {
      x: (PAGE_WIDTH - width) / 2,
      y: 28,
      size,
      font,
      color: colors.muted,
    });
    const pageLabel = `${index + 1} / ${pages.length}`;
    current.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(pageLabel, 8),
      y: 28,
      size: 8,
      font,
      color: colors.muted,
    });
  });

  return pdf.save();
}
