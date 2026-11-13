export type UnitCategory = 'length' | 'mass' | 'temperature' | 'area' | 'volume' | 'data' | 'speed';

export interface Unit {
  id: string;
  label: string;
  /** 기준 단위로 바꾸는 배율 (온도 제외) */
  factor: number;
}

export const UNIT_CATEGORIES: Array<{ id: UnitCategory; label: string }> = [
  { id: 'length', label: '길이' },
  { id: 'mass', label: '무게' },
  { id: 'temperature', label: '온도' },
  { id: 'area', label: '넓이' },
  { id: 'volume', label: '부피' },
  { id: 'data', label: '데이터' },
  { id: 'speed', label: '속도' },
];

export const UNITS: Record<Exclude<UnitCategory, 'temperature'>, Unit[]> = {
  length: [
    { id: 'mm', label: '밀리미터 (mm)', factor: 0.001 },
    { id: 'cm', label: '센티미터 (cm)', factor: 0.01 },
    { id: 'm', label: '미터 (m)', factor: 1 },
    { id: 'km', label: '킬로미터 (km)', factor: 1000 },
    { id: 'in', label: '인치 (in)', factor: 0.0254 },
    { id: 'ft', label: '피트 (ft)', factor: 0.3048 },
    { id: 'yd', label: '야드 (yd)', factor: 0.9144 },
    { id: 'mi', label: '마일 (mi)', factor: 1609.344 },
  ],
  mass: [
    { id: 'mg', label: '밀리그램 (mg)', factor: 0.001 },
    { id: 'g', label: '그램 (g)', factor: 1 },
    { id: 'kg', label: '킬로그램 (kg)', factor: 1000 },
    { id: 't', label: '톤 (t)', factor: 1_000_000 },
    { id: 'oz', label: '온스 (oz)', factor: 28.349523125 },
    { id: 'lb', label: '파운드 (lb)', factor: 453.59237 },
  ],
  area: [
    { id: 'mm2', label: '제곱밀리미터 (mm²)', factor: 0.000001 },
    { id: 'cm2', label: '제곱센티미터 (cm²)', factor: 0.0001 },
    { id: 'm2', label: '제곱미터 (m²)', factor: 1 },
    { id: 'km2', label: '제곱킬로미터 (km²)', factor: 1_000_000 },
    { id: 'pyeong', label: '평', factor: 3.305785 },
    { id: 'ha', label: '헥타르 (ha)', factor: 10_000 },
    { id: 'ft2', label: '제곱피트 (ft²)', factor: 0.09290304 },
    { id: 'acre', label: '에이커 (acre)', factor: 4046.8564224 },
  ],
  volume: [
    { id: 'ml', label: '밀리리터 (mL)', factor: 0.001 },
    { id: 'l', label: '리터 (L)', factor: 1 },
    { id: 'm3', label: '세제곱미터 (m³)', factor: 1000 },
    { id: 'cup', label: '컵 (US cup)', factor: 0.2365882365 },
    { id: 'floz', label: '액량온스 (US fl oz)', factor: 0.0295735295625 },
    { id: 'gal', label: '갤런 (US gal)', factor: 3.785411784 },
  ],
  data: [
    { id: 'bit', label: '비트 (bit)', factor: 0.125 },
    { id: 'byte', label: '바이트 (B)', factor: 1 },
    { id: 'kb', label: '킬로바이트 (KB)', factor: 1024 },
    { id: 'mb', label: '메가바이트 (MB)', factor: 1024 ** 2 },
    { id: 'gb', label: '기가바이트 (GB)', factor: 1024 ** 3 },
    { id: 'tb', label: '테라바이트 (TB)', factor: 1024 ** 4 },
  ],
  speed: [
    { id: 'mps', label: '미터/초 (m/s)', factor: 1 },
    { id: 'kmh', label: '킬로미터/시 (km/h)', factor: 1 / 3.6 },
    { id: 'mph', label: '마일/시 (mph)', factor: 0.44704 },
    { id: 'knot', label: '노트 (kn)', factor: 0.514444444 },
    { id: 'fps', label: '피트/초 (ft/s)', factor: 0.3048 },
  ],
};

export const TEMPERATURE_UNITS: Unit[] = [
  { id: 'c', label: '섭씨 (°C)', factor: 1 },
  { id: 'f', label: '화씨 (°F)', factor: 1 },
  { id: 'k', label: '켈빈 (K)', factor: 1 },
];

function toCelsius(value: number, unit: string): number {
  if (unit === 'f') return (value - 32) / 1.8;
  if (unit === 'k') return value - 273.15;
  return value;
}

function fromCelsius(value: number, unit: string): number {
  if (unit === 'f') return value * 1.8 + 32;
  if (unit === 'k') return value + 273.15;
  return value;
}

export function unitsFor(category: UnitCategory): Unit[] {
  return category === 'temperature' ? TEMPERATURE_UNITS : UNITS[category];
}

/** 단위를 변환한다. 알 수 없는 단위면 null. */
export function convertUnit(
  category: UnitCategory,
  value: number,
  from: string,
  to: string,
): number | null {
  if (!Number.isFinite(value)) return null;
  const units = unitsFor(category);
  if (!units.some((unit) => unit.id === from) || !units.some((unit) => unit.id === to)) {
    return null;
  }

  if (category === 'temperature') {
    return fromCelsius(toCelsius(value, from), to);
  }

  const source = units.find((unit) => unit.id === from);
  const target = units.find((unit) => unit.id === to);
  if (!source || !target) return null;
  return (value * source.factor) / target.factor;
}

/** 입력값을 같은 범주의 모든 단위로 바꾼다. */
export function convertAll(
  category: UnitCategory,
  value: number,
  from: string,
): Array<{ unit: Unit; value: number }> {
  return unitsFor(category).map((unit) => ({
    unit,
    value: convertUnit(category, value, from, unit.id) ?? Number.NaN,
  }));
}

/** 결과 표시 자릿수를 정리한다. 아주 크거나 작으면 지수 표기를 쓴다. */
export function formatUnitValue(value: number): string {
  if (!Number.isFinite(value)) return '-';
  const absolute = Math.abs(value);
  if (absolute !== 0 && (absolute >= 1e12 || absolute < 1e-6)) {
    return value.toExponential(4);
  }
  const digits = absolute >= 100 ? 2 : absolute >= 1 ? 4 : 6;
  return value
    .toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 })
    .replace(/,/g, ',');
}
