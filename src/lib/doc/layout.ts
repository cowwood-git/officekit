/**
 * 템플릿 → 페이지(DisplayList) 레이아웃.
 *
 * PDF와 SVG 미리보기가 이 결과를 그대로 그린다. 좌표는 mm, 위에서부터 센다.
 * 글자 폭은 DocMetrics로 한 번만 재고, 페이지 나눔은 여기서 결정한다.
 */

import { formatDateDot, formatDateKorean } from './format';
import { DEFAULT_THEME, type DocTheme, ptToMm, type Weight } from './theme';
import type {
  DocAssets,
  DocMetrics,
  DocOp,
  DocPage,
  DocumentSpec,
  FormBlock,
  FormRows,
  FormValues,
  KvRow,
} from './types';

export interface LayoutOptions {
  mode: 'filled' | 'blank';
  theme?: DocTheme;
  showFooter?: boolean;
  /** 품목 내역을 붙임 페이지로 분리하는 배치. */
  attachment?: boolean;
  /** 회사 프리셋 로고·도장. */
  assets?: DocAssets;
}

interface HeaderInfo {
  title: string;
  docNoField?: string;
  dateField?: string;
}

interface LayoutContext {
  template: DocumentSpec;
  values: FormValues;
  rows: FormRows;
  assets: DocAssets;
  metrics: DocMetrics;
  theme: DocTheme;
  mode: 'filled' | 'blank';
  pages: DocPage[];
  page: DocPage;
  y: number;
  header: HeaderInfo | null;
}

const baselineOffset = (sizePt: number): number => ptToMm(sizePt) * 0.82;

/**
 * 행 높이 안에서 글자를 세로 가운데에 놓기 위한 text top.
 *
 * 표·합계처럼 가로 구분선이 있는 블록은 글자가 위쪽 선에 붙지 않도록
 * 행 높이에서 글자 상자(어센트+디센트 = 글자 크기)를 뺀 나머지를 반으로 나눈다.
 */
const rowTextTop = (rowHeight: number, sizePt: number): number =>
  Math.max(0, (rowHeight - ptToMm(sizePt)) / 2);

function chunkRows(rows: readonly KvRow[], size: number): KvRow[][] {
  const chunks: KvRow[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

function wrapText(
  text: string,
  maxWidth: number,
  sizePt: number,
  weight: Weight,
  metrics: DocMetrics,
): string[] {
  if (!text) return [];
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const char of paragraph) {
      const next = current + char;
      if (current && metrics.widthOf(next, sizePt, weight) > maxWidth) {
        lines.push(current);
        current = char;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function clipText(
  text: string,
  maxWidth: number,
  sizePt: number,
  weight: Weight,
  metrics: DocMetrics,
): string {
  if (!text) return '';
  if (metrics.widthOf(text, sizePt, weight) <= maxWidth) return text;
  let shortened = text;
  while (shortened.length > 1) {
    shortened = shortened.slice(0, -1);
    if (metrics.widthOf(`${shortened}…`, sizePt, weight) <= maxWidth) {
      return `${shortened}…`;
    }
  }
  return '…';
}

function addText(
  ctx: LayoutContext,
  text: string,
  x: number,
  top: number,
  sizePt: number,
  weight: Weight,
  color: string,
  align: 'left' | 'center' | 'right' = 'left',
): void {
  if (!text) return;
  ctx.page.ops.push({
    kind: 'text',
    x,
    y: top + baselineOffset(sizePt),
    text,
    size: sizePt,
    weight,
    color,
    align,
  });
}

function addLine(
  ctx: LayoutContext,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: string,
  dash?: readonly [number, number],
): void {
  ctx.page.ops.push({ kind: 'line', x1, y1, x2, y2, width, color, dash });
}

function addRect(
  ctx: LayoutContext,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { fill?: string; stroke?: string; strokeWidth?: number } = {},
): void {
  ctx.page.ops.push({
    kind: 'rect',
    x,
    y,
    width,
    height,
    fill: options.fill,
    stroke: options.stroke,
    strokeWidth: options.strokeWidth,
  });
}

function contentWidth(theme: DocTheme): number {
  return theme.paper.width - theme.margins.left - theme.margins.right;
}

/** 액자형 문서의 이중 테두리. 첫 페이지와 페이지가 넘어갈 때마다 그린다. */
function drawFrame(ctx: LayoutContext): void {
  const frame = ctx.template.frame;
  if (!frame) return;
  const { theme } = ctx;
  const inset = frame.inset ?? 12;
  const gap = frame.gap ?? 3;
  const width = theme.paper.width - inset * 2;
  const height = theme.paper.height - inset * 2;
  addRect(ctx, inset, inset, width, height, {
    stroke: frame.color ?? theme.colors.accent,
    strokeWidth: 0.5,
  });
  addRect(ctx, inset + gap, inset + gap, width - gap * 2, height - gap * 2, {
    stroke: theme.colors.line,
    strokeWidth: 0.2,
  });
}

function contentRight(theme: DocTheme): number {
  return theme.paper.width - theme.margins.right;
}

function contentBottom(theme: DocTheme): number {
  return theme.paper.height - theme.margins.bottom;
}

function createPage(theme: DocTheme): DocPage {
  return { width: theme.paper.width, height: theme.paper.height, ops: [] };
}

function drawRunningHeader(ctx: LayoutContext): void {
  const { theme } = ctx;
  if (!ctx.header) return;
  const top = theme.runningHeader.titleTop;
  addText(ctx, ctx.header.title, theme.margins.left, top, 9, 'bold', theme.colors.ink);
  const docNo = ctx.header.docNoField ? (ctx.values[ctx.header.docNoField] ?? '') : '';
  if (docNo) {
    addText(ctx, docNo, contentRight(theme), top, 8, 'regular', theme.colors.muted, 'right');
  }
  addLine(
    ctx,
    theme.margins.left,
    theme.runningHeader.ruleY,
    contentRight(theme),
    theme.runningHeader.ruleY,
    theme.line.hair,
    theme.colors.line,
  );
}

function newPage(ctx: LayoutContext): void {
  const page = createPage(ctx.theme);
  ctx.pages.push(page);
  ctx.page = page;
  ctx.y = ctx.theme.margins.top;
  if (ctx.pages.length > 1) drawRunningHeader(ctx);
  drawFrame(ctx);
}

function ensureSpace(ctx: LayoutContext, height: number): void {
  if (ctx.y + height > contentBottom(ctx.theme)) newPage(ctx);
}

/** 필드 값. 빈 양식 모드에서는 사용자가 쓴 값을 지우고, 날짜 필드는 문서 표기로 바꾼다. */
function fieldValue(ctx: LayoutContext, field: string | undefined, literal?: string): string {
  if (ctx.mode === 'blank') return '';
  const value = field ? (ctx.values[field] ?? '').trim() : (literal ?? '').trim();
  if (!value || !field) return value;
  const meta = ctx.template.fields.find((item) => item.id === field);
  return meta?.type === 'date' ? formatDateDot(value) : value;
}

/** roles 필드 값(JSON 또는 쉼표 목록)을 문서에 그릴 이름 목록으로 바꾼다. */
function parseRoleLabels(raw: string): string[] {
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
      // 예전 쉼표 형식으로 이어서 처리한다.
    }
  }
  return value
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function drawHeaderLogo(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'header' }>): number {
  if (!block.logo || !ctx.assets.logo) return 0;
  const { theme } = ctx;
  const asset = ctx.assets.logo;
  const scale = Math.min(40 / asset.width, 8 / asset.height, 1);
  const logoWidth = asset.width * scale;
  const logoHeight = asset.height * scale;
  ctx.page.ops.push({
    kind: 'image',
    x: theme.margins.left,
    y: 6,
    width: logoWidth,
    height: logoHeight,
    src: asset.src,
  });
  return logoWidth;
}

function drawEditorialHeader(
  ctx: LayoutContext,
  block: Extract<FormBlock, { kind: 'header' }>,
  title: string,
): void {
  const { theme } = ctx;
  const left = theme.margins.left;
  const right = contentRight(theme);
  const textLeft = left + 4.2;
  const titleSize = 18;

  drawHeaderLogo(ctx, block);

  addRect(ctx, left, 19.2, 1.2, 11, { fill: theme.colors.accent });

  const docNo = fieldValue(ctx, block.docNoField);
  addText(
    ctx,
    docNo ? `${block.docNoLabel ?? '문서번호'} ${docNo}` : (block.docNoLabel ?? '문서번호'),
    textLeft,
    19.2,
    theme.type.table,
    'regular',
    theme.colors.muted,
  );

  addText(ctx, title, textLeft, 25, titleSize, 'bold', theme.colors.ink);

  const date = fieldValue(ctx, block.dateField);
  addText(
    ctx,
    date ? `${block.dateLabel ?? '작성일'} ${date}` : (block.dateLabel ?? '작성일'),
    right,
    27.9,
    theme.type.label,
    'regular',
    theme.colors.muted,
    'right',
  );

  // 제목 밑단과 구분선 사이를 기존의 절반으로 줄이고, 본문 시작도 함께 당긴다.
  addLine(ctx, left, 34.8, right, 34.8, theme.line.hair, theme.colors.line);

  ctx.y = 43.6;
}

function drawHeader(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'header' }>): void {
  const { theme } = ctx;
  const title = fieldValue(ctx, block.titleField) || block.title;
  ctx.header = {
    title,
    docNoField: block.docNoField,
    dateField: block.dateField,
  };

  const left = theme.margins.left;
  const right = contentRight(theme);

  if (block.variant === 'editorial') {
    drawEditorialHeader(ctx, block, title);
    return;
  }

  let accentStart = left + theme.header.accentInset;
  const logoWidth = drawHeaderLogo(ctx, block);
  if (logoWidth > 0) accentStart = left + logoWidth + 4;

  addLine(
    ctx,
    accentStart,
    theme.header.ruleY,
    accentStart + theme.header.accentLength,
    theme.header.ruleY,
    theme.header.accentWeight,
    theme.colors.accent,
  );
  addLine(
    ctx,
    left,
    theme.header.ruleY,
    right,
    theme.header.ruleY,
    theme.header.ruleWeight,
    theme.colors.line,
  );

  addText(
    ctx,
    title,
    theme.paper.width / 2,
    theme.header.titleTop,
    theme.type.title,
    'bold',
    theme.colors.ink,
    'center',
  );

  const docNo = fieldValue(ctx, block.docNoField);
  const date = fieldValue(ctx, block.dateField);
  addText(
    ctx,
    docNo ? `${block.docNoLabel ?? '문서번호'} ${docNo}` : (block.docNoLabel ?? '문서번호'),
    left,
    theme.header.metaTop,
    theme.type.table,
    'regular',
    theme.colors.muted,
  );
  addText(
    ctx,
    date ? `${block.dateLabel ?? '작성일'} ${date}` : (block.dateLabel ?? '작성일'),
    right,
    theme.header.metaTop,
    theme.type.table,
    'regular',
    theme.colors.muted,
    'right',
  );

  ctx.y = theme.header.contentTop;
}

function drawSection(ctx: LayoutContext, title: string, note?: string): void {
  const { theme } = ctx;
  // 제목만 페이지 끝에 남지 않도록 제목 높이 + 본문 한 줄만큼을 함께 확보한다.
  ensureSpace(ctx, theme.section.height + (note ? 18 : 14));
  addRect(
    ctx,
    theme.margins.left,
    ctx.y + theme.section.markTop,
    theme.section.markSize,
    theme.section.markSize,
    { fill: theme.colors.accent },
  );
  addText(
    ctx,
    title,
    theme.margins.left + theme.section.textGap,
    ctx.y,
    theme.type.section,
    'bold',
    theme.colors.ink,
  );
  if (note) {
    addText(
      ctx,
      note,
      theme.margins.left + theme.section.textGap,
      ctx.y + 5.6,
      theme.type.label,
      'regular',
      theme.colors.muted,
    );
  }
  ctx.y += note ? theme.section.height + 3 : theme.section.height;
}

function drawKv(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'kv' }>): void {
  const { theme, metrics } = ctx;
  const width = contentWidth(theme);
  const cellWidth = width / block.columns;
  const startedAt = ctx.y;

  for (const rows of chunkRows(block.rows, block.columns)) {
    ensureSpace(ctx, theme.kv.rowHeight);
    for (let index = 0; index < block.columns; index += 1) {
      const row = rows[index];
      if (!row) continue;
      const x = theme.margins.left + index * cellWidth;
      const isLast = index === block.columns - 1;
      const cellRight = x + cellWidth - (isLast ? 0 : 4);
      const labelTop = ctx.y + 1.2;
      const value = fieldValue(ctx, row.field, row.value);

      addText(ctx, row.label, x, labelTop, theme.type.label, 'regular', theme.colors.muted);

      const labelWidth = metrics.widthOf(row.label, theme.type.label, 'regular') + 1.5;
      const valueWidth = value ? metrics.widthOf(value, theme.type.body, 'regular') + 2 : 0;
      const leaderStart = x + labelWidth + 1.5;
      const leaderEnd = cellRight - valueWidth;

      if (leaderEnd > leaderStart + 1) {
        addLine(
          ctx,
          leaderStart,
          ctx.y + 4.6,
          leaderEnd,
          ctx.y + 4.6,
          theme.line.hair,
          theme.colors.line,
          [0.5, 0.9],
        );
      }

      if (value) {
        const available = cellRight - leaderStart;
        addText(
          ctx,
          clipText(value, available, theme.type.body, 'regular', metrics),
          cellRight,
          ctx.y + 0.9,
          theme.type.body,
          'regular',
          theme.colors.ink,
          'right',
        );
      }
    }
    ctx.y += theme.kv.rowHeight;
  }

  if (ctx.y === startedAt) ctx.y += theme.kv.rowHeight;
  ctx.y += theme.kv.gap;
}

function drawParties(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'parties' }>): void {
  const { theme, metrics } = ctx;
  const gap = theme.parties.gap;
  const width = (contentWidth(theme) - gap) / 2;
  const padding = theme.parties.padding;
  const lineHeight = theme.parties.lineHeight;
  // 빈 양식에서는 당사자 이름·주소가 남지 않도록 값을 비운다.
  const partyValues = ctx.mode === 'blank' ? {} : ctx.values;
  const leftLines =
    typeof block.left.lines === 'function' ? block.left.lines(partyValues) : block.left.lines;
  const rightLines =
    typeof block.right.lines === 'function' ? block.right.lines(partyValues) : block.right.lines;
  const wrapLines = (lines: readonly string[]): string[] =>
    lines.flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed) return [];
      return wrapText(trimmed, width - padding * 2, theme.type.table, 'regular', metrics);
    });
  const leftWrapped = wrapLines(leftLines);
  const rightWrapped = wrapLines(rightLines);
  const maxLines = Math.max(leftWrapped.length, rightWrapped.length, block.minLines ?? 5);
  const height = Math.max(
    block.minHeight ?? theme.parties.minHeight,
    padding * 2 + maxLines * lineHeight + 5,
  );

  ensureSpace(ctx, height + 6);

  const boxes = [
    { x: theme.margins.left, label: block.left.label, lines: leftWrapped },
    {
      x: theme.margins.left + width + gap,
      label: block.right.label,
      lines: rightWrapped,
    },
  ];

  for (const box of boxes) {
    addRect(ctx, box.x, ctx.y, width, height, {
      stroke: theme.colors.line,
      strokeWidth: theme.line.thin,
    });
    addText(
      ctx,
      box.label,
      box.x + padding,
      ctx.y + 2.2,
      theme.type.label,
      'regular',
      theme.colors.muted,
    );
    let lineY = ctx.y + 7.2;
    for (const line of box.lines) {
      addText(ctx, line, box.x + padding, lineY, theme.type.table, 'regular', theme.colors.ink);
      lineY += lineHeight;
    }
  }

  ctx.y += height + 6;
}

function drawTable(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'table' }>): void {
  const { theme, metrics } = ctx;
  const width = contentWidth(theme);
  const left = theme.margins.left;
  const right = contentRight(theme);
  const padding = theme.table.padding;
  const headerHeight = theme.table.headerHeight;
  const rowHeight = theme.table.rowHeight;

  const requested = block.columnCountField
    ? Number(ctx.values[block.columnCountField])
    : Number.NaN;
  const limit = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), 1), block.columns.length)
    : block.columns.length;
  const columns = block.columns.slice(0, limit).map((column) => ({
    ...column,
    label: column.labelField ? fieldValue(ctx, column.labelField) : column.label,
  }));

  const totalWidth = columns.reduce((sum, column) => sum + column.width, 0) || 1;
  const widths = columns.map((column) => (column.width / totalWidth) * width);
  const starts: number[] = [];
  let cursor = left;
  for (const columnWidth of widths) {
    starts.push(cursor);
    cursor += columnWidth;
  }

  const sourceRows =
    ctx.mode === 'blank'
      ? []
      : typeof block.rows === 'function'
        ? block.rows(ctx.values, ctx.rows)
        : block.rows;
  const minRows = ctx.mode === 'blank' && block.blankMinRows ? block.blankMinRows : block.minRows;
  const rows =
    minRows && sourceRows.length < minRows
      ? [...sourceRows, ...Array.from({ length: minRows - sourceRows.length }, () => [])]
      : sourceRows;

  const drawGrid = (top: number, height: number): void => {
    if (!block.grid) return;
    for (const x of [...starts, left + width]) {
      addLine(ctx, x, top, x, top + height, theme.line.hair, theme.colors.line);
    }
  };

  const drawHeader = (): void => {
    ensureSpace(ctx, headerHeight + rowHeight);
    addRect(ctx, left, ctx.y, width, headerHeight, {
      fill: theme.colors.fill,
    });
    drawGrid(ctx.y, headerHeight);
    for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index];
      if (!column) continue;
      const cellWidth = widths[index] ?? 0;
      const x = starts[index] ?? left;
      const align = column.align ?? 'left';
      const anchor =
        align === 'right'
          ? x + cellWidth - padding
          : align === 'center'
            ? x + cellWidth / 2
            : x + padding;
      addText(
        ctx,
        column.label,
        anchor,
        ctx.y + rowTextTop(headerHeight, theme.type.table),
        theme.type.table,
        'bold',
        theme.colors.muted,
        align,
      );
    }
    ctx.y += headerHeight;
  };

  drawHeader();

  for (const row of rows) {
    if (ctx.y + rowHeight > contentBottom(theme)) {
      newPage(ctx);
      drawHeader();
    }
    drawGrid(ctx.y, rowHeight);
    for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index];
      if (!column) continue;
      const cellWidth = widths[index] ?? 0;
      const x = starts[index] ?? left;
      const value = (row[index] ?? '').trim();

      if (column.checkbox) {
        const boxSize = 3.1;
        const boxX = x + (cellWidth - boxSize) / 2;
        const boxY = ctx.y + (rowHeight - boxSize) / 2;
        addRect(ctx, boxX, boxY, boxSize, boxSize, {
          stroke: theme.colors.muted,
          strokeWidth: 0.25,
        });
        if (value) {
          addLine(ctx, boxX + 0.6, boxY + 1.6, boxX + 1.3, boxY + 2.4, 0.45, theme.colors.accent);
          addLine(ctx, boxX + 1.3, boxY + 2.4, boxX + 2.6, boxY + 0.6, 0.45, theme.colors.accent);
        }
        continue;
      }

      if (!value) continue;
      const fitted = clipText(value, cellWidth - padding * 2, theme.type.table, 'regular', metrics);
      const align = column.align ?? 'left';
      const anchor =
        align === 'right'
          ? x + cellWidth - padding
          : align === 'center'
            ? x + cellWidth / 2
            : x + padding;
      addText(
        ctx,
        fitted,
        anchor,
        ctx.y + rowTextTop(rowHeight, theme.type.table),
        theme.type.table,
        'regular',
        theme.colors.ink,
        align,
      );
    }
    ctx.y += rowHeight;
    addLine(ctx, left, ctx.y, right, ctx.y, theme.line.hair, theme.colors.line);
  }

  ctx.y += 4;
}

function drawTotals(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'totals' }>): void {
  const { theme } = ctx;
  const width = block.width ?? theme.totals.width;
  const x = contentRight(theme) - width;
  const padding = theme.totals.padding;
  const rowHeight = theme.totals.rowHeight;
  const height = rowHeight * block.rows.length;

  ensureSpace(ctx, height + 9);
  addLine(ctx, x, ctx.y, x + width, ctx.y, theme.line.strong, theme.colors.accent);

  let rowY = ctx.y + 2;
  for (let index = 0; index < block.rows.length; index += 1) {
    const row = block.rows[index];
    if (!row) continue;
    const strong = Boolean(row.strong);
    const size = strong ? theme.type.body : theme.type.table;
    const weight: Weight = strong ? 'bold' : 'regular';
    // 합계 행 구분선은 앞 행과의 경계에만 긋는다. 첫 행이 합계면 강조선과 겹쳐 보인다.
    if (strong && index > 0) {
      addLine(ctx, x, rowY - 1, x + width, rowY - 1, theme.line.hair, theme.colors.line);
    }
    const textTop = rowY + rowTextTop(rowHeight, size);
    addText(
      ctx,
      row.label,
      x + padding,
      textTop,
      size,
      weight,
      strong ? theme.colors.ink : theme.colors.muted,
    );
    addText(
      ctx,
      fieldValue(ctx, row.field, row.value),
      x + width - padding,
      textTop,
      size,
      weight,
      theme.colors.ink,
      'right',
    );
    rowY += rowHeight;
  }

  ctx.y += height + 8;
}

function drawTextBox(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'text' }>): void {
  const { theme, metrics } = ctx;
  const width = contentWidth(theme);
  const padding = theme.textBox.padding;

  if (block.label) {
    addText(ctx, block.label, theme.margins.left, ctx.y, theme.type.body, 'bold', theme.colors.ink);
    ctx.y += 5.5;
  }

  const text = fieldValue(ctx, block.field);
  const lines = wrapText(text, width - padding * 2, theme.type.body, 'regular', metrics);
  const lineCount = Math.max(block.minLines ?? 3, lines.length);
  const height = padding * 2 + lineCount * theme.textBox.lineHeight;

  ensureSpace(ctx, height + 4);
  addRect(ctx, theme.margins.left, ctx.y, width, height, {
    stroke: theme.colors.line,
    strokeWidth: theme.line.thin,
  });

  if (lines.length > 0) {
    for (let index = 0; index < lines.length; index += 1) {
      addText(
        ctx,
        lines[index] ?? '',
        theme.margins.left + padding,
        ctx.y + padding + index * theme.textBox.lineHeight - 0.5,
        theme.type.body,
        'regular',
        theme.colors.ink,
      );
    }
  } else {
    for (let index = 0; index < lineCount; index += 1) {
      const lineY =
        ctx.y + padding + index * theme.textBox.lineHeight + theme.textBox.lineHeight - 1.2;
      addLine(
        ctx,
        theme.margins.left + padding,
        lineY,
        contentRight(theme) - padding,
        lineY,
        theme.line.hair,
        theme.colors.line,
        [0.6, 1],
      );
    }
  }

  ctx.y += height + 4;
}

function drawSignature(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'signature' }>): void {
  const { theme, metrics } = ctx;
  const roles = block.rolesField
    ? parseRoleLabels(ctx.values[block.rolesField] ?? '')
    : (block.roles ?? []);
  if (roles.length === 0) return;

  const cellWidth = Math.min(theme.signature.cellWidth, contentWidth(theme) / roles.length);
  const totalWidth = cellWidth * roles.length;
  const x = contentRight(theme) - totalWidth;
  const headerHeight = block.formal ? theme.signature.formalHeader : 0;
  const totalHeight = headerHeight + theme.signature.height;

  if (block.bottom) {
    const desired = contentBottom(theme) - totalHeight - 2;
    if (ctx.y < desired) ctx.y = desired;
    ensureSpace(ctx, totalHeight);
  } else {
    ensureSpace(ctx, totalHeight + 8);
  }

  if (block.formal) {
    addRect(ctx, x, ctx.y, totalWidth, headerHeight, {
      fill: theme.colors.fill,
      stroke: theme.colors.line,
      strokeWidth: theme.line.thin,
    });
    addText(
      ctx,
      '결재',
      x + totalWidth / 2,
      ctx.y + 1.2,
      theme.type.label,
      'bold',
      theme.colors.muted,
      'center',
    );
    ctx.y += headerHeight;
  }

  addRect(ctx, x, ctx.y, totalWidth, theme.signature.height, {
    stroke: theme.colors.line,
    strokeWidth: theme.line.thin,
  });

  for (let index = 0; index < roles.length; index += 1) {
    const cellX = x + index * cellWidth;
    if (index > 0) {
      addLine(
        ctx,
        cellX,
        ctx.y,
        cellX,
        ctx.y + theme.signature.height,
        theme.line.hair,
        theme.colors.line,
      );
    }
    addText(
      ctx,
      clipText(roles[index] ?? '', cellWidth - 4, theme.type.label, 'regular', metrics),
      cellX + cellWidth / 2,
      ctx.y + 2.4,
      theme.type.label,
      'regular',
      theme.colors.muted,
      'center',
    );
    const sealed = Boolean(block.seal && index === 0 && ctx.assets.seal);
    if (sealed && ctx.assets.seal) {
      const asset = ctx.assets.seal;
      const scale = Math.min(13 / asset.width, 13 / asset.height, 1);
      const sealWidth = asset.width * scale;
      const sealHeight = asset.height * scale;
      ctx.page.ops.push({
        kind: 'image',
        x: cellX + (cellWidth - sealWidth) / 2,
        y: ctx.y + 5.5,
        width: sealWidth,
        height: sealHeight,
        src: asset.src,
      });
    }
    if (!sealed) {
      addText(
        ctx,
        '(서명)',
        cellX + cellWidth / 2,
        ctx.y + theme.signature.height - 6,
        theme.type.label,
        'regular',
        theme.colors.muted,
        'center',
      );
    }
  }

  ctx.y += theme.signature.height + (block.bottom ? 4 : 8);
}

function drawChecklist(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'checklist' }>): void {
  const { theme, metrics } = ctx;
  const items = block.field
    ? (ctx.mode === 'blank' ? '' : (ctx.values[block.field] ?? ''))
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
    : (block.items ?? []);
  // 빈 양식에서 사용자가 직접 쓸 수 있도록 빈 체크박스 줄을 남긴다.
  const resolved =
    items.length === 0 && block.field && ctx.mode === 'blank' ? ['', '', '', ''] : items;
  if (resolved.length === 0) return;

  const columns = block.columns ?? 1;
  const gap = 6;
  const width = (contentWidth(theme) - gap * (columns - 1)) / columns;
  const rowHeight = 7;
  const boxSize = 3.1;
  const rows = Math.ceil(resolved.length / columns);
  const height = rows * rowHeight;
  ensureSpace(ctx, height + 4);

  for (let index = 0; index < resolved.length; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = theme.margins.left + column * (width + gap);
    const top = ctx.y + row * rowHeight;
    // 폰트에 □ 글리프가 없어도 되도록 체크박스는 벡터로 그린다.
    addRect(ctx, x, top + (rowHeight - boxSize) / 2, boxSize, boxSize, {
      stroke: theme.colors.muted,
      strokeWidth: 0.25,
    });
    addText(
      ctx,
      clipText(resolved[index] ?? '', width - boxSize - 3.5, 9, 'regular', metrics),
      x + boxSize + 2.5,
      top + rowTextTop(rowHeight, 9),
      9,
      'regular',
      theme.colors.ink,
    );
  }

  ctx.y += height + 4;
}

function drawLabelGrid(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'labelGrid' }>): void {
  const { theme, metrics } = ctx;
  const gap = block.gap ?? 3;
  const padding = block.padding ?? 4;
  const width = contentWidth(theme);
  const top = ctx.y;
  const bottom = contentBottom(theme);
  const height = bottom - top;
  const columns = block.columns;
  const rows = block.rows;
  const slotWidth = (width - gap * (columns - 1)) / columns;
  const slotHeight = (height - gap * (rows - 1)) / rows;
  const slots = block.slots(ctx.values, ctx.rows);

  for (let index = 0; index < columns * rows; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = theme.margins.left + column * (slotWidth + gap);
    const y = top + row * (slotHeight + gap);

    if (block.cutLines === false) {
      addRect(ctx, x, y, slotWidth, slotHeight, {
        stroke: theme.colors.line,
        strokeWidth: theme.line.thin,
      });
    } else {
      const dash = [1.4, 1.2] as const;
      addLine(ctx, x, y, x + slotWidth, y, theme.line.hair, theme.colors.line, dash);
      addLine(
        ctx,
        x + slotWidth,
        y,
        x + slotWidth,
        y + slotHeight,
        theme.line.hair,
        theme.colors.line,
        dash,
      );
      addLine(
        ctx,
        x + slotWidth,
        y + slotHeight,
        x,
        y + slotHeight,
        theme.line.hair,
        theme.colors.line,
        dash,
      );
      addLine(ctx, x, y + slotHeight, x, y, theme.line.hair, theme.colors.line, dash);
    }

    const slot = slots[index];
    if (!slot) continue;
    const innerWidth = slotWidth - padding * 2;
    let cursor = y + padding + 3;

    if (slot.title) {
      addText(
        ctx,
        clipText(slot.title, innerWidth, 11, 'bold', metrics),
        x + padding,
        cursor,
        11,
        'bold',
        theme.colors.ink,
      );
      cursor += 6.5;
    }
    if (slot.subtitle) {
      addText(
        ctx,
        clipText(slot.subtitle, innerWidth, 8.5, 'regular', metrics),
        x + padding,
        cursor,
        8.5,
        'regular',
        theme.colors.muted,
      );
      cursor += 5;
    }
    for (const value of slot.lines ?? []) {
      const line = value.trim();
      if (!line) continue;
      const wrapped = wrapText(line, innerWidth, 8.5, 'regular', metrics);
      for (const part of wrapped) {
        if (cursor > y + slotHeight - padding - 4) break;
        addText(ctx, part, x + padding, cursor, 8.5, 'regular', theme.colors.ink);
        cursor += 4.6;
      }
    }
    if (slot.note) {
      addText(
        ctx,
        clipText(slot.note, innerWidth, 7.5, 'regular', metrics),
        x + padding,
        y + slotHeight - padding - 2,
        7.5,
        'regular',
        theme.colors.muted,
      );
    }
  }

  ctx.y = bottom + 4;
}

function drawParagraph(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'paragraph' }>): void {
  const { theme, metrics } = ctx;
  const size = block.size ?? theme.type.body;
  const weight: Weight = block.bold ? 'bold' : 'regular';
  const color = block.color ?? theme.colors.ink;
  const text = (block.field ? fieldValue(ctx, block.field) : (block.text ?? '')).trim();
  const lineHeight = ptToMm(size) * 1.65;
  const before = block.before ?? 0;
  const align = block.align ?? 'left';

  if (!text) {
    if (ctx.mode === 'blank' && block.field && block.blankLine) {
      ensureSpace(ctx, before + lineHeight + 2);
      ctx.y += before;
      const width = block.blankLine;
      const startX =
        align === 'center'
          ? theme.paper.width / 2 - width / 2
          : align === 'right'
            ? contentRight(theme) - width
            : theme.margins.left;
      addLine(
        ctx,
        startX,
        ctx.y + lineHeight * 0.7,
        startX + width,
        ctx.y + lineHeight * 0.7,
        0.25,
        theme.colors.line,
        [0.6, 1],
      );
      ctx.y += lineHeight + (block.after ?? 0);
    }
    return;
  }

  const lines = wrapText(text, contentWidth(theme), size, weight, metrics);

  ensureSpace(ctx, before + lines.length * lineHeight + 2);
  ctx.y += before;

  const x =
    align === 'center'
      ? theme.paper.width / 2
      : align === 'right'
        ? contentRight(theme)
        : theme.margins.left;
  for (let index = 0; index < lines.length; index += 1) {
    addText(ctx, lines[index] ?? '', x, ctx.y + index * lineHeight, size, weight, color, align);
  }

  ctx.y += lines.length * lineHeight + (block.after ?? 0);
}

function drawDivider(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'divider' }>): void {
  const { theme } = ctx;
  const width = block.width ?? 30;
  const thickness = block.thickness ?? 0.5;
  const before = block.before ?? 0;
  const after = block.after ?? 0;

  ensureSpace(ctx, before + thickness + after + 2);
  ctx.y += before;
  const x = theme.paper.width / 2 - width / 2;
  addLine(ctx, x, ctx.y, x + width, ctx.y, thickness, block.color ?? theme.colors.accent);
  ctx.y += thickness + after;
}

function drawIssuer(ctx: LayoutContext, block: Extract<FormBlock, { kind: 'issuer' }>): void {
  const { theme, metrics } = ctx;
  const dateValue =
    block.dateField && ctx.mode !== 'blank' ? (ctx.values[block.dateField] ?? '').trim() : '';
  const dateMeta = block.dateField
    ? ctx.template.fields.find((field) => field.id === block.dateField)
    : undefined;
  const date = dateValue && dateMeta?.type === 'date' ? formatDateKorean(dateValue) : dateValue;
  const company = fieldValue(ctx, block.companyField);
  const ceo = fieldValue(ctx, block.ceoField);
  const blank = ctx.mode === 'blank';
  const align = block.align ?? 'center';
  const height = 20;

  if (block.bottom) {
    const desired = contentBottom(theme) - height - 10;
    if (ctx.y < desired) ctx.y = desired;
    ensureSpace(ctx, height);
  } else {
    ensureSpace(ctx, height + 4);
    ctx.y += block.before ?? 0;
  }

  const seal = block.seal ? ctx.assets.seal : undefined;
  const sealScale = seal ? Math.min(15 / seal.width, 15 / seal.height, 1) : 0;
  const sealWidth = seal ? seal.width * sealScale : 0;
  const sealHeight = seal ? seal.height * sealScale : 0;
  const gap = seal ? 4 : 0;
  const companyWidth = metrics.widthOf(company || '대표이사', theme.type.section, 'bold');
  const ceoLine = ceo ? `대표이사 ${ceo}` : '대표이사';
  const ceoWidth = metrics.widthOf(ceoLine, theme.type.label, 'regular');
  const textWidth = Math.max(companyWidth, ceoWidth, 34);
  const totalWidth = textWidth + (seal ? gap + sealWidth : 0);
  const groupStart =
    align === 'center' ? theme.paper.width / 2 - totalWidth / 2 : contentRight(theme) - totalWidth;
  const textCenter = groupStart + textWidth / 2;
  const sealX = groupStart + textWidth + gap;

  const dateY = ctx.y;
  const companyY = ctx.y + 6;
  const ceoY = ctx.y + 12;
  const dotted = (y: number, lineWidth: number): void => {
    addLine(
      ctx,
      textCenter - lineWidth / 2,
      y + 4,
      textCenter + lineWidth / 2,
      y + 4,
      0.25,
      theme.colors.line,
      [0.6, 1],
    );
  };

  if (date) {
    addText(
      ctx,
      date,
      textCenter,
      dateY,
      theme.type.small,
      'regular',
      theme.colors.muted,
      'center',
    );
  } else if (blank) {
    dotted(dateY, 42);
  }

  if (company) {
    addText(
      ctx,
      company,
      textCenter,
      companyY,
      theme.type.body,
      'bold',
      theme.colors.ink,
      'center',
    );
  } else if (blank) {
    dotted(companyY, 58);
  }

  if (ceo || blank) {
    addText(
      ctx,
      ceoLine,
      textCenter,
      ceoY,
      theme.type.label,
      'regular',
      theme.colors.muted,
      'center',
    );
  }

  if (seal) {
    ctx.page.ops.push({
      kind: 'image',
      x: sealX,
      y: companyY - 1,
      width: sealWidth,
      height: sealHeight,
      src: seal.src,
    });
  }

  ctx.y += height + (block.after ?? 0);
}

function drawNotice(ctx: LayoutContext, text: string): void {
  const { theme, metrics } = ctx;
  const lines = wrapText(text, contentWidth(theme), theme.type.small, 'regular', metrics);
  const height = lines.length * 4.2;
  ensureSpace(ctx, height + 8);

  addLine(
    ctx,
    theme.margins.left,
    ctx.y,
    contentRight(theme),
    ctx.y,
    theme.line.hair,
    theme.colors.line,
  );
  ctx.y += 3;
  for (const line of lines) {
    addText(ctx, line, theme.margins.left, ctx.y, theme.type.small, 'regular', theme.colors.muted);
    ctx.y += 4.2;
  }
  ctx.y += 3;
}

function drawFooter(ctx: LayoutContext, showFooter: boolean): void {
  if (!showFooter) return;
  const { theme } = ctx;
  const total = ctx.pages.length;
  ctx.pages.forEach((page, index) => {
    const ops: DocOp[] = [
      {
        kind: 'line',
        x1: theme.margins.left,
        y1: theme.footer.ruleY,
        x2: contentRight(theme),
        y2: theme.footer.ruleY,
        width: theme.line.hair,
        color: theme.colors.line,
      },
      {
        kind: 'text',
        x: theme.margins.left,
        y: theme.footer.textY,
        text: ctx.template.footer ?? '',
        size: theme.type.small,
        weight: 'regular',
        color: theme.colors.muted,
        align: 'left',
      },
      {
        kind: 'text',
        x: contentRight(theme),
        y: theme.footer.textY,
        text: `${index + 1} / ${total}`,
        size: theme.type.small,
        weight: 'regular',
        color: theme.colors.muted,
        align: 'right',
      },
    ];
    page.ops.push(...ops);
  });
}

function renderBlock(ctx: LayoutContext, block: FormBlock): void {
  switch (block.kind) {
    case 'header':
      drawHeader(ctx, block);
      break;
    case 'section':
      if (ctx.mode === 'blank' && block.hideInBlank) break;
      drawSection(ctx, block.title, block.note);
      break;
    case 'kv':
      if (ctx.mode === 'blank' && block.hideInBlank) break;
      drawKv(ctx, block);
      break;
    case 'text':
      drawTextBox(ctx, block);
      break;
    case 'parties':
      drawParties(ctx, block);
      break;
    case 'table':
      drawTable(ctx, block);
      break;
    case 'totals':
      drawTotals(ctx, block);
      break;
    case 'signature':
      drawSignature(ctx, block);
      break;
    case 'checklist':
      drawChecklist(ctx, block);
      break;
    case 'labelGrid':
      drawLabelGrid(ctx, block);
      break;
    case 'paragraph':
      drawParagraph(ctx, block);
      break;
    case 'divider':
      drawDivider(ctx, block);
      break;
    case 'issuer':
      drawIssuer(ctx, block);
      break;
    case 'notice':
      drawNotice(ctx, block.text);
      break;
    case 'spacer':
      ctx.y += block.height;
      break;
    case 'pageBreak':
      newPage(ctx);
      if (block.title) drawSection(ctx, block.title, block.note);
      break;
  }
}

export function layoutDocument(
  template: DocumentSpec,
  input: FormValues,
  metrics: DocMetrics,
  options: LayoutOptions,
  rows: FormRows = {},
): DocPage[] {
  const theme = options.theme ?? DEFAULT_THEME;
  const base: FormValues = {};

  for (const field of template.fields) {
    if (field.type === 'computed') continue;
    const value = input[field.id];
    if (value !== undefined && value !== '') {
      base[field.id] = value;
    } else if (field.defaultValue) {
      base[field.id] = field.defaultValue;
    } else if (field.defaultToday) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      base[field.id] = `${year}-${month}-${day}`;
    } else {
      base[field.id] = '';
    }
  }

  const computed = template.compute ? template.compute(base, rows) : {};
  const values: FormValues = { ...base, ...computed };

  const firstPage = createPage(theme);
  const ctx: LayoutContext = {
    template,
    values,
    rows,
    assets: options.assets ?? {},
    metrics,
    theme,
    mode: options.mode,
    pages: [firstPage],
    page: firstPage,
    y: theme.margins.top,
    header: null,
  };

  drawFrame(ctx);

  const blocks = template.buildBlocks
    ? template.buildBlocks({ attachment: options.attachment ?? false })
    : template.blocks;
  for (const block of blocks) {
    renderBlock(ctx, block);
  }

  drawFooter(ctx, options.showFooter !== false && template.showFooter !== false);
  return ctx.pages;
}
