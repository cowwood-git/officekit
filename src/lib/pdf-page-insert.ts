import { safeFileName } from './files';
import { formatPageList, parsePageRanges } from './pdf-split';

export type PageInsertMode = 'insert' | 'replace';

export interface PagePlanOptions {
  mode: PageInsertMode;
  /** 원본 PDF 쪽 수 */
  baseCount: number;
  /** 끼워 넣을 PDF 쪽 수 */
  sourceCount: number;
  /** insert 모드: 이 쪽 뒤에 넣는다. 0이면 맨 앞, baseCount면 맨 뒤. */
  insertAfter: number;
  /** replace 모드: 원본에서 바꿀 쪽 범위 */
  baseRange: string;
  /** 끼워 넣을 PDF에서 가져올 쪽 범위. 비우면 전체. */
  sourceRange: string;
}

export type PageOp = { kind: 'base'; index: number } | { kind: 'source'; index: number };

export interface PageSegment {
  kind: 'base' | 'source';
  /** 1부터 시작하는 쪽 번호 목록 */
  pages: number[];
}

export interface PagePlan {
  ops: PageOp[];
  segments: PageSegment[];
  /** 결과 쪽 수 */
  resultCount: number;
  /** 교체 모드에서 바뀐 원본 쪽 수 */
  replacedCount: number;
  sourcePages: number[];
  errors: string[];
  summary: string;
}

function fail(error: string): PagePlan {
  return {
    ops: [],
    segments: [],
    resultCount: 0,
    replacedCount: 0,
    sourcePages: [],
    errors: [error],
    summary: '',
  };
}

function segmentsFor(ops: PageOp[]): PageSegment[] {
  const segments: PageSegment[] = [];
  for (const op of ops) {
    const page = op.index + 1;
    const last = segments[segments.length - 1];
    if (last && last.kind === op.kind && last.pages[last.pages.length - 1] === page - 1) {
      last.pages.push(page);
    } else {
      segments.push({ kind: op.kind, pages: [page] });
    }
  }
  return segments;
}

/** 삽입·교체 결과의 쪽 순서를 계산한다. 실제 PDF 조립은 이 순서를 그대로 따른다. */
export function buildPagePlan(options: PagePlanOptions): PagePlan {
  const { mode, baseCount, sourceCount, insertAfter, baseRange, sourceRange } = options;
  if (!Number.isInteger(baseCount) || baseCount < 1)
    return fail('원본 PDF 쪽 수를 확인할 수 없습니다.');
  if (!Number.isInteger(sourceCount) || sourceCount < 1)
    return fail('끼워 넣을 PDF 쪽 수를 확인할 수 없습니다.');

  const parsedSource =
    sourceRange.trim() === ''
      ? { pages: Array.from({ length: sourceCount }, (_, index) => index + 1), errors: [] }
      : parsePageRanges(sourceRange, sourceCount);
  if (parsedSource.errors.length > 0) {
    return fail(parsedSource.errors[0] ?? '끼워 넣을 쪽 범위를 확인하세요.');
  }
  if (parsedSource.pages.length === 0) return fail('끼워 넣을 쪽이 없습니다.');

  if (mode === 'insert') {
    if (!Number.isInteger(insertAfter) || insertAfter < 0 || insertAfter > baseCount) {
      return fail(
        `삽입 위치는 0~${baseCount} 사이여야 합니다. 0은 맨 앞, ${baseCount}는 맨 뒤입니다.`,
      );
    }
    const ops: PageOp[] = [];
    for (let index = 0; index < insertAfter; index += 1) ops.push({ kind: 'base', index });
    for (const page of parsedSource.pages) ops.push({ kind: 'source', index: page - 1 });
    for (let index = insertAfter; index < baseCount; index += 1) ops.push({ kind: 'base', index });

    return {
      ops,
      segments: segmentsFor(ops),
      resultCount: ops.length,
      replacedCount: 0,
      sourcePages: parsedSource.pages,
      errors: [],
      summary: `${parsedSource.pages.length}쪽을 ${insertPositionLabel(insertAfter, baseCount)}에 넣어 ${ops.length}쪽이 됩니다.`,
    };
  }

  const parsedBase = parsePageRanges(baseRange, baseCount);
  if (parsedBase.errors.length > 0) {
    return fail(parsedBase.errors[0] ?? '바꿀 쪽 범위를 확인하세요.');
  }
  const sortedBase = [...parsedBase.pages].sort((a, b) => a - b);
  const start = sortedBase[0];
  const end = sortedBase[sortedBase.length - 1];
  if (start === undefined || end === undefined) return fail('바꿀 쪽을 적어 주세요.');
  if (sortedBase.length !== end - start + 1) {
    return fail('교체할 쪽은 연속된 범위로 적어 주세요. 예: 2-3');
  }

  const ops: PageOp[] = [];
  for (let index = 0; index < start - 1; index += 1) ops.push({ kind: 'base', index });
  for (const page of parsedSource.pages) ops.push({ kind: 'source', index: page - 1 });
  for (let index = end; index < baseCount; index += 1) ops.push({ kind: 'base', index });

  return {
    ops,
    segments: segmentsFor(ops),
    resultCount: ops.length,
    replacedCount: sortedBase.length,
    sourcePages: parsedSource.pages,
    errors: [],
    summary: `${formatPageList(sortedBase)}쪽을 ${parsedSource.pages.length}쪽으로 바꿔 ${ops.length}쪽이 됩니다.`,
  };
}

export function insertPositionLabel(insertAfter: number, baseCount: number): string {
  if (insertAfter <= 0) return '맨 앞';
  if (insertAfter >= baseCount) return '맨 뒤';
  return `${insertAfter}쪽 뒤`;
}

export function insertFileName(originalName: string): string {
  const base = safeFileName(originalName.replace(/\.pdf$/i, '')) || 'document';
  return `${base}-page-edit.pdf`;
}

/** 화면 요약: "기본 1-3 · 삽입 1-2 · 기본 4-10" */
export function segmentLabel(segment: PageSegment, insertMode: PageInsertMode): string {
  const prefix = segment.kind === 'base' ? '기본' : insertMode === 'insert' ? '삽입' : '교체';
  return `${prefix} ${formatPageList(segment.pages)}`;
}
