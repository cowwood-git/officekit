/**
 * 옷깃 페이퍼 — 화면과 문서가 함께 쓰는 문서 디자인 토큰.
 *
 * 단위는 mm, 글자 크기만 pt다. 문서 좌표는 왼쪽 위(0,0)에서 시작한다.
 * PDF로 바꿀 때만 pt로 환산한다(src/lib/doc/pdf.ts).
 */

export type Weight = 'regular' | 'bold';
export type Align = 'left' | 'center' | 'right';

export interface PaperSize {
  width: number;
  height: number;
}

export const PAPER = {
  A4: { width: 210, height: 297 },
} satisfies Record<string, PaperSize>;

export const PT_PER_MM = 72 / 25.4;
export const MM_PER_PT = 25.4 / 72;

export const mmToPt = (mm: number): number => mm * PT_PER_MM;
export const ptToMm = (pt: number): number => pt * MM_PER_PT;

export interface DocTheme {
  paper: PaperSize;
  margins: { top: number; right: number; bottom: number; left: number };
  colors: {
    paper: string;
    ink: string;
    muted: string;
    line: string;
    fill: string;
    accent: string;
    seal: string;
  };
  type: {
    title: number;
    section: number;
    body: number;
    table: number;
    label: number;
    small: number;
    tiny: number;
  };
  line: { hair: number; thin: number; strong: number };
  header: {
    ruleY: number;
    titleTop: number;
    metaTop: number;
    contentTop: number;
    accentInset: number;
    accentLength: number;
    accentWeight: number;
    ruleWeight: number;
  };
  runningHeader: { titleTop: number; ruleY: number; contentTop: number };
  footer: { ruleY: number; textY: number };
  section: { height: number; markSize: number; markTop: number; textGap: number };
  kv: { rowHeight: number; gap: number };
  textBox: { lineHeight: number; padding: number };
  parties: { gap: number; padding: number; lineHeight: number; minHeight: number };
  table: { headerHeight: number; rowHeight: number; padding: number };
  totals: { width: number; rowHeight: number; padding: number };
  signature: { cellWidth: number; height: number; formalHeader: number };
}

/** 기본 문서 스타일. 격식 모드는 뒤에 별도 테마로 추가한다. */
export const DEFAULT_THEME: DocTheme = {
  paper: PAPER.A4,
  margins: { top: 20, right: 18, bottom: 18, left: 18 },
  colors: {
    paper: '#ffffff',
    ink: '#14181f',
    muted: '#5b6472',
    line: '#d9d5cb',
    fill: '#f3f1ea',
    accent: '#0b6b5b',
    seal: '#b3261e',
  },
  type: {
    title: 22,
    section: 11,
    body: 9.5,
    table: 8.5,
    label: 8,
    small: 7.5,
    tiny: 7,
  },
  line: { hair: 0.18, thin: 0.28, strong: 0.5 },
  header: {
    ruleY: 16,
    titleTop: 22,
    metaTop: 34,
    contentTop: 48,
    accentInset: 6,
    accentLength: 24,
    accentWeight: 0.5,
    ruleWeight: 0.18,
  },
  runningHeader: { titleTop: 14, ruleY: 20, contentTop: 28 },
  footer: { ruleY: 282, textY: 286 },
  section: { height: 9, markSize: 2, markTop: 1.2, textGap: 4.5 },
  kv: { rowHeight: 9, gap: 3 },
  textBox: { lineHeight: 5.4, padding: 3 },
  parties: { gap: 4, padding: 4, lineHeight: 4.6, minHeight: 32 },
  table: { headerHeight: 8, rowHeight: 8.5, padding: 2.5 },
  totals: { width: 72, rowHeight: 8, padding: 2.5 },
  signature: { cellWidth: 36, height: 22, formalHeader: 6 },
};

/** 문서 안에서 쓰는 색은 테마 하나로만 정한다. */
export const DOC_COLORS = DEFAULT_THEME.colors;
