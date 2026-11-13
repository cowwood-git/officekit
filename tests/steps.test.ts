import { describe, expect, it } from 'vitest';
import { stepStates } from '../src/lib/steps';

describe('stepStates', () => {
  it('현재 단계 앞은 완료, 뒤는 예정', () => {
    expect(stepStates(3, 2)).toEqual(['done', 'current', 'upcoming']);
  });

  it('첫 단계에서는 나머지가 모두 예정', () => {
    expect(stepStates(3, 1)).toEqual(['current', 'upcoming', 'upcoming']);
  });

  it('범위를 벗어난 값은 처음·마지막으로 맞춘다', () => {
    expect(stepStates(3, 0)).toEqual(['current', 'upcoming', 'upcoming']);
    expect(stepStates(3, 9)).toEqual(['done', 'done', 'current']);
  });
});
