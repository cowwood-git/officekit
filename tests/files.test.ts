import { describe, expect, it } from 'vitest';
import {
  fitWithin,
  formatBytes,
  MAX_TOTAL_BYTES,
  moveBy,
  moveItem,
  replaceExtension,
  safeFileName,
  savingsPercent,
  validateImageSelection,
  validatePdfSelection,
} from '../src/lib/files';

describe('formatBytes', () => {
  it('bytes / KB / MB 단위로 표시한다', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
  });
});

describe('validatePdfSelection', () => {
  it('PDF만 있으면 통과한다', () => {
    const result = validatePdfSelection([
      { name: 'a.pdf', size: 100, type: 'application/pdf' },
      { name: 'b.PDF', size: 200 },
    ]);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('PDF가 아닌 파일을 잡아낸다', () => {
    const result = validatePdfSelection([{ name: 'photo.jpg', size: 100, type: 'image/jpeg' }]);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('photo.jpg');
  });

  it('빈 선택을 거부한다', () => {
    expect(validatePdfSelection([]).ok).toBe(false);
  });

  it('전체 용량 제한을 넘으면 거부한다', () => {
    const result = validatePdfSelection([
      { name: 'big.pdf', size: MAX_TOTAL_BYTES + 1, type: 'application/pdf' },
    ]);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('용량');
  });
});

describe('moveItem / moveBy', () => {
  const items = ['a', 'b', 'c'];

  it('항목을 위로 이동한다', () => {
    expect(moveBy(items, 1, -1)).toEqual(['b', 'a', 'c']);
  });

  it('항목을 아래로 이동한다', () => {
    expect(moveBy(items, 1, 1)).toEqual(['a', 'c', 'b']);
  });

  it('범위를 벗어나면 그대로 둔다', () => {
    expect(moveBy(items, 0, -1)).toEqual(['a', 'b', 'c']);
    expect(moveBy(items, 2, 1)).toEqual(['a', 'b', 'c']);
  });

  it('원본 배열을 바꾸지 않는다', () => {
    const copy = [...items];
    moveItem(items, 0, 2);
    expect(items).toEqual(copy);
  });
});

describe('fitWithin', () => {
  it('원본이 작으면 키우지 않는다', () => {
    expect(fitWithin({ width: 800, height: 600 }, 1600)).toEqual({ width: 800, height: 600 });
  });

  it('가로 사진의 비율을 유지한다', () => {
    expect(fitWithin({ width: 4000, height: 3000 }, 1600)).toEqual({ width: 1600, height: 1200 });
  });

  it('세로 사진의 비율을 유지한다', () => {
    expect(fitWithin({ width: 3000, height: 4000 }, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('0 이하이면 원본을 유지한다', () => {
    expect(fitWithin({ width: 100, height: 50 }, 0)).toEqual({ width: 100, height: 50 });
  });
});

describe('replaceExtension', () => {
  it('확장자를 바꾼다', () => {
    expect(replaceExtension('report.final.pdf', 'jpg')).toBe('report.final.jpg');
    expect(replaceExtension('photo', '.webp')).toBe('photo.webp');
  });
});

describe('savingsPercent', () => {
  it('절감률을 반올림한다', () => {
    expect(savingsPercent(1000, 250)).toBe(75);
    expect(savingsPercent(0, 0)).toBe(0);
    expect(savingsPercent(100, 120)).toBe(-20);
  });
});

describe('safeFileName', () => {
  it('파일명에 쓸 수 없는 문자를 바꾼다', () => {
    expect(safeFileName('a/b:c*?.pdf')).toBe('a_b_c_.pdf');
    expect(safeFileName('')).toBe('file');
  });
});

describe('validateImageSelection', () => {
  it('JPG·PNG·WebP 를 허용한다', () => {
    const result = validateImageSelection([
      { name: 'a.jpg', size: 100, type: 'image/jpeg' },
      { name: 'b.PNG', size: 100, type: 'image/png' },
      { name: 'c.webp', size: 100, type: 'image/webp' },
    ]);
    expect(result.ok).toBe(true);
  });

  it('GIF·HEIC 를 거부한다', () => {
    const result = validateImageSelection([
      { name: 'a.gif', size: 100, type: 'image/gif' },
      { name: 'b.heic', size: 100, type: 'image/heic' },
    ]);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('a.gif');
  });

  it('30장을 넘으면 거부한다', () => {
    const files = Array.from({ length: 31 }, (_, index) => ({
      name: `${index}.jpg`,
      size: 10,
      type: 'image/jpeg',
    }));
    expect(validateImageSelection(files).ok).toBe(false);
  });

  it('전체 용량이 50MB를 넘으면 거부한다', () => {
    const result = validateImageSelection([
      { name: 'big.jpg', size: 50 * 1024 * 1024 + 1, type: 'image/jpeg' },
    ]);
    expect(result.ok).toBe(false);
  });
});
