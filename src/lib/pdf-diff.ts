import { type DiffResult, diffLines } from './text-diff';

export type PageDiffType = 'same' | 'changed' | 'added' | 'removed';

export interface PageDiff {
  type: PageDiffType;
  /** 1부터 시작하는 원본 쪽 번호 */
  oldPage?: number;
  /** 1부터 시작하는 수정본 쪽 번호 */
  newPage?: number;
  oldText: string;
  newText: string;
  diff?: DiffResult;
}

export interface PdfDiffStats {
  addedPages: number;
  removedPages: number;
  changedPages: number;
  unchangedPages: number;
  oldPages: number;
  newPages: number;
  addedLines: number;
  removedLines: number;
  changedLines: number;
}

export interface PdfDiffResult {
  pages: PageDiff[];
  stats: PdfDiffStats;
  changed: boolean;
}

interface RawPageOp {
  type: 'same' | 'add' | 'remove';
  oldIndex?: number;
  newIndex?: number;
}

export const MAX_COMPARE_PAGES = 100;

/** 페이지 대응을 찾을 때 쓰는 키. PDF마다 달라지는 줄바꿈·공백을 무시한다. */
export function pageKey(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function lcsOps(oldKeys: string[], newKeys: string[]): RawPageOp[] {
  const n = oldKeys.length;
  const m = newKeys.length;
  const dp: Int32Array[] = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));

  for (let i = n - 1; i >= 0; i -= 1) {
    const row = dp[i];
    const next = dp[i + 1];
    if (!row || !next) continue;
    for (let j = m - 1; j >= 0; j -= 1) {
      row[j] =
        oldKeys[i] === newKeys[j]
          ? (next[j + 1] ?? 0) + 1
          : Math.max(next[j] ?? 0, row[j + 1] ?? 0);
    }
  }

  const ops: RawPageOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (oldKeys[i] === newKeys[j]) {
      ops.push({ type: 'same', oldIndex: i, newIndex: j });
      i += 1;
      j += 1;
    } else if ((dp[i + 1]?.[j] ?? 0) >= (dp[i]?.[j + 1] ?? 0)) {
      ops.push({ type: 'remove', oldIndex: i });
      i += 1;
    } else {
      ops.push({ type: 'add', newIndex: j });
      j += 1;
    }
  }
  while (i < n) {
    ops.push({ type: 'remove', oldIndex: i });
    i += 1;
  }
  while (j < m) {
    ops.push({ type: 'add', newIndex: j });
    j += 1;
  }
  return ops;
}

function toPageDiffs(ops: RawPageOp[], oldPages: string[], newPages: string[]): PageDiff[] {
  const pages: PageDiff[] = [];
  let index = 0;

  while (index < ops.length) {
    const op = ops[index];
    if (!op) break;
    if (op.type === 'same') {
      const oldText = oldPages[op.oldIndex ?? -1] ?? '';
      const newText = newPages[op.newIndex ?? -1] ?? '';
      pages.push({
        type: 'same',
        oldPage: (op.oldIndex ?? 0) + 1,
        newPage: (op.newIndex ?? 0) + 1,
        oldText,
        newText,
      });
      index += 1;
      continue;
    }

    const removes: number[] = [];
    const adds: number[] = [];
    while (index < ops.length && ops[index]?.type !== 'same') {
      const current = ops[index];
      if (!current) break;
      if (current.type === 'remove' && current.oldIndex !== undefined)
        removes.push(current.oldIndex);
      else if (current.type === 'add' && current.newIndex !== undefined)
        adds.push(current.newIndex);
      index += 1;
    }

    const pairs = Math.min(removes.length, adds.length);
    for (let pair = 0; pair < pairs; pair += 1) {
      const oldIndex = removes[pair];
      const newIndex = adds[pair];
      if (oldIndex === undefined || newIndex === undefined) continue;
      const oldText = oldPages[oldIndex] ?? '';
      const newText = newPages[newIndex] ?? '';
      pages.push({
        type: 'changed',
        oldPage: oldIndex + 1,
        newPage: newIndex + 1,
        oldText,
        newText,
        diff: diffLines(oldText, newText, { ignoreWhitespace: true }),
      });
    }
    for (let rest = pairs; rest < removes.length; rest += 1) {
      const oldIndex = removes[rest];
      if (oldIndex === undefined) continue;
      pages.push({
        type: 'removed',
        oldPage: oldIndex + 1,
        oldText: oldPages[oldIndex] ?? '',
        newText: '',
      });
    }
    for (let rest = pairs; rest < adds.length; rest += 1) {
      const newIndex = adds[rest];
      if (newIndex === undefined) continue;
      pages.push({
        type: 'added',
        newPage: newIndex + 1,
        oldText: '',
        newText: newPages[newIndex] ?? '',
      });
    }
  }

  return pages;
}

function statsFor(pages: PageDiff[], oldCount: number, newCount: number): PdfDiffStats {
  let addedPages = 0;
  let removedPages = 0;
  let changedPages = 0;
  let unchangedPages = 0;
  let addedLines = 0;
  let removedLines = 0;
  let changedLines = 0;

  for (const page of pages) {
    if (page.type === 'added') addedPages += 1;
    else if (page.type === 'removed') removedPages += 1;
    else if (page.type === 'changed') {
      changedPages += 1;
      addedLines += page.diff?.stats.added ?? 0;
      removedLines += page.diff?.stats.removed ?? 0;
      changedLines += page.diff?.stats.changed ?? 0;
    } else unchangedPages += 1;
  }

  return {
    addedPages,
    removedPages,
    changedPages,
    unchangedPages,
    oldPages: oldCount,
    newPages: newCount,
    addedLines,
    removedLines,
    changedLines,
  };
}

/** 두 PDF의 페이지 텍스트를 페이지 단위로 맞춘 뒤 바뀐 쪽의 줄 diff를 만든다. */
export function comparePdfPages(oldPages: string[], newPages: string[]): PdfDiffResult {
  if (oldPages.length > MAX_COMPARE_PAGES || newPages.length > MAX_COMPARE_PAGES) {
    throw new Error(`한 번에 ${MAX_COMPARE_PAGES}쪽까지 비교할 수 있습니다.`);
  }

  const oldKeys = oldPages.map(pageKey);
  const newKeys = newPages.map(pageKey);
  const pages = toPageDiffs(lcsOps(oldKeys, newKeys), oldPages, newPages);
  const stats = statsFor(pages, oldPages.length, newPages.length);
  return {
    pages,
    stats,
    changed: stats.addedPages + stats.removedPages + stats.changedPages > 0,
  };
}

export function totalTextLength(pages: string[]): number {
  return pages.reduce((sum, text) => sum + text.replace(/\s/g, '').length, 0);
}

export function pdfDiffSummary(stats: PdfDiffStats): string {
  if (stats.addedPages + stats.removedPages + stats.changedPages === 0) {
    return '두 PDF의 페이지 텍스트가 같습니다.';
  }
  const parts: string[] = [];
  if (stats.changedPages > 0) parts.push(`바뀐 쪽 ${stats.changedPages}`);
  if (stats.addedPages > 0) parts.push(`추가된 쪽 ${stats.addedPages}`);
  if (stats.removedPages > 0) parts.push(`삭제된 쪽 ${stats.removedPages}`);
  return `${parts.join(' · ')} — 그대로인 쪽 ${stats.unchangedPages}`;
}

export function pdfDiffFileName(oldName: string, newName: string): string {
  const clean = (value: string) =>
    value
      .replace(/\.pdf$/i, '')
      .replace(/[\\/:*?"<>|]+/g, '_')
      .trim()
      .slice(0, 60) || 'document';
  return `${clean(oldName)}-vs-${clean(newName)}-diff.txt`;
}
