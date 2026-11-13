import { describe, expect, it } from 'vitest';
import {
  convertAll,
  convertUnit,
  formatUnitValue,
  UNIT_CATEGORIES,
  unitsFor,
} from '../src/lib/unit-convert';

describe('unit categories', () => {
  it('7개 범주와 단위 목록을 제공한다', () => {
    expect(UNIT_CATEGORIES).toHaveLength(7);
    expect(unitsFor('length').length).toBeGreaterThan(5);
    expect(unitsFor('temperature').map((unit) => unit.id)).toEqual(['c', 'f', 'k']);
  });
});

describe('convertUnit', () => {
  it('길이를 변환한다', () => {
    expect(convertUnit('length', 1, 'km', 'm')).toBe(1000);
    expect(convertUnit('length', 1, 'in', 'cm')).toBeCloseTo(2.54);
    expect(convertUnit('length', 1, 'mi', 'km')).toBeCloseTo(1.609344);
  });

  it('무게·넓이·부피를 변환한다', () => {
    expect(convertUnit('mass', 1, 'kg', 'g')).toBe(1000);
    expect(convertUnit('area', 1, 'pyeong', 'm2')).toBeCloseTo(3.305785);
    expect(convertUnit('volume', 1, 'l', 'ml')).toBe(1000);
  });

  it('데이터는 1024 기준으로 변환한다', () => {
    expect(convertUnit('data', 1, 'gb', 'mb')).toBe(1024);
    expect(convertUnit('data', 8, 'bit', 'byte')).toBe(1);
  });

  it('속도를 변환한다', () => {
    expect(convertUnit('speed', 36, 'kmh', 'mps')).toBeCloseTo(10);
    expect(convertUnit('speed', 1, 'knot', 'kmh')).toBeCloseTo(1.852, 2);
  });

  it('온도를 변환한다', () => {
    expect(convertUnit('temperature', 0, 'c', 'f')).toBeCloseTo(32);
    expect(convertUnit('temperature', 100, 'c', 'f')).toBeCloseTo(212);
    expect(convertUnit('temperature', 32, 'f', 'c')).toBeCloseTo(0);
    expect(convertUnit('temperature', 0, 'c', 'k')).toBeCloseTo(273.15);
  });

  it('알 수 없는 단위는 null', () => {
    expect(convertUnit('length', 1, 'km', 'lightyear')).toBeNull();
    expect(convertUnit('length', Number.NaN, 'km', 'm')).toBeNull();
  });
});

describe('convertAll', () => {
  it('같은 범주의 모든 단위로 바꾼다', () => {
    const results = convertAll('length', 1, 'm');
    expect(results).toHaveLength(8);
    expect(results.find((entry) => entry.unit.id === 'cm')?.value).toBeCloseTo(100);
  });
});

describe('formatUnitValue', () => {
  it('자릿수를 정리한다', () => {
    expect(formatUnitValue(1000)).toBe('1,000');
    expect(formatUnitValue(3.305785)).toBe('3.3058');
    expect(formatUnitValue(0.0000001)).toContain('e-7');
    expect(formatUnitValue(Number.NaN)).toBe('-');
  });
});
