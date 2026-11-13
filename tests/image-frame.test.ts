import { describe, expect, it } from 'vitest';
import { clampFrame, DEFAULT_FRAME, frameFileName, frameOutputSize } from '../src/lib/image-frame';

describe('frameOutputSize', () => {
  it('여백만큼 양쪽으로 늘린다', () => {
    expect(frameOutputSize(1200, 800, 24)).toEqual({ width: 1248, height: 848 });
    expect(frameOutputSize(100, 100, 0)).toEqual({ width: 100, height: 100 });
  });

  it('여백을 안전한 범위로 제한한다', () => {
    expect(frameOutputSize(100, 100, 999)).toEqual({ width: 900, height: 900 });
    expect(frameOutputSize(100, 100, -10)).toEqual({ width: 100, height: 100 });
  });
});

describe('clampFrame', () => {
  it('각 옵션을 제한한다', () => {
    const frame = clampFrame({
      radius: -5,
      borderWidth: 999,
      padding: -3,
      shadowBlur: 999,
    });
    expect(frame.radius).toBe(0);
    expect(frame.borderWidth).toBe(80);
    expect(frame.padding).toBe(0);
    expect(frame.shadowBlur).toBe(100);
  });

  it('빈 값은 기본값', () => {
    expect(clampFrame({})).toEqual(DEFAULT_FRAME);
  });
});

describe('frameFileName', () => {
  it('PNG 파일명을 만든다', () => {
    expect(frameFileName('사진.jpg')).toBe('사진-frame.png');
  });
});
