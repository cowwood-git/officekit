import { safeFileName } from './files';

export const ROTATION_STEP = 90;

export function rotateBy(current: number, delta = ROTATION_STEP): number {
  const next = (Math.round(current / 90) * 90 + delta) % 360;
  return next < 0 ? next + 360 : next;
}

export function normalizeRotation(value: number): number {
  const next = Math.round(value / 90) * 90;
  return ((next % 360) + 360) % 360;
}

/** 잘못된 순서가 들어와도 원본 인덱스 배열을 안전하게 만든다. */
export function reorderIndices(order: number[], pageCount: number): number[] {
  const valid = order.filter(
    (value, index) =>
      Number.isInteger(value) && value >= 0 && value < pageCount && order.indexOf(value) === index,
  );
  for (let index = 0; index < pageCount; index += 1) {
    if (!valid.includes(index)) valid.push(index);
  }
  return valid;
}

export function organizeFileName(originalName: string): string {
  const base = safeFileName(originalName.replace(/\.pdf$/i, '')) || 'document';
  return `${base}-organized.pdf`;
}
