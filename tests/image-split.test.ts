import { describe, expect, it } from 'vitest';
import { splitFileName, splitRects } from '../src/lib/image-split';

describe('splitRects', () => {
  it('2×2로 나누면 4개 조각이 된다', () => {
    const tiles = splitRects(1200, 800, 2, 2);
    expect(tiles).toHaveLength(4);
    expect(tiles[0]).toMatchObject({ row: 0, col: 0, width: 600, height: 400 });
    expect(tiles[1]).toMatchObject({ row: 0, col: 1, x: 600, width: 600 });
    expect(tiles[2]).toMatchObject({ row: 1, col: 0, y: 400 });
  });

  it('나누어떨어지지 않아도 전체를 덮는다', () => {
    const tiles = splitRects(1000, 1000, 3, 3);
    const covered = tiles.reduce((sum, tile) => sum + tile.width * tile.height, 0);
    expect(covered).toBe(1_000_000);
    expect(tiles).toHaveLength(9);
  });

  it('행·열을 안전한 범위로 보정한다', () => {
    expect(splitRects(100, 100, 0, 0)).toHaveLength(1);
    expect(splitRects(100, 100, 99, 99)).toHaveLength(100);
  });
});

describe('splitFileName', () => {
  it('번호를 0으로 채운다', () => {
    expect(splitFileName(0, 2, 2)).toBe('part-01.png');
    expect(splitFileName(8, 3, 3)).toBe('part-09.png');
  });
});
