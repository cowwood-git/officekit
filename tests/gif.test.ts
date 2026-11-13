import { describe, expect, it } from 'vitest';
import {
  estimateSeconds,
  frameDelay,
  frameTimes,
  GIF_MAX_FRAMES,
  gifFileName,
  gifSize,
} from '../src/lib/gif';

describe('gif', () => {
  it('크기', () => {
    expect(gifSize(1920, 1080, 480)).toEqual({ width: 480, height: 270 });
    expect(gifSize(300, 200, 480)).toEqual({ width: 300, height: 200 });
  });

  it('영상 프레임 시각', () => {
    expect(frameTimes(0, 1, 5, 10)).toEqual([0, 0.2, 0.4, 0.6, 0.8]);
    // 영상 끝을 넘지 않는다
    expect(frameTimes(9.5, 3, 10, 10)).toHaveLength(5);
    // 최대 프레임
    expect(frameTimes(0, 15, 30, 60)).toHaveLength(GIF_MAX_FRAMES);
    expect(frameTimes(50, 2, 10, 10).length).toBeGreaterThanOrEqual(1);
  });

  it('지연과 길이', () => {
    expect(frameDelay(5)).toBe(20);
    expect(frameDelay(104)).toBe(100);
    expect(estimateSeconds(10, 500)).toBe(5);
  });

  it('파일 이름', () => {
    expect(gifFileName()).toBe('animation.gif');
    expect(gifFileName('clip.mp4')).toBe('clip.gif');
  });
});

describe('fitsGifski', () => {
  it('프레임 메모리 합이 한도 안이면 gifski, 넘으면 gifenc', async () => {
    const { fitsGifski, GIFSKI_MAX_BYTES } = await import('../src/lib/gif');
    expect(fitsGifski(150, 480, 270)).toBe(true);
    expect(fitsGifski(150, 800, 450)).toBe(false);
    expect(fitsGifski(1, 1, Math.floor(GIFSKI_MAX_BYTES / 4))).toBe(true);
    expect(fitsGifski(1, 1, Math.floor(GIFSKI_MAX_BYTES / 4) + 1)).toBe(false);
  });
});
