import { describe, expect, it } from 'vitest';
import { cropBoxFor, cropFileName, croppedDisplaySize, mmToPt, ptToMm } from '../src/lib/pdf-crop';

const margins = { top: 10, right: 20, bottom: 30, left: 40 };

describe('mmToPt / ptToMm', () => {
  it('mm와 pt를 왕복 변환한다', () => {
    expect(mmToPt(25.4)).toBeCloseTo(72);
    expect(ptToMm(72)).toBeCloseTo(25.4);
    expect(mmToPt(-5)).toBe(0);
  });
});

describe('cropBoxFor', () => {
  it('회전 0도는 화면 여백을 그대로 적용한다', () => {
    expect(cropBoxFor(600, 800, 0, margins)).toEqual({
      x: 40,
      y: 30,
      width: 540,
      height: 760,
    });
  });

  it('90도 회전은 위·아래를 페이지 가로에 매핑한다', () => {
    expect(cropBoxFor(600, 800, 90, margins)).toEqual({
      x: 10,
      y: 40,
      width: 560,
      height: 740,
    });
  });

  it('180도 회전은 반대편에서 시작한다', () => {
    expect(cropBoxFor(600, 800, 180, margins)).toEqual({
      x: 20,
      y: 30,
      width: 540,
      height: 760,
    });
  });

  it('270도 회전도 매핑한다', () => {
    expect(cropBoxFor(600, 800, 270, margins)).toEqual({
      x: 30,
      y: 20,
      width: 560,
      height: 740,
    });
  });

  it('여백이 너무 크면 최소 크기로 보정한다', () => {
    const box = cropBoxFor(100, 100, 0, { top: 80, right: 80, bottom: 80, left: 80 });
    expect(box.width).toBeGreaterThanOrEqual(18);
    expect(box.height).toBeGreaterThanOrEqual(18);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
  });
});

describe('croppedDisplaySize', () => {
  it('회전을 반영한 표시 크기를 준다', () => {
    const box = { x: 10, y: 20, width: 100, height: 200 };
    expect(croppedDisplaySize(0, box)).toEqual({ width: 100, height: 200 });
    expect(croppedDisplaySize(90, box)).toEqual({ width: 200, height: 100 });
  });
});

describe('cropFileName', () => {
  it('결과 파일명을 만든다', () => {
    expect(cropFileName('보고서.pdf')).toBe('보고서-cropped.pdf');
  });
});
