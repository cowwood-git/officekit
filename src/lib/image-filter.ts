export interface FilterValues {
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
  blur: number;
}

export const DEFAULT_FILTERS: FilterValues = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  blur: 0,
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function clampFilters(values: Partial<FilterValues>): FilterValues {
  return {
    brightness: clamp(values.brightness ?? 100, 0, 200),
    contrast: clamp(values.contrast ?? 100, 0, 200),
    saturation: clamp(values.saturation ?? 100, 0, 200),
    grayscale: clamp(values.grayscale ?? 0, 0, 100),
    sepia: clamp(values.sepia ?? 0, 0, 100),
    blur: clamp(values.blur ?? 0, 0, 20),
  };
}

/** CanvasRenderingContext2D.filter에 넣을 CSS 문자열. */
export function filterCss(values: Partial<FilterValues>, blurScale = 1): string {
  const safe = clampFilters(values);
  return [
    `brightness(${safe.brightness}%)`,
    `contrast(${safe.contrast}%)`,
    `saturate(${safe.saturation}%)`,
    `grayscale(${safe.grayscale}%)`,
    `sepia(${safe.sepia}%)`,
    `blur(${safe.blur * Math.max(0.1, blurScale)}px)`,
  ].join(' ');
}

export function isDefaultFilters(values: Partial<FilterValues>): boolean {
  const safe = clampFilters(values);
  return (
    safe.brightness === 100 &&
    safe.contrast === 100 &&
    safe.saturation === 100 &&
    safe.grayscale === 0 &&
    safe.sepia === 0 &&
    safe.blur === 0
  );
}
