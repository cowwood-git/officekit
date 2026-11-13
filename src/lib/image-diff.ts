/** 두 이미지의 픽셀 차이. 같은 크기의 RGBA 배열을 받는다. */
export interface DiffResult {
  changed: number;
  total: number;
  /** 바뀐 픽셀 비율(0~1) */
  ratio: number;
  /** 바뀐 곳을 강조한 RGBA(바뀐 곳: 빨강, 그대로인 곳: 흐린 회색) */
  mask: Uint8ClampedArray<ArrayBuffer>;
}

/** 0~100 민감도 → 채널 차이 허용치. 100이면 1만 달라도 잡는다. */
export function thresholdFor(sensitivity: number): number {
  const value = Math.min(100, Math.max(0, sensitivity));
  return Math.round(1 + ((100 - value) / 100) * 120);
}

export function diffPixels(
  a: ArrayLike<number>,
  b: ArrayLike<number>,
  threshold: number,
): DiffResult {
  if (a.length !== b.length) throw new Error('두 이미지의 크기가 같아야 합니다.');
  const total = Math.floor(a.length / 4);
  const mask = new Uint8ClampedArray(a.length);
  let changed = 0;
  for (let index = 0; index < total; index += 1) {
    const at = index * 4;
    const delta = Math.max(
      Math.abs((a[at] as number) - (b[at] as number)),
      Math.abs((a[at + 1] as number) - (b[at + 1] as number)),
      Math.abs((a[at + 2] as number) - (b[at + 2] as number)),
      Math.abs((a[at + 3] as number) - (b[at + 3] as number)),
    );
    if (delta >= threshold) {
      changed += 1;
      mask[at] = 230;
      mask[at + 1] = 30;
      mask[at + 2] = 60;
      mask[at + 3] = 255;
    } else {
      const gray =
        0.299 * (a[at] as number) + 0.587 * (a[at + 1] as number) + 0.114 * (a[at + 2] as number);
      const faded = 255 - (255 - gray) * 0.25;
      mask[at] = faded;
      mask[at + 1] = faded;
      mask[at + 2] = faded;
      mask[at + 3] = 255;
    }
  }
  return { changed, total, ratio: total ? changed / total : 0, mask };
}

/** 비교 기준 크기: 첫 이미지 크기, 너무 크면 긴 변 maxSide 로 줄인다. */
export function compareSize(
  width: number,
  height: number,
  maxSide = 2000,
): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function formatRatio(ratio: number): string {
  if (ratio === 0) return '0%';
  if (ratio < 0.001) return '0.1% 미만';
  return `${(Math.round(ratio * 1000) / 10).toString()}%`;
}
