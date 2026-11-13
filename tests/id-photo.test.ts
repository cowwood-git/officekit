import { describe, expect, it } from 'vitest';
import {
  clampOffset,
  idPhotoFileName,
  mmToPx,
  PHOTO_PRESETS,
  placement,
  presetById,
  sheetLayout,
} from '../src/lib/id-photo';

describe('id-photo', () => {
  it('규격을 300dpi 픽셀로 바꾼다', () => {
    const passport = presetById('passport');
    expect([mmToPx(passport.widthMm), mmToPx(passport.heightMm)]).toEqual([413, 531]);
    expect(presetById('없음')).toBe(PHOTO_PRESETS[0]);
  });

  it('배율 1은 틀을 꽉 채우고 가운데 놓는다', () => {
    const p = placement(1000, 1000, 300, 400, { zoom: 1, offsetX: 0, offsetY: 0 });
    expect(p.width).toBe(400);
    expect(p.height).toBe(400);
    expect(p.x).toBe(-50);
    expect(p.y).toBe(0);
    const moved = placement(1000, 1000, 300, 400, { zoom: 1, offsetX: 0.1, offsetY: -0.1 });
    expect(moved.x).toBe(-20);
    expect(moved.y).toBe(-40);
  });

  it('이동량을 묶는다', () => {
    const view = clampOffset(1000, 1000, 300, 400, { zoom: 1, offsetX: 5, offsetY: -5 });
    expect(view.offsetX).toBeLessThan(1);
    expect(view.offsetY).toBeGreaterThan(-1);
  });

  it('4×6 인화지 배치', () => {
    const half = sheetLayout({ width: 30, height: 40 });
    expect(half.columns).toBe(3);
    expect(half.rows).toBe(3);
    expect(half.positions).toHaveLength(9);
    const passport = sheetLayout({ width: 35, height: 45 });
    expect(passport.columns * passport.rows).toBe(6);
    for (const { x, y } of passport.positions) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x + 35).toBeLessThanOrEqual(101.6);
      expect(y + 45).toBeLessThanOrEqual(152.4);
    }
  });

  it('파일 이름', () => {
    expect(idPhotoFileName('me.png', presetById('half'), false)).toBe('me-3x4cm.jpg');
    expect(idPhotoFileName('me.png', presetById('passport'), true)).toBe('me-3.5x4.5cm-4x6.jpg');
  });
});
