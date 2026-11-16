/**
 * HWPX(OWPML) 단위 — HWPUNIT은 1mm = 283.465, 글자 높이는 1/100pt.
 */
export const HWPUNIT_PER_MM = 283.465;

export const mm = (value: number): number => Math.round(value * HWPUNIT_PER_MM);

/** 글자 높이(hh:charPr height)는 1/100pt 단위다. */
export const pt = (value: number): number => Math.round(value * 100);
