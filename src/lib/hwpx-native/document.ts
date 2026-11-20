import { formatDateDot, formatDateKorean, isDocNoHidden } from '@/lib/doc/format';
import { defaultLabelSlot } from '@/lib/doc/label';
import type {
  DocImageAsset,
  FormBlock,
  FormRows,
  FormTemplate,
  FormValues,
  GridCell,
  GridOverlay,
} from '@/lib/doc/types';
import { type Align, COLORS, SECTION_NS, StyleBook, type TabStop } from './styles';
import { mm } from './units';
import { escapeXml } from './xml';

export interface HwpxOptions {
  values: FormValues;
  rows: FormRows;
  mode: 'filled' | 'blank';
  /** 품목 표를 붙임으로 분리하는 배치. PDF와 같은 규칙을 쓴다. */
  attachment?: boolean;
  assets?: { logo?: DocImageAsset; seal?: DocImageAsset };
}

let CONTENT_WIDTH = 174;
const BODY = 9.5;
const TABLE_SIZE = 8.5;
const LABEL = 8;
const SMALL = 7.5;

const PAPER = { width: 210, height: 297 };
const BASE_MARGIN = { top: 10, bottom: 18, left: 18, right: 18, header: 12 };
let MARGIN = { ...BASE_MARGIN };

const HAIRLINE = { type: 'SOLID' as const, width: 0.15, color: COLORS.line };
const BOX_LINE = { type: 'SOLID' as const, width: 0.2, color: COLORS.line };
const ACCENT_LINE = { type: 'SOLID' as const, width: 0.5, color: COLORS.accent };

interface BuildContext {
  template: FormTemplate;
  blocks: readonly FormBlock[];
  values: FormValues;
  rows: FormRows;
  mode: 'filled' | 'blank';
  styles: StyleBook;
  nextId: () => number;
  assets?: { logo?: DocImageAsset; seal?: DocImageAsset };
  images: HwpxImageFile[];
}

export interface HwpxImageFile {
  name: string;
  data: Uint8Array;
  mime: string;
}

const parseDataUrl = (
  asset: DocImageAsset | undefined,
): { data: Uint8Array; mime: string; ext: string } | null => {
  if (!asset?.src.startsWith('data:image/')) return null;
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(asset.src);
  if (!match?.[1] || !match[2]) return null;
  const mime = match[1].toLowerCase();
  const ext = mime === 'image/jpeg' ? 'jpg' : (mime.split('/')[1] ?? 'png');
  try {
    return { data: Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0)), mime, ext };
  } catch {
    return null;
  }
};

function imageInline(
  ctx: BuildContext,
  asset: DocImageAsset | undefined,
  widthMm: number,
  heightMm: number,
): string {
  const parsed = parseDataUrl(asset);
  if (!parsed || !asset) return '';
  const index = ctx.images.length + 1;
  const name = `image${index}.${parsed.ext}`;
  ctx.images.push({ name, data: parsed.data, mime: parsed.mime });
  const w = mm(widthMm);
  const h = mm(heightMm);
  const pxW = Math.round(asset.width * 75);
  const pxH = Math.round(asset.height * 75);
  const id = ctx.nextId();
  return `<hp:pic id="${id}" zOrder="0" numberingType="NONE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="${id}" reverse="0"><hp:offset x="0" y="0"/><hp:orgSz width="${w}" height="${h}"/><hp:curSz width="${w}" height="${h}"/><hp:flip horizontal="0" vertical="0"/><hp:rotationInfo angle="0" centerX="${Math.round(w / 2)}" centerY="${Math.round(h / 2)}" rotateimage="0"/><hp:renderingInfo><hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:scaMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/></hp:renderingInfo><hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="${w}" y="0"/><hc:pt2 x="${w}" y="${h}"/><hc:pt3 x="0" y="${h}"/></hp:imgRect><hp:imgClip left="0" right="${pxW}" top="0" bottom="${pxH}"/><hp:inMargin left="0" right="0" top="0" bottom="0"/><hp:imgDim dimwidth="${pxW}" dimheight="${pxH}"/><hc:img binaryItemIDRef="${name}" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/><hp:effects></hp:effects><hp:sz width="${w}" widthRelTo="ABSOLUTE" height="${h}" heightRelTo="ABSOLUTE" protect="0"/><hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/><hp:outMargin left="0" right="0" top="0" bottom="0"/></hp:pic>`;
}

const t = (value: string): string => `<hp:t>${escapeXml(value).replace(/\t/g, '&#9;')}</hp:t>`;

const run = (charPr: number, content: string): string =>
  `<hp:run charPrIDRef="${charPr}">${content}</hp:run>`;

const para = (ctx: BuildContext, paraPr: number, runs: string, pageBreak = false): string =>
  `<hp:p id="${ctx.nextId()}" paraPrIDRef="${paraPr}" styleIDRef="0" pageBreak="${
    pageBreak ? 1 : 0
  }" columnBreak="0" merged="0">${runs}</hp:p>`;

const fieldValue = (ctx: BuildContext, field?: string, literal?: string): string => {
  if (ctx.mode === 'blank') return '';
  const value = field ? (ctx.values[field] ?? '').trim() : (literal ?? '').trim();
  if (!value || !field) return value;
  const meta = ctx.template.fields.find((item) => item.id === field);
  return meta?.type === 'date' ? formatDateDot(value) : value;
};

const parseRoles = (raw: string): string[] => {
  const value = raw.trim();
  if (!value) return [];
  if (value.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object',
          )
          .filter((item) => item.enabled === true)
          .map((item) => (typeof item.label === 'string' ? item.label.trim() : ''))
          .filter(Boolean)
          .slice(0, 5);
      }
    } catch {
      // 쉼표 형식으로 이어서 처리한다.
    }
  }
  return value
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, 5);
};

const cutText = (value: string, limit: number): string => {
  const text = value.trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(1, limit - 1))}…`;
};

const lineAlign = (align?: 'left' | 'center' | 'right'): Align =>
  align === 'center' ? 'CENTER' : align === 'right' ? 'RIGHT' : 'LEFT';

interface CellSpec {
  text: string;
  charPr: number;
  align?: Align;
  border: number;
  colSpan?: number;
  rowSpan?: number;
  colAddr?: number;
  rowAddr?: number;
  heightMm?: number;
  textDirection?: 'HORIZONTAL' | 'VERTICAL';
  valign?: 'TOP' | 'CENTER' | 'BOTTOM';
  padding?: { left: number; right: number; top: number; bottom: number };
  paragraphs?: string[];
}

interface TableSpec {
  width: number;
  columns: number[];
  rows: CellSpec[][];
  rowHeight: number[];
  pageBreak?: 'CELL' | 'NONE';
  horzAlign?: 'LEFT' | 'RIGHT' | 'CENTER';
  headerRepeat?: boolean;
  floatBottom?: number;
}

const cellWidthAt = (columns: readonly number[], col: number, span = 1): number =>
  columns.slice(col, col + span).reduce((sum, width) => sum + width, 0);

function cellXml(
  ctx: BuildContext,
  cell: CellSpec,
  row: number,
  col: number,
  columns: readonly number[],
  height: number,
): string {
  const padding = cell.padding ?? { left: 2.5, right: 2.5, top: 1.2, bottom: 1.2 };
  const align = cell.align ?? 'LEFT';
  const paragraphs = cell.paragraphs ?? [
    para(ctx, ctx.styles.para({ align, lineSpacing: 120 }), run(cell.charPr, t(cell.text))),
  ];
  const colAddr = cell.colAddr ?? col;
  return `<hp:tc name="" header="${row === 0 ? 1 : 0}" hasMargin="1" protect="0" editable="0" dirty="0" borderFillIDRef="${
    cell.border
  }"><hp:subList id="" textDirection="${cell.textDirection ?? 'HORIZONTAL'}" lineWrap="BREAK" vertAlign="${
    cell.valign ?? 'CENTER'
  }" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">${paragraphs.join(
    '',
  )}</hp:subList><hp:cellAddr colAddr="${colAddr}" rowAddr="${
    cell.rowAddr ?? row
  }"/><hp:cellSpan colSpan="${cell.colSpan ?? 1}" rowSpan="${
    cell.rowSpan ?? 1
  }"/><hp:cellSz width="${mm(
    cellWidthAt(columns, colAddr, cell.colSpan ?? 1),
  )}" height="${mm(cell.heightMm ?? height)}"/><hp:cellMargin left="${mm(
    padding.left,
  )}" right="${mm(padding.right)}" top="${mm(padding.top)}" bottom="${mm(
    padding.bottom,
  )}"/></hp:tc>`;
}

function tableXml(ctx: BuildContext, spec: TableSpec): string {
  const total = spec.columns.reduce((a, b) => a + b, 0);
  const rows = spec.rows
    .map((cells, rowIndex) => {
      const cellsXml = cells
        .map((cell, colIndex) =>
          cellXml(ctx, cell, rowIndex, colIndex, spec.columns, spec.rowHeight[rowIndex] ?? 8),
        )
        .join('');
      return `<hp:tr>${cellsXml}</hp:tr>`;
    })
    .join('');
  const height = spec.rowHeight.reduce((a, b) => a + b, 0);
  const pos = spec.floatBottom
    ? `treatAsChar="0" affectLSpacing="0" flowWithText="0" allowOverlap="1" holdAnchorAndSO="0" vertRelTo="PAPER" horzRelTo="PAPER" vertAlign="BOTTOM" horzAlign="RIGHT" vertOffset="${mm(spec.floatBottom)}" horzOffset="${mm(MARGIN.right)}"`
    : `treatAsChar="0" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="${spec.horzAlign ?? 'LEFT'}" vertOffset="0" horzOffset="0"`;
  return `<hp:tbl id="${ctx.nextId()}" zOrder="0" numberingType="TABLE" textWrap="${
    spec.floatBottom ? 'IN_FRONT_OF_TEXT' : 'TOP_AND_BOTTOM'
  }" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="${
    spec.pageBreak ?? 'CELL'
  }" repeatHeader="${spec.headerRepeat ? 1 : 0}" rowCnt="${spec.rows.length}" colCnt="${
    spec.columns.length
  }" cellSpacing="0" borderFillIDRef="1" noAdjust="0"><hp:sz width="${mm(
    total,
  )}" widthRelTo="ABSOLUTE" height="${mm(
    height,
  )}" heightRelTo="ABSOLUTE" protect="0"/><hp:pos ${pos}/><hp:outMargin left="0" right="0" top="0" bottom="0"/><hp:inMargin left="0" right="0" top="0" bottom="0"/>${rows}</hp:tbl>`;
}

const gridCellChar = (ctx: BuildContext, cell: GridCell, overlay?: GridOverlay): number =>
  ctx.styles.char(overlay?.size ?? cell.size ?? TABLE_SIZE, {
    bold: overlay?.bold ?? cell.bold ?? false,
    color: overlay?.color ?? cell.color ?? COLORS.ink,
  });

function renderRuledBlock(ctx: BuildContext, block: Extract<FormBlock, { kind: 'ruled' }>): string {
  const width = block.width ?? CONTENT_WIDTH;
  const lineColor = block.lineColor ?? COLORS.line;
  const lineWidth = block.lineWidth ?? 0.15;
  const accentColor = block.accentColor ?? COLORS.accent;
  const accentWidth = block.accentWidth ?? lineWidth;
  const normalBorder = ctx.styles.border({
    bottom: { type: 'SOLID', width: lineWidth, color: lineColor },
  });
  const accentBorder = ctx.styles.border({
    bottom: { type: 'SOLID', width: accentWidth, color: accentColor },
  });
  const emptyBorder = ctx.styles.border({});
  const emptyChar = ctx.styles.char(1);
  const emptyParagraph = (): string =>
    para(ctx, ctx.styles.para({ lineSpacing: 1, before: 0, after: 0 }), run(emptyChar, t('')));
  const rows: CellSpec[][] = [];
  const rowHeight: number[] = [];
  const addRow = (height: number, border: number): void => {
    rows.push([
      {
        text: '',
        charPr: emptyChar,
        border,
        heightMm: height,
        valign: 'TOP',
        padding: { left: 0, right: 0, top: 0, bottom: 0 },
        paragraphs: [emptyParagraph()],
      },
    ]);
    rowHeight.push(height);
  };

  for (let group = 0; group < block.groups; group += 1) {
    for (let line = 0; line < block.lines; line += 1) {
      addRow(block.lineGap, block.accentLine === line ? accentBorder : normalBorder);
    }
    if (group < block.groups - 1) addRow(block.groupGap, emptyBorder);
  }
  if (rows.length === 0) return '';

  const table = tableXml(ctx, {
    width,
    columns: [width],
    rows,
    rowHeight,
    pageBreak: 'NONE',
    horzAlign: width < CONTENT_WIDTH - 0.1 ? 'CENTER' : 'LEFT',
  });
  const before = block.gapBefore ? gapBefore(ctx, block.gapBefore) : '';
  return `${before}${para(
    ctx,
    ctx.styles.para({ lineSpacing: 1, before: 0, after: 0 }),
    run(ctx.styles.char(1), table),
  )}`;
}

function renderGridBlock(ctx: BuildContext, block: Extract<FormBlock, { kind: 'grid' }>): string {
  const rows =
    typeof block.rows === 'function' ? block.rows(ctx.values, ctx.rows, ctx.mode) : block.rows;
  if (rows.length === 0 || block.columns.length === 0) return '';

  const columns = [...block.columns];
  const rowHeight = rows.map((row) => row.height);
  const totalWidth = columns.reduce((sum, width) => sum + width, 0);
  const lineColor = block.lineColor ?? COLORS.line;
  const lineWidth = block.lineWidth ?? 0.15;
  const border = ctx.styles.border({
    left: { type: 'SOLID', width: lineWidth, color: lineColor },
    right: { type: 'SOLID', width: lineWidth, color: lineColor },
    top: { type: 'SOLID', width: lineWidth, color: lineColor },
    bottom: { type: 'SOLID', width: lineWidth, color: lineColor },
  });

  const overlays =
    typeof block.overlays === 'function'
      ? block.overlays(ctx.values, ctx.rows, ctx.mode)
      : (block.overlays ?? []);

  const occupied = rows.map(() => new Array<boolean>(columns.length).fill(false));
  const columnX: number[] = [];
  let cursor = 0;
  for (const width of columns) {
    columnX.push(cursor);
    cursor += width;
  }

  const cellSpecs: CellSpec[][] = [];
  let y = 0;
  rows.forEach((row, rowIndex) => {
    const specs: CellSpec[] = [];
    let column = 0;
    for (const cell of row.cells) {
      while (column < columns.length && occupied[rowIndex]?.[column]) column += 1;
      if (column >= columns.length) break;
      const colSpan = Math.max(1, Math.min(cell.colSpan ?? 1, columns.length - column));
      const rowSpan = Math.max(1, Math.min(cell.rowSpan ?? 1, rows.length - rowIndex));
      for (let r = rowIndex; r < rowIndex + rowSpan; r += 1) {
        const occupancy = occupied[r];
        for (let c = column; c < column + colSpan && occupancy; c += 1) occupancy[c] = true;
      }

      const cellX = columnX[column] ?? 0;
      const cellWidth = columns
        .slice(column, column + colSpan)
        .reduce((sum, width) => sum + width, 0);
      const cellHeight = rowHeight
        .slice(rowIndex, rowIndex + rowSpan)
        .reduce((sum, height) => sum + height, 0);
      const baseText = cell.field ? fieldValue(ctx, cell.field) : (cell.text ?? '');
      const innerOverlays = overlays
        .filter(
          (overlay) =>
            overlay.x >= cellX - 0.01 &&
            overlay.x <= cellX + cellWidth + 0.01 &&
            overlay.y >= y - 0.01 &&
            overlay.y <= y + cellHeight + 0.01,
        )
        .sort((a, b) => a.y - b.y || a.x - b.x);

      const parts: Array<{ text: string; align: Align; size: number; charPr: number }> = [];
      if (baseText) {
        parts.push({
          text: baseText,
          align: lineAlign(cell.align),
          size: cell.size ?? TABLE_SIZE,
          charPr: gridCellChar(ctx, cell),
        });
      }
      for (const overlay of innerOverlays) {
        const text = overlay.field ? fieldValue(ctx, overlay.field) : (overlay.text ?? '');
        if (!text) continue;
        parts.push({
          text,
          align: lineAlign(overlay.align ?? cell.align),
          size: overlay.size ?? cell.size ?? TABLE_SIZE,
          charPr: gridCellChar(ctx, cell, overlay),
        });
      }

      const paragraphs = parts.length
        ? parts.map((part) =>
            para(
              ctx,
              ctx.styles.para({ align: part.align, lineSpacing: 110 }),
              run(part.charPr, t(part.text)),
            ),
          )
        : [
            para(
              ctx,
              ctx.styles.para({ align: 'CENTER', lineSpacing: 110 }),
              run(gridCellChar(ctx, cell), t('')),
            ),
          ];

      specs.push({
        text: baseText,
        charPr: gridCellChar(ctx, cell),
        border,
        colSpan,
        rowSpan,
        colAddr: column,
        rowAddr: rowIndex,
        heightMm: cellHeight,
        textDirection: cell.vertical ? 'VERTICAL' : 'HORIZONTAL',
        valign: cell.valign === 'top' ? 'TOP' : cell.valign === 'bottom' ? 'BOTTOM' : 'CENTER',
        align: lineAlign(cell.align),
        padding: { left: cell.padding ?? 1.2, right: cell.padding ?? 1.2, top: 0.6, bottom: 0.6 },
        paragraphs,
      });
      column += colSpan;
    }
    cellSpecs.push(specs);
    y += row.height;
  });

  const table = tableXml(ctx, {
    width: totalWidth,
    columns,
    rows: cellSpecs,
    rowHeight,
    pageBreak: 'NONE',
    horzAlign: (block.x ?? 0) > 0 ? 'CENTER' : 'LEFT',
  });
  const before = block.gapBefore ? gapBefore(ctx, block.gapBefore) : '';
  return `${before}${para(
    ctx,
    ctx.styles.para({ lineSpacing: 1, before: 0, after: 0 }),
    run(ctx.styles.char(1), table),
  )}`;
}

const gapBefore = (ctx: BuildContext, height: number): string =>
  para(ctx, ctx.styles.para({ lineSpacing: 100, before: height }), run(ctx.styles.char(1), t('')));

const tablePara = (ctx: BuildContext, spec: TableSpec, pageBreak = false, before = 0): string =>
  para(
    ctx,
    ctx.styles.para({ lineSpacing: 100, before, after: spec.floatBottom ? 0 : 2.5 }),
    run(ctx.styles.char(BODY), tableXml(ctx, spec)),
    pageBreak,
  );

function kvStops(columns: number): TabStop[] {
  const cellWidth = CONTENT_WIDTH / columns;
  const stops: TabStop[] = [];
  for (let index = 0; index < columns; index += 1) {
    if (index === columns - 1) {
      stops.push({ pos: CONTENT_WIDTH, type: 'RIGHT', leader: 'DOT' });
    } else {
      stops.push({ pos: cellWidth * (index + 1) - 4, type: 'RIGHT', leader: 'DOT' });
      stops.push({ pos: cellWidth * (index + 1) + 0.5, type: 'LEFT', leader: 'NONE' });
    }
  }
  return stops;
}

function renderKv(ctx: BuildContext, block: Extract<FormBlock, { kind: 'kv' }>): string {
  if (ctx.mode === 'blank' && block.hideInBlank) return '';
  const tabPr = ctx.styles.tabs(kvStops(block.columns));
  const paraPr = ctx.styles.para({ lineSpacing: 120, before: 0.6, after: 0.6, tab: tabPr });
  const tail = para(
    ctx,
    ctx.styles.para({ lineSpacing: 100, after: 1.2 }),
    run(ctx.styles.char(BODY), t('')),
  );
  const labelChar = ctx.styles.char(LABEL, { color: COLORS.muted });
  const valueChar = ctx.styles.char(BODY);
  const chunks: string[] = [];

  for (let start = 0; start < block.rows.length; start += block.columns) {
    const rows = block.rows.slice(start, start + block.columns);
    let runs = '';
    rows.forEach((row, index) => {
      if (index > 0) runs += run(labelChar, t('\t'));
      runs += run(labelChar, t(row.label));
      runs += run(labelChar, t('\t'));
      const value = cutText(fieldValue(ctx, row.field, row.value), 90);
      if (value) runs += run(valueChar, t(value));
    });
    chunks.push(para(ctx, paraPr, runs));
  }
  return chunks.join('') + tail;
}

function renderSectionBlock(
  ctx: BuildContext,
  block: Extract<FormBlock, { kind: 'section' }>,
  pageBreak = false,
): string {
  if (ctx.mode === 'blank' && block.hideInBlank) return '';
  const paraPr = ctx.styles.para({
    lineSpacing: 120,
    before: 4.5,
    after: 1.5,
    keepWithNext: true,
  });
  const marker = ctx.styles.char(11, { bold: true, color: COLORS.accent });
  const title = ctx.styles.char(11, { bold: true });
  const note = ctx.styles.char(SMALL, { color: COLORS.muted });
  let runs = run(marker, t('■ ')) + run(title, t(block.title));
  if (block.note) runs += run(note, t(`  ${block.note}`));
  return para(ctx, paraPr, runs, pageBreak);
}

function renderHeader(ctx: BuildContext, block: Extract<FormBlock, { kind: 'header' }>): string {
  const title = fieldValue(ctx, block.titleField) || block.title;
  const docNo = fieldValue(ctx, block.docNoField);
  const date = fieldValue(ctx, block.dateField);
  const docNoText = docNo
    ? `${block.docNoLabel ?? '문서번호'} ${docNo}`
    : (block.docNoLabel ?? '문서번호');
  const dateText = date ? `${block.dateLabel ?? '작성일'} ${date}` : (block.dateLabel ?? '작성일');

  const docChar = ctx.styles.char(TABLE_SIZE, { color: COLORS.muted });
  const dateChar = ctx.styles.char(LABEL, { color: COLORS.muted });
  const logo =
    block.logo && ctx.assets?.logo
      ? para(
          ctx,
          ctx.styles.para({ lineSpacing: 100, after: 1 }),
          run(ctx.styles.char(BODY), imageInline(ctx, ctx.assets.logo, 30, 8)),
        )
      : '';
  const rule = para(
    ctx,
    ctx.styles.para({
      lineSpacing: 100,
      before: 2.4,
      after: 3.6,
      border: ctx.styles.border({ bottom: HAIRLINE }),
    }),
    run(docChar, t('')),
  );

  if (block.variant === 'editorial') {
    const titleChar = ctx.styles.char(18, { bold: true });
    const titlePr = ctx.styles.para({
      lineSpacing: 120,
      tab: ctx.styles.tabs([{ pos: CONTENT_WIDTH - 5.2, type: 'RIGHT', leader: 'NONE' }]),
    });
    const docPr = ctx.styles.para({ lineSpacing: 110, after: 0.4 });
    const hidden = isDocNoHidden(ctx.values);
    // 문서번호를 숨기면 그 줄을 빼고 제목을 키워 강조 막대 높이를 채운다(PDF와 같은 배치).
    const inner = hidden
      ? [
          para(
            ctx,
            titlePr,
            run(ctx.styles.char(22, { bold: true }), t(title)) + run(dateChar, t(`\t${dateText}`)),
          ),
        ]
      : [
          para(ctx, docPr, run(docChar, t(docNoText))),
          para(ctx, titlePr, run(titleChar, t(title)) + run(dateChar, t(`\t${dateText}`))),
        ];
    return (
      logo +
      tablePara(ctx, {
        width: CONTENT_WIDTH,
        columns: [1.2, CONTENT_WIDTH - 1.2],
        rowHeight: [11],
        rows: [
          [
            {
              text: '',
              charPr: docChar,
              border: ctx.styles.border({ fill: COLORS.accent }),
              padding: { left: 0, right: 0, top: 0.2, bottom: 0.6 },
              valign: 'TOP',
            },
            {
              text: '',
              charPr: docChar,
              border: ctx.styles.border({}),
              padding: { left: 3, right: 0, top: 0.2, bottom: 0.6 },
              paragraphs: inner,
              valign: hidden ? 'BOTTOM' : 'TOP',
            },
          ],
        ],
      }) +
      rule
    );
  }

  const titleChar = ctx.styles.char(22, { bold: true });
  return (
    para(
      ctx,
      ctx.styles.para({ align: 'CENTER', lineSpacing: 120, after: 2 }),
      run(titleChar, t(title)),
    ) +
    para(
      ctx,
      ctx.styles.para({
        lineSpacing: 120,
        before: 1.5,
        after: 0.5,
        tab: ctx.styles.tabs([{ pos: CONTENT_WIDTH, type: 'RIGHT', leader: 'NONE' }]),
      }),
      run(docChar, t(isDocNoHidden(ctx.values) ? '' : docNoText)) +
        run(dateChar, t(`\t${dateText}`)),
    ) +
    rule
  );
}

function renderTextBlock(ctx: BuildContext, block: Extract<FormBlock, { kind: 'text' }>): string {
  const value = fieldValue(ctx, block.field).trim();
  const minimum = block.minLines ?? 3;
  const bodyChar = ctx.styles.char(BODY);
  const paragraphs: string[] = [];
  const label = block.label
    ? para(
        ctx,
        ctx.styles.para({ lineSpacing: 120, before: 3, after: 1 }),
        run(ctx.styles.char(BODY, { bold: true }), t(block.label)),
      )
    : '';
  const lines = value ? value.split(/\r?\n/) : [];
  const linePr = ctx.styles.para({ lineSpacing: 150 });
  // 빈 양식은 손으로 쓸 수 있도록 점선 줄을 넣는다.
  const ruledPr = ctx.styles.para({
    lineSpacing: 150,
    border: ctx.styles.border({ bottom: { type: 'DOT', width: 0.25, color: COLORS.line } }),
  });
  if (lines.length === 0) {
    for (let index = 0; index < minimum; index += 1) {
      paragraphs.push(para(ctx, ruledPr, run(bodyChar, t(''))));
    }
  } else {
    for (const line of lines) paragraphs.push(para(ctx, linePr, run(bodyChar, t(line))));
    for (let index = lines.length; index < Math.max(minimum, 1); index += 1) {
      paragraphs.push(para(ctx, linePr, run(bodyChar, t(''))));
    }
  }
  return (
    (label || gapBefore(ctx, 2)) +
    tablePara(ctx, {
      width: CONTENT_WIDTH,
      columns: [CONTENT_WIDTH],
      rowHeight: [Math.max(12, minimum * 5.2 + 4)],
      rows: [
        [
          {
            text: '',
            charPr: bodyChar,
            border: ctx.styles.border({
              left: BOX_LINE,
              right: BOX_LINE,
              top: BOX_LINE,
              bottom: BOX_LINE,
            }),
            padding: { left: 3, right: 3, top: 2.4, bottom: 2.4 },
            paragraphs,
            valign: 'TOP',
          },
        ],
      ],
    })
  );
}

function renderTableBlock(ctx: BuildContext, block: Extract<FormBlock, { kind: 'table' }>): string {
  const requested = block.columnCountField
    ? Number(ctx.values[block.columnCountField])
    : Number.NaN;
  const limit = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), 1), block.columns.length)
    : block.columns.length;
  const columns = block.columns.slice(0, limit);
  const sourceRows =
    ctx.mode === 'blank'
      ? []
      : typeof block.rows === 'function'
        ? block.rows(ctx.values, ctx.rows)
        : block.rows;
  const minRows = ctx.mode === 'blank' && block.blankMinRows ? block.blankMinRows : block.minRows;
  const rows: (readonly string[])[] =
    minRows && sourceRows.length < minRows
      ? [...sourceRows, ...Array.from({ length: minRows - sourceRows.length }, () => [])]
      : [...sourceRows];

  const totalWidth = columns.reduce((sum, column) => sum + column.width, 0) || 1;
  const widths = columns.map((column) => (column.width / totalWidth) * CONTENT_WIDTH);
  const headerChar = ctx.styles.char(TABLE_SIZE, { bold: true, color: COLORS.muted });
  const bodyChar = ctx.styles.char(TABLE_SIZE);
  const headerBorder = ctx.styles.border({
    top: HAIRLINE,
    bottom: HAIRLINE,
    fill: COLORS.fill,
  });
  const rowBorder = ctx.styles.border({ bottom: HAIRLINE });
  const gridBorder = ctx.styles.border({
    left: HAIRLINE,
    right: HAIRLINE,
    top: HAIRLINE,
    bottom: HAIRLINE,
  });

  const headerRow: CellSpec[] = columns.map((column, index) => {
    const widthMm = widths[index] ?? CONTENT_WIDTH;
    const narrow = widthMm < 14;
    return {
      text: cutText(column.labelField ? fieldValue(ctx, column.labelField) : column.label, 24),
      charPr: narrow
        ? ctx.styles.char(7.5, { bold: true, color: COLORS.muted })
        : widthMm < 20
          ? ctx.styles.char(8, { bold: true, color: COLORS.muted })
          : headerChar,
      align: lineAlign(column.align),
      border: headerBorder,
      padding: narrow ? { left: 1, right: 1, top: 1.2, bottom: 1.2 } : undefined,
    };
  });

  const bodyRows = rows.map((row) =>
    columns.map((column, index) => {
      const raw = (row[index] ?? '').trim();
      if (column.checkbox) {
        return {
          text: raw ? '☑' : '□',
          charPr: ctx.styles.char(TABLE_SIZE + 0.5, {
            color: raw ? COLORS.accent : COLORS.ink,
          }),
          align: 'CENTER' as Align,
          border: block.grid ? gridBorder : rowBorder,
          padding: { left: 1, right: 1, top: 1, bottom: 1 },
        };
      }
      return {
        text: raw ? cutText(raw, 40) : '',
        charPr: bodyChar,
        align: lineAlign(column.align),
        border: block.grid ? gridBorder : rowBorder,
      };
    }),
  );

  return (
    gapBefore(ctx, 2) +
    tablePara(ctx, {
      width: CONTENT_WIDTH,
      columns: widths,
      rows: [headerRow, ...bodyRows],
      rowHeight: [8, ...bodyRows.map(() => 8)],
      headerRepeat: true,
    })
  );
}

function renderTotals(ctx: BuildContext, block: Extract<FormBlock, { kind: 'totals' }>): string {
  const width = block.width ?? 72;
  const padding = 2.5;
  const normalChar = ctx.styles.char(TABLE_SIZE, { color: COLORS.muted });
  const strongChar = ctx.styles.char(BODY, { bold: true });
  const valueChar = ctx.styles.char(TABLE_SIZE);
  const rows: CellSpec[][] = block.rows.map((row, index) => {
    const strong = Boolean(row.strong);
    const border =
      index === 0
        ? ctx.styles.border({ top: ACCENT_LINE })
        : strong
          ? ctx.styles.border({ top: HAIRLINE })
          : ctx.styles.border({});
    const value = fieldValue(ctx, row.field, row.value);
    const linePr = ctx.styles.para({
      lineSpacing: 120,
      tab: ctx.styles.tabs([{ pos: width - padding * 2, type: 'RIGHT', leader: 'NONE' }]),
    });
    const cellParagraph = para(
      ctx,
      linePr,
      run(strong ? strongChar : normalChar, t(row.label)) +
        (value ? run(strong ? strongChar : valueChar, t(`\t${value}`)) : ''),
    );
    return [
      {
        text: '',
        charPr: normalChar,
        border: ctx.styles.border({}),
        padding: { left: 0, right: 0, top: 0, bottom: 0 },
      },
      {
        text: '',
        charPr: strong ? strongChar : normalChar,
        border,
        padding: { left: padding, right: padding, top: 0, bottom: 0 },
        paragraphs: [cellParagraph],
      },
    ];
  });

  return (
    gapBefore(ctx, 3) +
    tablePara(ctx, {
      width: CONTENT_WIDTH,
      columns: [CONTENT_WIDTH - width, width],
      rows,
      rowHeight: block.rows.map(() => 8),
    })
  );
}

function renderChecklist(
  ctx: BuildContext,
  block: Extract<FormBlock, { kind: 'checklist' }>,
): string {
  const items = block.field
    ? (ctx.mode === 'blank' ? '' : (ctx.values[block.field] ?? ''))
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
    : [...(block.items ?? [])];
  const resolved =
    items.length === 0 && block.field && ctx.mode === 'blank' ? ['', '', '', ''] : items;
  if (resolved.length === 0) return '';
  const columns = block.columns ?? 1;
  const rows: CellSpec[][] = [];
  const rowCount = Math.ceil(resolved.length / columns);
  for (let row = 0; row < rowCount; row += 1) {
    const cells: CellSpec[] = [];
    for (let col = 0; col < columns; col += 1) {
      const item = resolved[row * columns + col] ?? '';
      cells.push({
        text: item ? `□  ${item}` : '',
        charPr: ctx.styles.char(BODY),
        border: ctx.styles.border({}),
        padding: { left: 0, right: 3, top: 0.6, bottom: 0.6 },
      });
    }
    rows.push(cells);
  }
  return (
    gapBefore(ctx, 1.5) +
    tablePara(ctx, {
      width: CONTENT_WIDTH,
      columns: Array.from({ length: columns }, () => CONTENT_WIDTH / columns),
      rows,
      rowHeight: rows.map(() => 6.5),
    })
  );
}

function renderLabelGrid(
  ctx: BuildContext,
  block: Extract<FormBlock, { kind: 'labelGrid' }>,
): string {
  const slots = ctx.mode === 'blank' ? [] : block.slots(ctx.values, ctx.rows);
  const columns = block.columns;
  const border = ctx.styles.border({
    left: HAIRLINE,
    right: HAIRLINE,
    top: HAIRLINE,
    bottom: HAIRLINE,
  });
  const eyebrowChar = ctx.styles.char(7, { bold: true, color: COLORS.accent });
  const titleChar = ctx.styles.char(12, { bold: true });
  const subtitleChar = ctx.styles.char(8, { color: COLORS.muted });
  const lineChar = ctx.styles.char(9);
  const noteChar = ctx.styles.char(7.5, { color: COLORS.muted });
  const tagChar = ctx.styles.char(8.5, { bold: true, color: COLORS.accent });
  const rows: CellSpec[][] = [];
  for (let row = 0; row < block.rows; row += 1) {
    const cells: CellSpec[] = [];
    for (let column = 0; column < columns; column += 1) {
      const baseSlot = slots[row * columns + column];
      const slot =
        ctx.mode === 'blank' &&
        (!baseSlot || (block.design && block.design !== 'plain' && !(baseSlot.lines?.length ?? 0)))
          ? defaultLabelSlot(block.design)
          : baseSlot;
      const paragraphs: string[] = [];
      if (slot?.eyebrow) {
        paragraphs.push(
          para(
            ctx,
            ctx.styles.para({ align: 'CENTER', lineSpacing: 120, before: 0, after: 0.5 }),
            run(eyebrowChar, t(slot.eyebrow)),
          ),
        );
      }
      if (slot?.title) {
        paragraphs.push(
          para(
            ctx,
            ctx.styles.para({ align: 'CENTER', lineSpacing: 120, before: 0, after: 0.5 }),
            run(titleChar, t(slot.title)),
          ),
        );
      }
      if (slot?.subtitle) {
        paragraphs.push(
          para(
            ctx,
            ctx.styles.para({ align: 'CENTER', lineSpacing: 120, before: 0, after: 0.5 }),
            run(subtitleChar, t(slot.subtitle)),
          ),
        );
      }
      for (const line of slot?.lines ?? []) {
        if (!line.trim()) continue;
        paragraphs.push(
          para(
            ctx,
            ctx.styles.para({ align: 'CENTER', lineSpacing: 120, before: 0, after: 0.2 }),
            run(lineChar, t(line)),
          ),
        );
      }
      if (slot?.note) {
        paragraphs.push(
          para(
            ctx,
            ctx.styles.para({ align: 'CENTER', lineSpacing: 120, before: 1, after: 0 }),
            run(noteChar, t(slot.note)),
          ),
        );
      }
      if (slot?.tag) {
        paragraphs.push(
          para(
            ctx,
            ctx.styles.para({ align: 'CENTER', lineSpacing: 120, before: 1, after: 0 }),
            run(tagChar, t(slot.tag)),
          ),
        );
      }
      cells.push({
        text: '',
        charPr: lineChar,
        border,
        padding: { left: 3, right: 3, top: 2, bottom: 2 },
        paragraphs,
      });
    }
    rows.push(cells);
  }
  return tablePara(ctx, {
    width: CONTENT_WIDTH,
    columns: Array.from({ length: columns }, () => CONTENT_WIDTH / columns),
    rows,
    rowHeight: rows.map(() => block.rowHeight ?? 42),
    pageBreak: 'NONE',
  });
}

function renderSignature(
  ctx: BuildContext,
  block: Extract<FormBlock, { kind: 'signature' }>,
): string {
  const rawRoles = block.rolesField ? (ctx.values[block.rolesField] ?? '') : '';
  const roles = rawRoles.trim() ? parseRoles(rawRoles) : [...(block.roles ?? [])];
  if (roles.length === 0) return '';
  const columns = roles.length;
  const cellWidth = Math.min(36, CONTENT_WIDTH / columns);
  const width = cellWidth * columns;
  const border = ctx.styles.border({
    left: BOX_LINE,
    right: BOX_LINE,
    top: BOX_LINE,
    bottom: BOX_LINE,
  });
  const labelChar = ctx.styles.char(LABEL, { color: COLORS.muted });
  const cellParagraphs = (label: string): string[] => [
    para(
      ctx,
      ctx.styles.para({ align: 'CENTER', lineSpacing: 120, before: 1.6 }),
      run(labelChar, t(label)),
    ),
    para(
      ctx,
      ctx.styles.para({ align: 'CENTER', lineSpacing: 120, before: 7 }),
      run(labelChar, t('(서명)')),
    ),
  ];
  const rows: CellSpec[][] = [];
  if (block.formal) {
    rows.push([
      {
        text: '결재',
        charPr: ctx.styles.char(LABEL, { bold: true, color: COLORS.muted }),
        align: 'CENTER',
        border,
        colSpan: columns,
        padding: { left: 1, right: 1, top: 1, bottom: 1 },
        paragraphs: [
          para(
            ctx,
            ctx.styles.para({
              align: 'CENTER',
              lineSpacing: 120,
              border: ctx.styles.border({ fill: COLORS.fill }),
            }),
            run(ctx.styles.char(LABEL, { bold: true, color: COLORS.muted }), t('결재')),
          ),
        ],
      },
    ]);
  }
  rows.push(
    roles.map((role) => ({
      text: '',
      charPr: labelChar,
      border,
      padding: { left: 1, right: 1, top: 1.6, bottom: 1.6 },
      paragraphs: cellParagraphs(role),
      valign: 'TOP' as const,
    })),
  );
  const emptyWidth = CONTENT_WIDTH - width;
  const withSpacer = emptyWidth > 0.5;
  const paddedRows = rows.map((cells) => {
    if (!withSpacer) return cells;
    const spacer: CellSpec = {
      text: '',
      charPr: labelChar,
      border: ctx.styles.border({}),
      padding: { left: 0, right: 0, top: 0, bottom: 0 },
    };
    return [spacer, ...cells];
  });
  return (
    (block.bottom ? '' : gapBefore(ctx, 3)) +
    tablePara(ctx, {
      width: CONTENT_WIDTH,
      columns: withSpacer
        ? [emptyWidth, ...Array.from({ length: columns }, () => cellWidth)]
        : Array.from({ length: columns }, () => cellWidth),
      rows: paddedRows,
      rowHeight: block.formal ? [6, 22] : [22],
      floatBottom: block.bottom ? 20 : undefined,
    })
  );
}

function renderParties(ctx: BuildContext, block: Extract<FormBlock, { kind: 'parties' }>): string {
  const values = ctx.mode === 'blank' ? {} : ctx.values;
  const lines = (box: {
    lines: readonly string[] | ((values: FormValues) => readonly string[]);
  }): readonly string[] => (typeof box.lines === 'function' ? box.lines(values) : box.lines);
  const border = ctx.styles.border({
    left: BOX_LINE,
    right: BOX_LINE,
    top: BOX_LINE,
    bottom: BOX_LINE,
  });
  const labelChar = ctx.styles.char(LABEL, { color: COLORS.muted });
  const bodyChar = ctx.styles.char(TABLE_SIZE);
  const boxParagraphs = (label: string, list: readonly string[]): string[] => {
    const paragraphs = [
      para(ctx, ctx.styles.para({ lineSpacing: 120, after: 1 }), run(labelChar, t(label))),
    ];
    for (const line of list
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6)) {
      paragraphs.push(
        para(ctx, ctx.styles.para({ lineSpacing: 130 }), run(bodyChar, t(cutText(line, 46)))),
      );
    }
    return paragraphs;
  };
  return (
    gapBefore(ctx, 2) +
    tablePara(ctx, {
      width: CONTENT_WIDTH,
      columns: [85, 4, 85],
      rows: [
        [
          {
            text: '',
            charPr: labelChar,
            border,
            padding: { left: 4, right: 4, top: 2.4, bottom: 3 },
            paragraphs: boxParagraphs(block.left.label, lines(block.left)),
            valign: 'TOP',
          },
          {
            text: '',
            charPr: labelChar,
            border: ctx.styles.border({}),
            padding: { left: 0, right: 0, top: 0, bottom: 0 },
          },
          {
            text: '',
            charPr: labelChar,
            border,
            padding: { left: 4, right: 4, top: 2.4, bottom: 3 },
            paragraphs: boxParagraphs(block.right.label, lines(block.right)),
            valign: 'TOP',
          },
        ],
      ],
      rowHeight: [36],
    })
  );
}

function renderIssuer(ctx: BuildContext, block: Extract<FormBlock, { kind: 'issuer' }>): string {
  const dateValue =
    block.dateField && ctx.mode !== 'blank' ? (ctx.values[block.dateField] ?? '').trim() : '';
  const dateMeta = block.dateField
    ? ctx.template.fields.find((field) => field.id === block.dateField)
    : undefined;
  const date = dateValue && dateMeta?.type === 'date' ? formatDateKorean(dateValue) : dateValue;
  const company = fieldValue(ctx, block.companyField);
  const ceo = fieldValue(ctx, block.ceoField);
  const blank = ctx.mode === 'blank';
  const align = (block.align ?? 'center') === 'right' ? 'RIGHT' : 'CENTER';
  const dateChar = ctx.styles.char(TABLE_SIZE, { color: COLORS.muted });
  const companyChar = ctx.styles.char(10.5, { bold: true });
  const ceoChar = ctx.styles.char(TABLE_SIZE, { color: COLORS.muted });
  const spells = [
    date ? para(ctx, ctx.styles.para({ align, lineSpacing: 130 }), run(dateChar, t(date))) : '',
    para(
      ctx,
      ctx.styles.para({ align, lineSpacing: 130, before: 1 }),
      run(companyChar, t(blank ? '' : company)),
    ),
    para(
      ctx,
      ctx.styles.para({ align, lineSpacing: 130, before: 0.6 }),
      run(ceoChar, t(blank ? '' : ceo ? `대표이사 ${ceo}` : '')) +
        (block.seal && ctx.assets?.seal && !blank
          ? run(ctx.styles.char(BODY), imageInline(ctx, ctx.assets.seal, 13, 13))
          : ''),
    ),
  ].filter(Boolean);
  if (block.before) {
    spells.unshift(
      para(ctx, ctx.styles.para({ lineSpacing: 100, before: block.before }), run(dateChar, t(''))),
    );
  }
  if (block.after) {
    spells.push(
      para(ctx, ctx.styles.para({ lineSpacing: 100, after: block.after }), run(dateChar, t(''))),
    );
  }
  if (block.bottom) {
    return tablePara(ctx, {
      width: CONTENT_WIDTH,
      columns: [CONTENT_WIDTH],
      rowHeight: [22],
      floatBottom: 20,
      rows: [
        [
          {
            text: '',
            charPr: dateChar,
            border: ctx.styles.border({}),
            padding: { left: 0, right: 0, top: 0, bottom: 0 },
            paragraphs: spells,
            valign: 'BOTTOM',
          },
        ],
      ],
    });
  }
  return spells.join('');
}

function renderDivider(ctx: BuildContext, block: Extract<FormBlock, { kind: 'divider' }>): string {
  const width = block.width ?? 30;
  const side = (CONTENT_WIDTH - width) / 2;
  const lineBorder = ctx.styles.border({
    top: {
      type: 'SOLID',
      width: block.thickness ?? 0.5,
      color: block.color ?? COLORS.accent,
    },
  });
  const empty: CellSpec = {
    text: '',
    charPr: ctx.styles.char(1),
    border: ctx.styles.border({}),
    padding: { left: 0, right: 0, top: 0, bottom: 0 },
  };
  return tablePara(ctx, {
    width: CONTENT_WIDTH,
    columns: [side, width, side],
    rowHeight: [1],
    rows: [
      [
        empty,
        {
          ...empty,
          border: lineBorder,
        },
        empty,
      ],
    ],
  });
}

function renderParagraph(
  ctx: BuildContext,
  block: Extract<FormBlock, { kind: 'paragraph' }>,
): string {
  const size = block.size ?? BODY;
  const weight = Boolean(block.bold);
  const color = block.color ?? COLORS.ink;
  const align = lineAlign(block.align);
  const value = (block.field ? fieldValue(ctx, block.field) : (block.text ?? '')).trim();
  if (!value && ctx.mode === 'blank' && block.field && block.blankLine) {
    const width = block.blankLine;
    const inset =
      align === 'CENTER'
        ? (CONTENT_WIDTH - width) / 2
        : align === 'RIGHT'
          ? CONTENT_WIDTH - width
          : 0;
    return para(
      ctx,
      ctx.styles.para({
        lineSpacing: 100,
        before: block.before ?? 0,
        after: block.after ?? 0,
        left: inset,
        right: CONTENT_WIDTH - width - inset,
        border: ctx.styles.border({
          bottom: { type: 'DOT', width: 0.25, color: COLORS.line },
        }),
      }),
      run(ctx.styles.char(size, { bold: weight, color }), t('')),
    );
  }
  if (!value) return '';
  return para(
    ctx,
    ctx.styles.para({
      align,
      lineSpacing: 160,
      before: block.before ?? 0,
      after: block.after ?? 0,
    }),
    run(ctx.styles.char(size, { bold: weight, color }), t(value)),
  );
}

function renderNotice(ctx: BuildContext, text: string): string {
  return para(
    ctx,
    ctx.styles.para({
      lineSpacing: 140,
      before: 3,
      after: 3,
      border: ctx.styles.border({ top: HAIRLINE }),
    }),
    run(ctx.styles.char(SMALL, { color: COLORS.muted }), t(text)),
  );
}

function frameRects(ctx: BuildContext): string {
  const frame = ctx.template.frame;
  if (!frame) return '';
  const inset = frame.inset ?? 12;
  const gap = frame.gap ?? 3;
  const outer = {
    x: inset,
    y: inset,
    w: PAPER.width - inset * 2,
    h: PAPER.height - inset * 2,
    color: frame.color ?? COLORS.accent,
    width: 0.5,
  };
  const inner = {
    x: inset + gap,
    y: inset + gap,
    w: PAPER.width - (inset + gap) * 2,
    h: PAPER.height - (inset + gap) * 2,
    color: COLORS.line,
    width: 0.2,
  };
  const rect = (shape: typeof outer): string => {
    const w = mm(shape.w);
    const h = mm(shape.h);
    const id = ctx.nextId();
    return `<hp:rect id="${id}" zOrder="1" numberingType="NONE" textWrap="BEHIND_TEXT" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="${id}" ratio="0"><hp:offset x="0" y="0"/><hp:orgSz width="${w}" height="${h}"/><hp:curSz width="${w}" height="${h}"/><hp:flip horizontal="0" vertical="0"/><hp:rotationInfo angle="0" centerX="${Math.round(w / 2)}" centerY="${Math.round(h / 2)}" rotateimage="0"/><hp:renderingInfo><hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:scaMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/></hp:renderingInfo><hp:lineShape color="${shape.color}" width="${shape.width} mm" style="SOLID" endCap="ROUND" headStyle="NORMAL" tailStyle="NORMAL" headfill="0" tailfill="0" headSz="SMALL_SMALL" tailSz="SMALL_SMALL" outlineStyle="NORMAL" alpha="0"/><hc:fillBrush><hc:winBrush faceColor="none" hatchColor="#000000" alpha="0"/></hc:fillBrush><hc:pt0 x="0" y="0"/><hc:pt1 x="${w}" y="0"/><hc:pt2 x="${w}" y="${h}"/><hc:pt3 x="0" y="${h}"/><hp:sz width="${w}" widthRelTo="ABSOLUTE" height="${h}" heightRelTo="ABSOLUTE" protect="0"/><hp:pos treatAsChar="0" affectLSpacing="0" flowWithText="0" allowOverlap="1" holdAnchorAndSO="0" vertRelTo="PAPER" horzRelTo="PAPER" vertAlign="TOP" horzAlign="LEFT" vertOffset="${mm(shape.y)}" horzOffset="${mm(shape.x)}"/><hp:outMargin left="0" right="0" top="0" bottom="0"/></hp:rect>`;
  };
  return rect(outer) + rect(inner);
}

function runningHeader(ctx: BuildContext): string {
  const block = ctx.blocks.find(
    (item): item is Extract<FormBlock, { kind: 'header' }> => item.kind === 'header',
  );
  if (!block) return '';
  const title = fieldValue(ctx, block.titleField) || block.title;
  const docNo = isDocNoHidden(ctx.values) ? '' : fieldValue(ctx, block.docNoField);
  const titleChar = ctx.styles.char(9, { bold: true });
  const docChar = ctx.styles.char(LABEL, { color: COLORS.muted });
  const paraPr = ctx.styles.para({
    lineSpacing: 120,
    after: 3,
    tab: ctx.styles.tabs([{ pos: CONTENT_WIDTH, type: 'RIGHT', leader: 'NONE' }]),
    border: ctx.styles.border({ bottom: HAIRLINE }),
  });
  const paragraph = para(
    ctx,
    paraPr,
    run(titleChar, t(title)) + (docNo ? run(docChar, t(`\t${docNo}`)) : ''),
  );
  return `<hp:ctrl><hp:header id="" applyPageType="BOTH"><hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="TOP" linkListIDRef="0" linkListNextIDRef="0" textWidth="${mm(
    CONTENT_WIDTH,
  )}" textHeight="${mm(MARGIN.header)}" hasTextRef="0" hasNumRef="0">${paragraph}</hp:subList></hp:header></hp:ctrl>`;
}

function sectionXml(ctx: BuildContext, body: string): string {
  const pageBorder = `<hp:pageBorderFill type="BOTH" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill><hp:pageBorderFill type="EVEN" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill><hp:pageBorderFill type="ODD" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill>`;
  const secPr = `<hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" tabStop="8000" tabStopVal="4000" tabStopUnit="HWPUNIT" outlineShapeIDRef="1" memoShapeIDRef="0" textVerticalWidthHead="0" masterPageCnt="0"><hp:grid lineGrid="0" charGrid="0" wonggojiFormat="0"/><hp:startNum pageStartsOn="BOTH" page="0" pic="0" tbl="0" equation="0"/><hp:visibility hideFirstHeader="1" hideFirstFooter="0" hideFirstMasterPage="0" border="SHOW_ALL" fill="SHOW_ALL" hideFirstPageNum="0" hideFirstEmptyLine="0" showLineNumber="0"/><hp:lineNumberShape restartType="0" countBy="0" distance="0" startNumber="0"/><hp:pagePr landscape="WIDELY" width="${mm(
    PAPER.width,
  )}" height="${mm(
    PAPER.height,
  )}" gutterType="LEFT_ONLY"><hp:margin header="${mm(MARGIN.header)}" footer="0" gutter="0" left="${mm(MARGIN.left)}" right="${mm(MARGIN.right)}" top="${mm(MARGIN.top)}" bottom="${mm(MARGIN.bottom)}"/></hp:pagePr><hp:footNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="-1" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="283" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="EACH_COLUMN" beneathText="0"/></hp:footNotePr><hp:endNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="14692344" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="0" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="END_OF_DOCUMENT" beneathText="0"/></hp:endNotePr>${pageBorder}</hp:secPr>`;
  const first = `<hp:p id="${ctx.nextId()}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${ctx.styles.char(
    BODY,
  )}">${secPr}<hp:ctrl><hp:colPr id="" type="NEWSPAPER" layout="LEFT" colCount="1" sameSz="1" sameGap="0"/></hp:ctrl>${frameRects(
    ctx,
  )}${runningHeader(ctx)}${
    ctx.template.showFooter === false
      ? ''
      : '<hp:ctrl><hp:pageNum pos="BOTTOM_RIGHT" formatType="DIGIT" sideChar=""/></hp:ctrl>'
  }</hp:run>${run(ctx.styles.char(BODY), t(''))}</hp:p>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><hs:sec ${SECTION_NS}>${first}${body}</hs:sec>`;
}

export interface HwpxBuildResult {
  sectionXml: string;
  headXml: string;
  images: HwpxImageFile[];
}

export function buildHwpxParts(template: FormTemplate, options: HwpxOptions): HwpxBuildResult {
  const sheet = template.sheet;
  const sheetPadding = sheet?.padding ?? 0;
  if (sheet) {
    CONTENT_WIDTH = Math.max(1, sheet.width - sheetPadding * 2);
    MARGIN = {
      left: (PAPER.width - sheet.width) / 2 + sheetPadding,
      right: (PAPER.width - sheet.width) / 2 + sheetPadding,
      top: (PAPER.height - sheet.height) / 2 - 5 + sheetPadding,
      bottom: (PAPER.height - sheet.height) / 2 - 5 + sheetPadding,
      header: 0,
    };
  } else {
    CONTENT_WIDTH = 174;
    MARGIN = { ...BASE_MARGIN };
  }
  let id = 1;
  const blocks = template.printBlocks
    ? template.printBlocks({ attachment: options.attachment ?? false })
    : template.buildBlocks
      ? template.buildBlocks({ attachment: options.attachment ?? false })
      : template.blocks;
  const ctx: BuildContext = {
    template,
    blocks,
    values: options.values,
    rows: options.rows,
    mode: options.mode,
    styles: new StyleBook(),
    nextId: () => id++,
    assets: options.assets,
    images: [],
  };

  let body = '';
  let pendingBreak = false;
  let previousKind: FormBlock['kind'] | null = null;
  const tableLike = new Set<FormBlock['kind']>([
    'table',
    'totals',
    'parties',
    'checklist',
    'signature',
    'text',
    'header',
  ]);
  for (const block of blocks) {
    if (block.kind === 'pageBreak') {
      pendingBreak = true;
      if (block.title) {
        body += renderSectionBlock(
          ctx,
          { kind: 'section', title: block.title, note: block.note },
          true,
        );
        pendingBreak = false;
      }
      continue;
    }
    let piece = '';
    switch (block.kind) {
      case 'ruled':
        piece = renderRuledBlock(ctx, block);
        break;
      case 'grid':
        piece = renderGridBlock(ctx, block);
        break;
      case 'header':
        piece = renderHeader(ctx, block);
        break;
      case 'section':
        if (previousKind && tableLike.has(previousKind)) {
          body += gapBefore(ctx, 2.5);
        }
        piece = renderSectionBlock(ctx, block, pendingBreak);
        pendingBreak = false;
        break;
      case 'kv':
        piece = renderKv(ctx, block);
        break;
      case 'text':
        piece = renderTextBlock(ctx, block);
        break;
      case 'table':
        piece = renderTableBlock(ctx, block);
        break;
      case 'totals':
        piece = renderTotals(ctx, block);
        break;
      case 'checklist':
        piece = renderChecklist(ctx, block);
        break;
      case 'labelGrid':
        piece = renderLabelGrid(ctx, block);
        break;
      case 'signature':
        piece = renderSignature(ctx, block);
        break;
      case 'parties':
        piece = renderParties(ctx, block);
        break;
      case 'issuer':
        piece = renderIssuer(ctx, block);
        break;
      case 'divider':
        piece = renderDivider(ctx, block);
        break;
      case 'paragraph':
        piece = renderParagraph(ctx, block);
        break;
      case 'notice':
        piece = renderNotice(ctx, block.text);
        break;
      case 'spacer':
        piece = para(
          ctx,
          ctx.styles.para({ lineSpacing: 100, before: block.height }),
          run(ctx.styles.char(BODY), t('')),
        );
        break;
    }
    if (pendingBreak && piece) {
      piece = piece.replace('pageBreak="0"', 'pageBreak="1"');
      pendingBreak = false;
    }
    body += piece;
    previousKind = block.kind;
  }

  return {
    sectionXml: sectionXml(ctx, body),
    headXml: ctx.styles.headXml,
    images: ctx.images,
  };
}
