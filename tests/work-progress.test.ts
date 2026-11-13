import { describe, expect, it } from 'vitest';
import { stepSchedule, workDuration } from '../src/lib/work-progress';

describe('workDuration', () => {
  it('처리 단위가 많을수록 길어지되 4초를 넘지 않는다', () => {
    expect(workDuration(1)).toBe(1260);
    expect(workDuration(31)).toBe(3060);
    expect(workDuration(500)).toBe(4000);
  });

  it('잘못된 값은 1단위로 본다', () => {
    expect(workDuration(0)).toBe(1260);
    expect(workDuration(Number.NaN)).toBe(1260);
  });
});

describe('stepSchedule', () => {
  it('단계 시작 시각을 고르게 나눈다', () => {
    expect(stepSchedule(4, 2000)).toEqual([0, 500, 1000, 1500]);
  });

  it('단계가 없으면 빈 배열', () => {
    expect(stepSchedule(0, 2000)).toEqual([]);
  });
});
