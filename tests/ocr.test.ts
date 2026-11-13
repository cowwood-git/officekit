import { describe, expect, it } from 'vitest';
import {
  normalizeOcrText,
  ocrCharCount,
  ocrFileName,
  preprocessSize,
  textForDownload,
} from '../src/lib/ocr';

describe('normalizeOcrText', () => {
  it('줄바꿈과 중복 빈 줄을 정리한다', () => {
    const input = '첫 줄  \r\n둘째 줄\n\n\n\n셋째 줄   ';
    expect(normalizeOcrText(input)).toBe('첫 줄\n둘째 줄\n\n셋째 줄');
  });

  it('앞뒤 공백을 제거한다', () => {
    expect(normalizeOcrText('\n\n  텍스트  \n\n')).toBe('텍스트');
  });
});

describe('ocrFileName', () => {
  it('확장자를 txt로 바꾼다', () => {
    expect(ocrFileName('receipt.JPG')).toBe('receipt.txt');
    expect(ocrFileName('a/b:c.png')).toBe('a_b_c.txt');
  });
});

describe('ocrCharCount', () => {
  it('공백을 제외하고 센다', () => {
    expect(ocrCharCount('한 글 자')).toBe(3);
    expect(ocrCharCount('a b\nc')).toBe(3);
  });
});

describe('preprocessSize', () => {
  it('작은 이미지는 키운다', () => {
    expect(preprocessSize({ width: 400, height: 200 })).toEqual({
      width: 1600,
      height: 800,
      scale: 4,
    });
  });

  it('큰 이미지는 줄인다', () => {
    const size = preprocessSize({ width: 6000, height: 3000 });
    expect(size.width).toBe(3000);
    expect(size.height).toBe(1500);
    expect(size.scale).toBeLessThan(1);
  });

  it('적당한 크기는 그대로 둔다', () => {
    expect(preprocessSize({ width: 2000, height: 1000 })).toEqual({
      width: 2000,
      height: 1000,
      scale: 1,
    });
  });
});

describe('textForDownload', () => {
  it('BOM을 붙인다', () => {
    expect(textForDownload('안녕')).toBe('\uFEFF안녕');
  });
});
