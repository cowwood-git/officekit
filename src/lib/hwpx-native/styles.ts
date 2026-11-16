import { mm, pt } from './units';

export const FONT_FACE = '나눔고딕';
export const COLORS = {
  ink: '#14181F',
  muted: '#5B6472',
  line: '#D9D5CB',
  fill: '#F3F1EA',
  accent: '#0B6B5B',
  paper: '#FFFFFF',
} as const;

export type Align = 'LEFT' | 'RIGHT' | 'CENTER' | 'JUSTIFY';
export type BorderType = 'NONE' | 'SOLID' | 'DOT' | 'DASH';
export type TabLeader = 'NONE' | 'DOT';

export interface BorderSpec {
  left?: { type: BorderType; width: number; color: string };
  right?: { type: BorderType; width: number; color: string };
  top?: { type: BorderType; width: number; color: string };
  bottom?: { type: BorderType; width: number; color: string };
  fill?: string;
}

export interface ParaSpec {
  align?: Align;
  /** 줄 간격(%). */
  lineSpacing?: number;
  before?: number;
  after?: number;
  left?: number;
  right?: number;
  border?: number;
  tab?: number;
  keepWithNext?: boolean;
}

export interface TabStop {
  /** mm */
  pos: number;
  type?: 'LEFT' | 'RIGHT' | 'CENTER' | 'DECIMAL';
  leader?: TabLeader;
}

const LANGUAGES = ['HANGUL', 'LATIN', 'HANJA', 'JAPANESE', 'OTHER', 'SYMBOL', 'USER'] as const;
const LANG_ATTRS = ['hangul', 'latin', 'hanja', 'japanese', 'other', 'symbol', 'user'] as const;

const zero = (value: string): string => LANG_ATTRS.map((lang) => `${lang}="${value}"`).join(' ');

const BORDER_WIDTHS = [0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 1, 1.5, 2, 3, 4, 5];

/** HWPX 선 두께는 정해진 값만 쓴다 — 가장 가까운 허용값으로 맞춘다. */
const borderWidth = (value: number): string => {
  const nearest = BORDER_WIDTHS.reduce((best, item) =>
    Math.abs(item - value) < Math.abs(best - value) ? item : best,
  );
  return `${nearest.toFixed(2).replace(/0+$/, '').replace(/\.$/, '.0')} mm`;
};

/**
 * 문서 하나의 charPr·paraPr·borderFill·tabPr 사전.
 * 같은 서식은 한 번만 만들고 id로 재사용한다. id 0은 바탕글, borderFill 1은 테두리 없음.
 */
export class StyleBook {
  private charXml: string[] = [];
  private charIds = new Map<string, number>();
  private paraXml: string[] = [];
  private paraIds = new Map<string, number>();
  private borderXml: string[] = [];
  private borderIds = new Map<string, number>();
  private tabXml: string[] = [];
  private tabIds = new Map<string, number>();

  constructor() {
    this.border({});
    this.para({});
  }

  char(size: number, options: { bold?: boolean; color?: string; italic?: boolean } = {}): number {
    const bold = Boolean(options.bold);
    const color = options.color ?? COLORS.ink;
    const key = `${size}|${bold ? 1 : 0}|${color}`;
    const cached = this.charIds.get(key);
    if (cached !== undefined) return cached;
    if (this.charXml.length === 0) {
      // 바탕글(charPr 0)은 9.5pt 검정으로 시작한다.
      this.charXml.push(this.charPrXml(0, size, { bold, color }));
      this.charIds.set(key, 0);
      return 0;
    }
    const id = this.charXml.length;
    this.charXml.push(this.charPrXml(id, size, { bold, color }));
    this.charIds.set(key, id);
    return id;
  }

  private charPrXml(id: number, size: number, options: { bold: boolean; color: string }): string {
    return `<hh:charPr id="${id}" height="${pt(size)}" textColor="${options.color}" shadeColor="none" useFontSpace="0" useKerning="0" symMark="NONE" borderFillIDRef="1"><hh:fontRef ${zero('0')}/><hh:ratio ${zero('100')}/><hh:spacing ${zero('0')}/><hh:relSz ${zero('100')}/><hh:offset ${zero('0')}/>${
      options.bold ? '<hh:bold/>' : ''
    }<hh:underline type="NONE" shape="SOLID" color="none"/><hh:strikeout shape="NONE" color="none"/><hh:outline type="NONE"/><hh:shadow type="NONE" color="none" offsetX="0" offsetY="0"/></hh:charPr>`;
  }

  border(spec: BorderSpec): number {
    const key = JSON.stringify(spec);
    const cached = this.borderIds.get(key);
    if (cached !== undefined) return cached;
    const id = this.borderXml.length + 1;
    const line = (value?: { type: BorderType; width: number; color: string }): string => {
      if (!value || value.type === 'NONE') {
        return `type="NONE" width="0.1 mm" color="#000000"`;
      }
      return `type="${value.type}" width="${borderWidth(value.width)}" color="${value.color}"`;
    };
    this.borderXml.push(
      `<hh:borderFill id="${id}" threeD="0" shadow="0" centerLine="NONE" breakCellSeparateLine="0"><hh:slash type="NONE" Crooked="0" isCounter="0"/><hh:backSlash type="NONE" Crooked="0" isCounter="0"/><hh:leftBorder ${line(spec.left)}/><hh:rightBorder ${line(spec.right)}/><hh:topBorder ${line(spec.top)}/><hh:bottomBorder ${line(spec.bottom)}/><hh:diagonal type="SOLID" width="0.1 mm" color="#000000"/>${
        spec.fill
          ? `<hc:fillBrush><hc:winBrush faceColor="${spec.fill}" hatchColor="#999999" alpha="0"/></hc:fillBrush>`
          : ''
      }</hh:borderFill>`,
    );
    this.borderIds.set(key, id);
    return id;
  }

  tabs(stops: readonly TabStop[]): number {
    const key = JSON.stringify(stops);
    const cached = this.tabIds.get(key);
    if (cached !== undefined) return cached;
    const id = this.tabXml.length;
    const items = stops
      .map(
        (stop) =>
          `<hh:tabItem pos="${mm(stop.pos) * 2}" type="${stop.type ?? 'LEFT'}" leader="${stop.leader ?? 'NONE'}"/>`,
      )
      .join('');
    this.tabXml.push(`<hh:tabPr id="${id}" autoTabLeft="0" autoTabRight="0">${items}</hh:tabPr>`);
    this.tabIds.set(key, id);
    return id;
  }

  para(spec: ParaSpec = {}): number {
    const key = JSON.stringify(spec);
    const cached = this.paraIds.get(key);
    if (cached !== undefined) return cached;
    const id = this.paraXml.length;
    const align = spec.align ?? 'LEFT';
    const lineSpacing = spec.lineSpacing ?? 160;
    const margin = `<hh:margin><hc:intent value="0" unit="HWPUNIT"/><hc:left value="${mm(spec.left ?? 0)}" unit="HWPUNIT"/><hc:right value="${mm(spec.right ?? 0)}" unit="HWPUNIT"/><hc:prev value="${mm(spec.before ?? 0)}" unit="HWPUNIT"/><hc:next value="${mm(spec.after ?? 0)}" unit="HWPUNIT"/></hh:margin>`;
    const inner = `${margin}<hh:lineSpacing type="PERCENT" value="${lineSpacing}" unit="HWPUNIT"/>`;
    this.paraXml.push(
      `<hh:paraPr id="${id}" tabPrIDRef="${spec.tab ?? 0}" condense="0" fontLineHeight="0" snapToGrid="0" suppressLineNumbers="0" checked="0"><hh:align horizontal="${align}" vertical="BASELINE"/><hh:heading type="NONE" idRef="0" level="0"/><hh:breakSetting breakLatinWord="KEEP_WORD" breakNonLatinWord="KEEP_WORD" widowOrphan="0" keepWithNext="${spec.keepWithNext ? 1 : 0}" keepLines="0" pageBreakBefore="0" lineWrap="BREAK"/><hh:autoSpacing eAsianEng="0" eAsianNum="0"/><hp:switch><hp:case hp:required-namespace="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar">${inner}</hp:case><hp:default>${inner}</hp:default></hp:switch><hh:border borderFillIDRef="${spec.border ?? 1}" offsetLeft="0" offsetRight="0" offsetTop="0" offsetBottom="0" connect="0" ignoreMargin="0"/></hh:paraPr>`,
    );
    this.paraIds.set(key, id);
    return id;
  }

  get headXml(): string {
    const fontfaces = LANGUAGES.map(
      (lang) =>
        `<hh:fontface lang="${lang}" fontCnt="1"><hh:font id="0" face="${FONT_FACE}" type="TTF" isEmbedded="0"><hh:typeInfo familyType="FCAT_GOTHIC" weight="6" proportion="4" contrast="0" strokeVariation="1" armStyle="1" letterform="1" midline="1" xHeight="1"/></hh:font></hh:fontface>`,
    ).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hh:head ${HEAD_NS} version="1.2" secCnt="1"><hh:beginNum page="1" footnote="1" endnote="1" pic="1" tbl="1" equation="1"/><hh:refList><hh:fontfaces itemCnt="7">${fontfaces}</hh:fontfaces><hh:borderFills itemCnt="${this.borderXml.length}">${this.borderXml.join('')}</hh:borderFills><hh:charProperties itemCnt="${this.charXml.length}">${this.charXml.join('')}</hh:charProperties><hh:tabProperties itemCnt="${this.tabXml.length}">${this.tabXml.join('')}</hh:tabProperties>${NUMBERINGS}<hh:paraProperties itemCnt="${this.paraXml.length}">${this.paraXml.join('')}</hh:paraProperties><hh:styles itemCnt="1"><hh:style id="0" type="PARA" name="바탕글" engName="Normal" paraPrIDRef="0" charPrIDRef="0" nextStyleIDRef="0" langID="1042" lockForm="0"/></hh:styles></hh:refList><hh:compatibleDocument targetProgram="HWP201X"><hh:layoutCompatibility/></hh:compatibleDocument><hh:docOption><hh:linkinfo path="" pageInherit="0" footnoteInherit="0"/></hh:docOption><hh:trackchageConfig flags="56"/></hh:head>`;
  }
}

const HEAD_NS = `xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history" xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf/" xmlns:epub="http://www.idpf.org/2007/ops" xmlns:ooxmlchart="http://www.hancom.co.kr/hwpml/2016/ooxmlchart" xmlns:hwpunitchar="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"`;

const NUMBERINGS = `<hh:numberings itemCnt="1"><hh:numbering id="1" start="0"><hh:paraHead start="1" level="1" align="LEFT" useInstWidth="1" autoIndent="1" widthAdjust="0" textOffsetType="PERCENT" textOffset="50" numFormat="DIGIT" charPrIDRef="4294967295" checkable="0">^1.</hh:paraHead><hh:paraHead start="1" level="2" align="LEFT" useInstWidth="1" autoIndent="1" widthAdjust="0" textOffsetType="PERCENT" textOffset="50" numFormat="HANGUL_SYLLABLE" charPrIDRef="4294967295" checkable="0">^2.</hh:paraHead><hh:paraHead start="1" level="3" align="LEFT" useInstWidth="1" autoIndent="1" widthAdjust="0" textOffsetType="PERCENT" textOffset="50" numFormat="DIGIT" charPrIDRef="4294967295" checkable="0">^3)</hh:paraHead><hh:paraHead start="1" level="4" align="LEFT" useInstWidth="1" autoIndent="1" widthAdjust="0" textOffsetType="PERCENT" textOffset="50" numFormat="HANGUL_SYLLABLE" charPrIDRef="4294967295" checkable="0">^4)</hh:paraHead><hh:paraHead start="1" level="5" align="LEFT" useInstWidth="1" autoIndent="1" widthAdjust="0" textOffsetType="PERCENT" textOffset="50" numFormat="DIGIT" charPrIDRef="4294967295" checkable="0">(^5)</hh:paraHead><hh:paraHead start="1" level="6" align="LEFT" useInstWidth="1" autoIndent="1" widthAdjust="0" textOffsetType="PERCENT" textOffset="50" numFormat="HANGUL_SYLLABLE" charPrIDRef="4294967295" checkable="0">(^6)</hh:paraHead><hh:paraHead start="1" level="7" align="LEFT" useInstWidth="1" autoIndent="1" widthAdjust="0" textOffsetType="PERCENT" textOffset="50" numFormat="DIGIT" charPrIDRef="4294967295" checkable="0">^7.</hh:paraHead><hh:paraHead start="1" level="8" align="LEFT" useInstWidth="1" autoIndent="1" widthAdjust="0" textOffsetType="PERCENT" textOffset="50" numFormat="HANGUL_JAMO" charPrIDRef="4294967295" checkable="0"/><hh:paraHead start="1" level="9" align="LEFT" useInstWidth="1" autoIndent="1" widthAdjust="0" textOffsetType="PERCENT" textOffset="50" numFormat="HANGUL_JAMO" charPrIDRef="4294967295" checkable="0"/><hh:paraHead start="1" level="10" align="LEFT" useInstWidth="1" autoIndent="1" widthAdjust="0" textOffsetType="PERCENT" textOffset="50" numFormat="ROMAN_SMALL" charPrIDRef="4294967295" checkable="0"/></hh:numbering></hh:numberings>`;

export const SECTION_NS = HEAD_NS;
