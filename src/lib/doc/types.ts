/**
 * 양식 템플릿과 문서 출력(DisplayList) 타입.
 *
 * 템플릿은 데이터고, 렌더링은 하나다. 양식을 추가할 때 PDF 코드를 복사하지 않고
 * blocks만 조합한다(src/lib/doc/layout.ts).
 */

import type { Align, Weight } from './theme';

export type FormFamily =
  | 'finance'
  | 'hr'
  | 'sales'
  | 'report'
  | 'operations'
  | 'admin'
  | 'certificate'
  | 'proof'
  | 'label';

export type FormCategory = 'people' | 'money' | 'report' | 'proof' | 'award' | 'print';

export type FieldType = 'text' | 'textarea' | 'date' | 'select' | 'number' | 'computed' | 'roles';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  group: string;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: readonly string[];
  defaultValue?: string;
  /** 작성일처럼 페이지를 열 때 오늘 날짜로 채울 필드. */
  defaultToday?: boolean;
  maxLength?: number;
  rows?: number;
  /** roles 필드에서 선택할 수 있는 최대 개수. */
  maxSelected?: number;
  /** roles 필드의 이름을 직접 입력할 수 있게 한다. */
  editable?: boolean;
  /** 3열 그리드에서 차지하는 칸 수. */
  span?: 1 | 2 | 3;
}

export interface FormFaq {
  q: string;
  a: string;
}

export interface FormSource {
  label: string;
  href: string;
}

export interface FormLink {
  label: string;
  href: string;
}

export type FormValues = Record<string, string>;

/** 반복 입력(품목·지출 내역) 한 줄. 열 id → 값. */
export type FormRow = Record<string, string>;

/** 반복 그룹 id → 줄 목록. */
export type FormRows = Record<string, FormRow[]>;

export type RepeatColumnType = 'text' | 'date' | 'number' | 'money' | 'select' | 'computed';

export interface RepeatColumn {
  id: string;
  label: string;
  type: RepeatColumnType;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  /** select 열의 선택지. */
  options?: readonly string[];
  /** number 열의 증분. 반차(0.5)처럼 소수 입력이 필요할 때. */
  step?: number;
  /** 화면 그리드 비율. 기본 1. */
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface RepeatGroup {
  id: string;
  label: string;
  /** 입력 화면에서 이 그룹을 어느 입력 그룹 뒤에 놓을지. 문서 순서와 맞춘다. */
  group?: string;
  help?: string;
  columns: readonly RepeatColumn[];
  minRows?: number;
  maxRows?: number;
  addLabel?: string;
  /** 한 줄 이상 입력해야 하는 그룹. */
  required?: boolean;
  /** 행 단위 파생값(금액 등)을 계산한다. */
  computeRow?: (row: FormRow) => FormRow;
  /** 합계처럼 계산 결과를 그룹 아래에 보여 줄 필드 id. */
  summaryField?: string;
  summaryLabel?: string;
}

export interface KvRow {
  label: string;
  field?: string;
  value?: string;
}

export interface TableColumn {
  label: string;
  /** 열 이름을 필드 값으로 바꾼다. 빈 표에서 사용자가 열 이름을 정할 때. */
  labelField?: string;
  /** mm. 합이 본문 폭과 다르면 비율로 맞춘다. */
  width: number;
  align?: Align;
  /** 확인란을 벡터로 그린다. 셀 값이 있으면 체크 표시. */
  checkbox?: boolean;
}

export type TableRows = readonly (readonly string[])[];
export type TableRowsSource = TableRows | ((values: FormValues, rows: FormRows) => TableRows);

export interface PartyBox {
  label: string;
  lines: readonly string[] | ((values: FormValues) => readonly string[]);
}

/** 라벨·명찰·티켓처럼 한 칸에 담는 내용. */
export interface LabelSlot {
  /** 상단 작은 라벨. 예: 행사명, ADMIT ONE, INVITATION */
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  lines?: readonly string[];
  note?: string;
  /** 명찰 역할·티켓 번호처럼 오른쪽에 강조하는 값. */
  tag?: string;
}

/** 인쇄 카드의 시각 스타일. */
export type LabelDesign = 'plain' | 'badge' | 'invitation' | 'ticket';

export type FormBlock =
  | {
      kind: 'header';
      title: string;
      /** 제목을 필드 값으로 바꾼다. 비어 있으면 title을 쓴다. */
      titleField?: string;
      docNoField?: string;
      dateField?: string;
      /** 기본 '문서번호'. 증명서는 '발급번호'처럼 바꾼다. */
      docNoLabel?: string;
      /** 기본 '작성일'. 증명서는 '발급일'처럼 바꾼다. */
      dateLabel?: string;
      /** 회사 프리셋 로고를 상단 왼쪽에 그린다. */
      logo?: boolean;
      /** classic: 가운데 제목 · editorial: 문서번호 위, 제목 왼쪽, 하단 분류·작성일. */
      variant?: 'classic' | 'editorial';
    }
  | { kind: 'section'; title: string; note?: string; hideInBlank?: boolean }
  | { kind: 'kv'; columns: 1 | 2 | 3; rows: readonly KvRow[]; hideInBlank?: boolean }
  | { kind: 'text'; label?: string; field: string; minLines?: number }
  | {
      kind: 'parties';
      left: PartyBox;
      right: PartyBox;
      /** 상자 최소 줄 수. 기본 5. */
      minLines?: number;
      /** 상자 최소 높이(mm). 기본 테마값. */
      minHeight?: number;
    }
  | {
      kind: 'table';
      columns: readonly TableColumn[];
      rows: TableRowsSource;
      /** 빈 양식에서 최소로 그릴 행 수. */
      minRows?: number;
      /** 빈 양식에서만 적용할 최소 행 수. 인쇄용 빈 표에 유용하다. */
      blankMinRows?: number;
      /** 표시할 열 수를 필드 값으로 정한다. 나머지 열은 PDF에서 제외한다. */
      columnCountField?: string;
      /** 세로 구분선까지 그린다. 빈 표·체크리스트처럼 칸을 보여야 할 때. */
      grid?: boolean;
    }
  | {
      kind: 'totals';
      rows: readonly { label: string; value?: string; field?: string; strong?: boolean }[];
      /** mm. 기본 70mm. */
      width?: number;
    }
  | {
      kind: 'signature';
      roles?: readonly string[];
      rolesField?: string;
      formal?: boolean;
      bottom?: boolean;
      /** 회사 프리셋 도장을 첫 번째 칸에 그린다. */
      seal?: boolean;
    }
  | { kind: 'checklist'; items?: readonly string[]; field?: string; columns?: 1 | 2 }
  | {
      kind: 'paragraph';
      /** 고정 문장. field와 함께 쓰면 field 값이 우선한다. */
      text?: string;
      field?: string;
      align?: Align;
      /** pt. 기본 본문 크기. */
      size?: number;
      bold?: boolean;
      color?: string;
      /** 빈 양식에서 필드 자리에 그릴 점선 길이(mm). */
      blankLine?: number;
      /** 위·아래 여백(mm). */
      before?: number;
      after?: number;
    }
  | {
      kind: 'divider';
      /** mm. 기본 30. */
      width?: number;
      color?: string;
      /** mm. 기본 0.5. */
      thickness?: number;
      before?: number;
      after?: number;
    }
  | {
      kind: 'issuer';
      dateField?: string;
      companyField?: string;
      ceoField?: string;
      /** 회사 프리셋 도장을 서명 옆에 그린다. */
      seal?: boolean;
      align?: 'center' | 'right';
      /** 페이지 아래쪽에 붙인다. 증명서·상장의 서명부. */
      bottom?: boolean;
      before?: number;
      after?: number;
    }
  | { kind: 'notice'; text: string }
  | {
      kind: 'labelGrid';
      /** 카드 디자인. 기본은 plain. */
      design?: LabelDesign;
      columns: 1 | 2 | 3 | 4;
      rows: 1 | 2 | 3 | 4 | 5 | 6;
      gap?: number;
      padding?: number;
      cutLines?: boolean;
      /** HWPX 표의 행 높이(mm). 기본 42. */
      rowHeight?: number;
      slots: (values: FormValues, rows: FormRows) => readonly LabelSlot[];
    }
  | { kind: 'spacer'; height: number }
  | { kind: 'pageBreak'; title?: string; note?: string };

/** 문서 엔진이 필요로 하는 최소 명세. 양식 페이지의 SEO 정보와 분리한다. */
export interface DocumentSpec {
  fields: readonly FormField[];
  groups?: readonly RepeatGroup[];
  blocks: readonly FormBlock[];
  /** 수료증·상장처럼 문서 전체를 테두리로 감쌀 때. */
  frame?: {
    /** 페이지 가장자리에서 띄우는 거리(mm). 기본 12. */
    inset?: number;
    /** 바깥 테두리와 안쪽 테두리 사이(mm). 기본 3. */
    gap?: number;
    color?: string;
  };
  /** 바닥글(구분선·페이지 번호)을 숨긴다. 액자형 문서는 false. */
  showFooter?: boolean;
  /** 본문/붙임처럼 배치에 따라 블록 구성이 달라질 때. */
  buildBlocks?: (options: { attachment: boolean }) => readonly FormBlock[];
  compute?: (values: FormValues, rows: FormRows) => FormValues;
  footer?: string;
}

export interface FormTemplate extends DocumentSpec {
  slug: string;
  title: string;
  family: FormFamily;
  /** 홈·양식관·검색에서 쓰는 탐색 카테고리. */
  category: FormCategory;
  description: string;
  keywords: readonly string[];
  updated: string;
  /** 문서 번호 접두사. 예: L → L-20261114-001 */
  docPrefix?: string;
  /** 회사 프리셋을 적용할 당사자. 견적서·거래명세서는 supplier, 발주서는 buyer, 증명서는 issuer. */
  companyParty?: 'supplier' | 'buyer' | 'issuer';
  lead: string;
  useCases: readonly string[];
  howTo: readonly string[];
  notes: readonly string[];
  sample: Readonly<FormValues>;
  /** 예시 채우기에서 함께 채울 반복 입력. */
  sampleRows?: FormRows;
  /** 필수 항목 외에 템플릿별로 확인할 규칙. */
  validate?: (values: FormValues, rows: FormRows) => string[];
  faq: readonly FormFaq[];
  sources: readonly FormSource[];
  related?: readonly FormLink[];
}

/** 이미지 자산(로고·도장). width/height는 원본 픽셀. */
export interface DocImageAsset {
  src: string;
  width: number;
  height: number;
}

export interface DocAssets {
  logo?: DocImageAsset;
  seal?: DocImageAsset;
}

/** 문서에 그릴 수 있는 최소 단위. PDF와 SVG가 같은 목록을 그린다. */
export interface DocTextOp {
  kind: 'text';
  /** left/center/right 정렬의 기준점. 단위 mm. */
  x: number;
  /** 글자 baseline. 단위 mm, 위에서부터. */
  y: number;
  text: string;
  size: number;
  weight: Weight;
  color: string;
  align: Align;
}

export interface DocLineOp {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  color: string;
  dash?: readonly [number, number];
}

export interface DocRectOp {
  kind: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface DocImageOp {
  kind: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

export type DocOp = DocTextOp | DocLineOp | DocRectOp | DocImageOp;

export interface DocPage {
  width: number;
  height: number;
  ops: DocOp[];
}

export interface DocMetrics {
  /** 글자 폭(mm). 템플릿 레이아웃 단계에서 한 번만 잰다. */
  widthOf: (text: string, sizePt: number, weight: Weight) => number;
}
