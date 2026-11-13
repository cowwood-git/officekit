import { describe, expect, it } from 'vitest';
import { CalcError, evaluate, formatResult, resultToInput } from '../src/lib/calculator';

describe('evaluate — 기본 계산', () => {
  it.each([
    ['1+2*3', 7],
    ['(1+2)*3', 9],
    ['10/4', 2.5],
    ['2^3^2', 512],
    ['-2^2', -4],
    ['(-2)^2', 4],
    ['5-3-1', 1],
    ['3×4÷2', 6],
    ['7−10', -3],
    ['50%', 0.5],
    ['200*15%', 30],
    ['1.5×10^3', 1500],
    ['.5+.5', 1],
  ])('%s = %d', (input, expected) => {
    expect(evaluate(input)).toBeCloseTo(expected, 10);
  });

  it('0.1+0.2 는 화면에서 0.3', () => {
    expect(formatResult(evaluate('0.1+0.2'))).toBe('0.3');
  });

  it('0으로 나누면 오류', () => {
    expect(() => evaluate('1/0')).toThrow(CalcError);
  });

  it('잘못된 식은 오류', () => {
    expect(() => evaluate('1+')).toThrow(CalcError);
    expect(() => evaluate('*2')).toThrow(CalcError);
    expect(() => evaluate('')).toThrow(CalcError);
    expect(() => evaluate('2)')).toThrow(CalcError);
    expect(() => evaluate('alert(1)')).toThrow(CalcError);
  });

  it('닫히지 않은 괄호는 끝에서 닫는다', () => {
    expect(evaluate('(1+2')).toBe(3);
    expect(evaluate('sqrt(16')).toBe(4);
  });
});

describe('evaluate — 공학 계산', () => {
  it('도(deg) 기준 삼각함수', () => {
    expect(evaluate('sin(30)', 'deg')).toBeCloseTo(0.5, 12);
    expect(evaluate('cos(90)', 'deg')).toBe(0);
    expect(evaluate('sin(180)', 'deg')).toBe(0);
    expect(evaluate('asin(1)', 'deg')).toBeCloseTo(90, 10);
  });

  it('라디안 기준 삼각함수', () => {
    expect(evaluate('sin(π/2)', 'rad')).toBeCloseTo(1, 12);
    expect(evaluate('cos(π)', 'rad')).toBeCloseTo(-1, 12);
  });

  it('tan 90° 는 오류', () => {
    expect(() => evaluate('tan(90)', 'deg')).toThrow(CalcError);
  });

  it('로그·제곱근·팩토리얼·상수', () => {
    expect(evaluate('log(1000)')).toBeCloseTo(3, 12);
    expect(evaluate('ln(e)')).toBeCloseTo(1, 12);
    expect(evaluate('√(81)')).toBe(9);
    expect(evaluate('∛(27)')).toBeCloseTo(3, 12);
    expect(evaluate('5!')).toBe(120);
    expect(evaluate('abs(-3)')).toBe(3);
    expect(evaluate('exp(0)')).toBe(1);
  });

  it('암시적 곱', () => {
    expect(evaluate('2π', 'rad')).toBeCloseTo(2 * Math.PI, 12);
    expect(evaluate('2(3+4)')).toBe(14);
    expect(evaluate('(1+1)(2+3)')).toBe(10);
    expect(evaluate('2sin(30)', 'deg')).toBeCloseTo(1, 12);
  });

  it('음수 팩토리얼·소수 팩토리얼은 오류', () => {
    expect(() => evaluate('(-1)!')).toThrow(CalcError);
    expect(() => evaluate('2.5!')).toThrow(CalcError);
  });

  it('정의역 밖은 오류', () => {
    expect(() => evaluate('sqrt(-1)')).toThrow(CalcError);
    expect(() => evaluate('asin(2)')).toThrow(CalcError);
  });
});

describe('formatResult', () => {
  it('천 단위 쉼표', () => {
    expect(formatResult(1234567.5)).toBe('1,234,567.5');
    expect(formatResult(-9876543)).toBe('-9,876,543');
  });

  it('아주 크거나 작은 수는 지수 표기', () => {
    expect(formatResult(1e20)).toBe('1e+20');
    expect(formatResult(1.5e-12)).toBe('1.5e-12');
  });

  it('무한대', () => {
    expect(formatResult(Number.POSITIVE_INFINITY)).toBe('∞');
  });

  it('식에 다시 넣는 값은 쉼표가 없다', () => {
    expect(resultToInput(1234567.5)).toBe('1234567.5');
    expect(resultToInput(0.1 + 0.2)).toBe('0.3');
  });
});
