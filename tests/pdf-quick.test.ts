import { describe, expect, it } from 'vitest';
import { applyQuickAction } from '../src/lib/pdf-quick';

const pages = (n: number) =>
  Array.from({ length: n }, (_, index) => ({ id: `p${index}`, originalIndex: index, rotation: 0 }));

describe('applyQuickAction', () => {
  it('지울 쪽을 원본 번호로 지운다', () => {
    const out = applyQuickAction(pages(6), { mode: 'delete', range: '2, 4-5', pageCount: 6 });
    expect(out.error).toBeUndefined();
    expect(out.items.map((item) => item.originalIndex + 1)).toEqual([1, 3, 6]);
  });

  it('모든 쪽을 지우지는 못한다', () => {
    const out = applyQuickAction(pages(3), { mode: 'delete', range: '1-3', pageCount: 3 });
    expect(out.error).toMatch(/모든 쪽/);
    expect(out.items).toHaveLength(3);
  });

  it('남길 쪽을 적은 순서대로 고른다', () => {
    const out = applyQuickAction(pages(6), { mode: 'extract', range: '5, 1-2', pageCount: 6 });
    expect(out.items.map((item) => item.originalIndex + 1)).toEqual([5, 1, 2]);
  });

  it('적은 쪽만 돌리고, 비우면 전체를 돌린다', () => {
    const some = applyQuickAction(pages(3), {
      mode: 'rotate',
      range: '2',
      pageCount: 3,
      angle: 180,
    });
    expect(some.items.map((item) => item.rotation)).toEqual([0, 180, 0]);
    const all = applyQuickAction(pages(2), { mode: 'rotate', range: '', pageCount: 2, angle: 270 });
    expect(all.items.map((item) => item.rotation)).toEqual([270, 270]);
  });

  it('범위를 벗어나면 알린다', () => {
    const out = applyQuickAction(pages(3), { mode: 'delete', range: '9', pageCount: 3 });
    expect(out.error).toBeTruthy();
  });

  it('이미 지운 쪽은 다시 지울 수 없다고 알린다', () => {
    const after = pages(4).filter((item) => item.originalIndex !== 1);
    const out = applyQuickAction(after, { mode: 'delete', range: '2', pageCount: 4 });
    expect(out.error).toMatch(/목록에 없/);
  });
});
