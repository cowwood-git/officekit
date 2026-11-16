import { describe, expect, it } from 'vitest';
import {
  countDaysInclusive,
  formatBizNo,
  formatDateDot,
  formatDateKorean,
  formatKoreanAmount,
  formatKoreanNumber,
  formatTenure,
  formatWon,
  isValidBizNo,
} from '../src/lib/doc/format';

describe('문서 날짜', () => {
  it('ISO 날짜를 문서 표기로 바꾼다', () => {
    expect(formatDateDot('2026-11-14')).toBe('2026. 11. 14.');
    expect(formatDateKorean('2026-11-14')).toBe('2026년 11월 14일');
    expect(formatDateDot('')).toBe('');
  });

  it('시작일과 종료일을 모두 포함해 센다', () => {
    expect(countDaysInclusive('2026-11-14', '2026-11-14')).toBe(1);
    expect(countDaysInclusive('2026-11-14', '2026-11-17')).toBe(4);
    expect(countDaysInclusive('2026-11-30', '2026-12-01')).toBe(2);
  });

  it('잘못된 날짜와 거꾸로 된 기간은 0이다', () => {
    expect(countDaysInclusive('2026-02-30', '2026-03-01')).toBe(0);
    expect(countDaysInclusive('2026-11-17', '2026-11-14')).toBe(0);
    expect(countDaysInclusive('', '2026-11-14')).toBe(0);
  });
});

describe('재직기간', () => {
  it('년·개월로 표기한다', () => {
    expect(formatTenure('2020-03-02', '2026-11-15')).toBe('6년 8개월');
    expect(formatTenure('2026-11-15', '2026-12-15')).toBe('1개월');
    expect(formatTenure('2026-11-15', '2027-11-15')).toBe('1년');
  });

  it('한 달이 안 되면 1개월 미만으로 표기한다', () => {
    expect(formatTenure('2026-11-15', '2026-11-15')).toBe('1개월 미만');
    expect(formatTenure('2026-11-15', '2026-12-14')).toBe('1개월 미만');
  });

  it('잘못된 날짜와 거꾸로 된 기간은 빈 문자열이다', () => {
    expect(formatTenure('', '2026-11-15')).toBe('');
    expect(formatTenure('2026-02-30', '2026-11-15')).toBe('');
    expect(formatTenure('2026-11-16', '2026-11-15')).toBe('');
  });
});

describe('한글 금액', () => {
  it('0과 작은 수를 읽는다', () => {
    expect(formatKoreanNumber(0)).toBe('영');
    expect(formatKoreanNumber(7)).toBe('칠');
    expect(formatKoreanNumber(10)).toBe('일십');
    expect(formatKoreanNumber(1004)).toBe('일천사');
  });

  it('만·억·조 단위를 붙인다', () => {
    expect(formatKoreanNumber(10_000)).toBe('일만');
    expect(formatKoreanNumber(32_000_000)).toBe('삼천이백만');
    expect(formatKoreanNumber(123_456_789)).toBe('일억이천삼백사십오만육천칠백팔십구');
    expect(formatKoreanNumber(1_000_000_000_000)).toBe('일조');
  });

  it('일금 표기와 숫자를 함께 보여 준다', () => {
    expect(formatKoreanAmount(3_200_000)).toBe('일금 삼백이십만 원정 (3,200,000원)');
    expect(formatWon(1_234_567)).toBe('₩1,234,567');
  });
});

describe('사업자등록번호', () => {
  it('하이픈을 넣어 표시한다', () => {
    expect(formatBizNo('1234567891')).toBe('123-45-67891');
    expect(formatBizNo('123')).toBe('123');
  });

  it('체크섬을 확인한다', () => {
    expect(isValidBizNo('123-45-67891')).toBe(true);
    expect(isValidBizNo('123-45-67890')).toBe(false);
    expect(isValidBizNo('12345')).toBe(false);
  });
});
