import { describe, expect, it } from 'vitest';
import { clampRotation, fitSealFontSize, sealFileName, sealTextLines } from '../src/lib/seal';

describe('도장·서명 만들기', () => {
  it('입력한 글자를 최대 3줄로 정리한다', () => {
    expect(sealTextLines('  옷깃  \n\n 대표 홍길동 \n세 번째\n네 번째')).toEqual([
      '옷깃',
      '대표 홍길동',
      '세 번째',
    ]);
  });

  it('줄마다 너무 긴 글자는 자른다', () => {
    const line = sealTextLines('가'.repeat(30))[0] ?? '';
    expect(line).toHaveLength(16);
  });

  it('기울기를 -20~20도로 제한한다', () => {
    expect(clampRotation(99)).toBe(20);
    expect(clampRotation(-99)).toBe(-20);
    expect(clampRotation(3.6)).toBe(4);
    expect(clampRotation(Number.NaN)).toBe(0);
  });

  it('도장·서명 파일 이름을 만든다', () => {
    const date = new Date(2026, 10, 13);
    expect(sealFileName('seal', date)).toBe('도장-20261113.png');
    expect(sealFileName('sign', date)).toBe('서명-20261113.png');
  });

  it('도장 안에 들어가는 글자 크기를 찾는다', () => {
    const measure = (text: string, size: number) => Array.from(text).length * size * 0.6;
    const short = fitSealFontSize({
      lines: ['옷깃'],
      maxWidth: 300,
      maxHeight: 300,
      maxSize: 200,
      measure,
    });
    expect(short).toBe(200);

    const long = fitSealFontSize({
      lines: ['아주긴도장문구입니다'],
      maxWidth: 100,
      maxHeight: 300,
      maxSize: 200,
      measure,
    });
    const width = Array.from('아주긴도장문구입니다').length * long * 0.6;
    expect(width).toBeLessThanOrEqual(100);
    expect(long).toBeGreaterThanOrEqual(12);
  });
});
