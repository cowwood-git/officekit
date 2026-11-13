import { normalizeRotation } from './pdf-organize';
import { parsePageRanges } from './pdf-split';

/**
 * PDF 페이지 정리의 "쪽 번호로 한 번에" 동작(목적별 페이지: 삭제·추출·회전).
 * 쪽 번호는 언제나 원본 기준이다 — 사용자가 원본을 보며 번호를 적기 때문이다.
 */
export type QuickMode = 'delete' | 'extract' | 'rotate';

interface QuickPage {
  originalIndex: number;
  rotation: number;
}

export interface QuickOptions {
  mode: QuickMode;
  range: string;
  pageCount: number;
  /** rotate 일 때 더할 각도(90·180·270) */
  angle?: number;
}

export interface QuickOutcome<T> {
  items: T[];
  message: string;
  error?: string;
}

export function applyQuickAction<T extends QuickPage>(
  items: T[],
  options: QuickOptions,
): QuickOutcome<T> {
  const { mode, range, pageCount, angle = 90 } = options;
  const fail = (error: string): QuickOutcome<T> => ({ items, message: '', error });

  // 회전은 비워 두면 전체를 돌린다.
  if (mode === 'rotate' && range.trim() === '') {
    const rotated = items.map((item) => ({
      ...item,
      rotation: normalizeRotation(item.rotation + angle),
    }));
    return { items: rotated, message: `모든 쪽을 ${angle}° 돌렸습니다.` };
  }
  if (range.trim() === '') return fail('쪽 번호를 적어 주세요. 예: 2, 5-7');

  const parsed = parsePageRanges(range, pageCount);
  if (parsed.errors.length > 0) return fail(parsed.errors[0] ?? '쪽 번호를 확인해 주세요.');
  const wanted = new Set(parsed.pages);

  if (mode === 'delete') {
    const kept = items.filter((item) => !wanted.has(item.originalIndex + 1));
    if (kept.length === 0) return fail('모든 쪽을 지울 수는 없습니다. 한 쪽 이상 남겨 주세요.');
    const removed = items.length - kept.length;
    if (removed === 0) return fail('적은 쪽이 이미 목록에 없습니다.');
    return { items: kept, message: `${removed}쪽을 지웠습니다. 남은 쪽: ${kept.length}쪽` };
  }

  if (mode === 'extract') {
    const byPage = new Map(items.map((item) => [item.originalIndex + 1, item]));
    const picked = parsed.pages
      .map((page) => byPage.get(page))
      .filter((item): item is T => Boolean(item));
    if (picked.length === 0) return fail('적은 쪽이 이미 목록에 없습니다.');
    return {
      items: picked,
      message: `${picked.length}쪽만 남겼습니다. 적은 순서대로 정렬했습니다.`,
    };
  }

  let count = 0;
  const rotated = items.map((item) => {
    if (!wanted.has(item.originalIndex + 1)) return item;
    count += 1;
    return { ...item, rotation: normalizeRotation(item.rotation + angle) };
  });
  if (count === 0) return fail('적은 쪽이 이미 목록에 없습니다.');
  return { items: rotated, message: `${count}쪽을 ${angle}° 돌렸습니다.` };
}
