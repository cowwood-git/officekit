import { describe, expect, it } from 'vitest';
import {
  anchorX,
  applyTemplate,
  clampHeaderFont,
  clampHeaderMargin,
  footerBaseline,
  hasAnyPageToken,
  hasPageToken,
  headerBaseline,
} from '../src/lib/pdf-header-footer';

describe('applyTemplate', () => {
  it('페이지·전체 쪽수를 치환한다', () => {
    expect(applyTemplate('{page} / {total}', 3, 10)).toBe('3 / 10');
    expect(applyTemplate('{PAGE:2}쪽', 3, 10)).toBe('03쪽');
    expect(applyTemplate('{page:3}', 7, 10)).toBe('007');
  });

  it('토큰이 없으면 그대로 둔다', () => {
    expect(applyTemplate('대외비', 1, 5)).toBe('대외비');
  });
});

describe('hasPageToken', () => {
  it('페이지 토큰을 찾는다', () => {
    expect(hasPageToken('{page}')).toBe(true);
    expect(hasPageToken('{page:2}')).toBe(true);
    expect(hasPageToken('{total}')).toBe(false);
    expect(
      hasAnyPageToken({
        headerLeft: '',
        headerCenter: '',
        headerRight: '',
        footerLeft: '',
        footerCenter: '{page}',
        footerRight: '',
      }),
    ).toBe(true);
  });
});

describe('clamp helpers', () => {
  it('글자 크기·여백을 보정한다', () => {
    expect(clampHeaderFont(2)).toBe(6);
    expect(clampHeaderFont(99)).toBe(24);
    expect(clampHeaderMargin(0)).toBe(8);
    expect(clampHeaderMargin(999)).toBe(72);
  });
});

describe('anchorX', () => {
  it('좌·중앙·우 위치를 계산한다', () => {
    expect(anchorX('left', 600, 100, 30)).toBe(30);
    expect(anchorX('center', 600, 100, 30)).toBe(250);
    expect(anchorX('right', 600, 100, 30)).toBe(470);
  });
});

describe('baselines', () => {
  it('헤더·푸터 기준선을 계산한다', () => {
    expect(headerBaseline(24, 9)).toBe(33);
    expect(footerBaseline(842, 24)).toBe(818);
  });
});
