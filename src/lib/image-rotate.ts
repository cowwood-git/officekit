export type QuarterTurns = 0 | 1 | 2 | 3;

/** 90도 단위 회전 수를 0~3으로 정규화한다. */
export function normalizeTurns(turns: number): QuarterTurns {
  if (!Number.isFinite(turns)) return 0;
  return (((Math.trunc(turns) % 4) + 4) % 4) as QuarterTurns;
}

/** 회전 후 이미지 크기. */
export function rotatedSize(
  width: number,
  height: number,
  turns: QuarterTurns,
): { width: number; height: number } {
  return turns % 2 === 0 ? { width, height } : { width: height, height: width };
}

/** 회전·뒤집기를 적용한 캔버스 변환 순서. */
export function canvasTransform(
  width: number,
  height: number,
  turns: QuarterTurns,
  flipHorizontal: boolean,
  flipVertical: boolean,
): { translateX: number; translateY: number; rotate: number; scaleX: number; scaleY: number } {
  return {
    translateX: width / 2,
    translateY: height / 2,
    rotate: (turns * Math.PI) / 2,
    scaleX: flipHorizontal ? -1 : 1,
    scaleY: flipVertical ? -1 : 1,
  };
}
