/** GIF 만들기 설정 계산(인코딩은 gifenc 가 한다). */
export const GIF_MAX_FRAMES = 150;
export const GIF_MAX_IMAGES = 60;
export const GIF_MAX_VIDEO_SECONDS = 15;

export function gifSize(
  width: number,
  height: number,
  maxWidth: number,
): { width: number; height: number } {
  const target = Math.max(16, Math.min(maxWidth, width));
  const scale = target / width;
  return { width: Math.round(width * scale), height: Math.max(1, Math.round(height * scale)) };
}

/** 영상에서 뽑을 시각(초) 목록. 영상 끝을 넘지 않고, 최대 프레임 수를 지킨다. */
export function frameTimes(
  start: number,
  duration: number,
  fps: number,
  videoLength: number,
): number[] {
  const from = Math.max(0, Math.min(start, Math.max(0, videoLength - 0.05)));
  const length = Math.max(0.1, Math.min(duration, GIF_MAX_VIDEO_SECONDS, videoLength - from));
  const rate = Math.max(1, Math.min(30, fps));
  const count = Math.min(GIF_MAX_FRAMES, Math.max(1, Math.floor(length * rate)));
  return Array.from(
    { length: count },
    (_, index) => Math.round((from + index / rate) * 1000) / 1000,
  );
}

/** GIF 프레임 지연은 1/100초 단위라 10ms 로 맞춘다. 너무 짧으면 브라우저가 느리게 재생한다. */
export function frameDelay(ms: number): number {
  return Math.max(20, Math.round(ms / 10) * 10);
}

export function estimateSeconds(frames: number, delayMs: number): number {
  return Math.round(((frames * frameDelay(delayMs)) / 1000) * 10) / 10;
}

export function gifFileName(original?: string): string {
  if (!original) return 'animation.gif';
  const dot = original.lastIndexOf('.');
  return `${dot > 0 ? original.slice(0, dot) : original}.gif`;
}
