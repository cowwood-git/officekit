import { describe, expect, it } from 'vitest';
import {
  displayedSize,
  normalizeRotation,
  overlaySize,
  preRotationFor,
  watermarkFileName,
  watermarkSummary,
} from '../src/lib/pdf-watermark';

describe('normalizeRotation', () => {
  it('90도 단위로 정규화한다', () => {
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(90)).toBe(90);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(360)).toBe(0);
  });

  it('잘못된 값은 0으로 본다', () => {
    expect(normalizeRotation(Number.NaN)).toBe(0);
  });
});

describe('displayedSize', () => {
  it('90·270도에서는 가로·세로를 바꾼다', () => {
    expect(displayedSize(595, 842, 0)).toEqual({ width: 595, height: 842 });
    expect(displayedSize(595, 842, 90)).toEqual({ width: 842, height: 595 });
    expect(displayedSize(595, 842, 270)).toEqual({ width: 842, height: 595 });
    expect(displayedSize(595, 842, 180)).toEqual({ width: 595, height: 842 });
  });
});

describe('preRotationFor', () => {
  it('페이지 회전을 되돌리는 각도를 준다', () => {
    expect(preRotationFor(0)).toBe(0);
    expect(preRotationFor(90)).toBe(-90);
    expect(preRotationFor(180)).toBe(180);
    expect(preRotationFor(270)).toBe(90);
  });
});

describe('overlaySize', () => {
  it('150 DPI에서 A4 픽셀 크기를 만든다', () => {
    expect(overlaySize(595.28, 841.89)).toEqual({ width: 1240, height: 1754 });
  });

  it('긴 변이 상한을 넘으면 비율을 유지해 줄인다', () => {
    expect(overlaySize(2000, 1000, 300)).toEqual({ width: 3200, height: 1600 });
  });

  it('DPI가 이상해도 안전한 범위로 보정한다', () => {
    expect(overlaySize(100, 100, 0)).toEqual({ width: 100, height: 100 });
    expect(overlaySize(5000, 5000, 9999)).toEqual({ width: 3200, height: 3200 });
  });
});

describe('watermarkFileName', () => {
  it('원본 이름 뒤에 -watermark를 붙인다', () => {
    expect(watermarkFileName('계약서.pdf')).toBe('계약서-watermark.pdf');
    expect(watermarkFileName('report.final.pdf')).toBe('report.final-watermark.pdf');
  });

  it('경로 구분자를 제거한다', () => {
    expect(watermarkFileName('a/b:c.pdf')).toBe('a_b_c-watermark.pdf');
  });
});

describe('watermarkSummary', () => {
  it('적용 쪽수와 파일 크기를 요약한다', () => {
    expect(watermarkSummary({ pageCount: 10, appliedCount: 3, bytes: 2 * 1024 * 1024 })).toBe(
      '10쪽 중 3쪽에 넣었습니다 · 2.0 MB',
    );
    expect(watermarkSummary({ pageCount: 2, appliedCount: 2, bytes: 500 })).toBe(
      '2쪽 중 2쪽에 넣었습니다 · 1 KB',
    );
  });
});
