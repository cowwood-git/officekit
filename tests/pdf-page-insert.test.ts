import { describe, expect, it } from 'vitest';
import {
  buildPagePlan,
  insertFileName,
  insertPositionLabel,
  segmentLabel,
} from '../src/lib/pdf-page-insert';

const base = {
  mode: 'insert' as const,
  baseCount: 5,
  sourceCount: 3,
  insertAfter: 2,
  baseRange: '',
  sourceRange: '',
};

describe('buildPagePlan — 삽입', () => {
  it('지정한 쪽 뒤에 전체 쪽을 넣는다', () => {
    const plan = buildPagePlan(base);
    expect(plan.errors).toEqual([]);
    expect(plan.resultCount).toBe(8);
    expect(plan.ops.map((op) => `${op.kind[0]}${op.index + 1}`)).toEqual([
      'b1',
      'b2',
      's1',
      's2',
      's3',
      'b3',
      'b4',
      'b5',
    ]);
    expect(plan.summary).toContain('3쪽을 2쪽 뒤에 넣어 8쪽');
  });

  it('맨 앞과 맨 뒤에 넣는다', () => {
    const front = buildPagePlan({ ...base, insertAfter: 0, sourceRange: '2' });
    expect(front.ops[0]).toEqual({ kind: 'source', index: 1 });
    expect(front.resultCount).toBe(6);

    const back = buildPagePlan({ ...base, insertAfter: 5, sourceRange: '1-2' });
    expect(back.ops.slice(-2)).toEqual([
      { kind: 'source', index: 0 },
      { kind: 'source', index: 1 },
    ]);
    expect(back.resultCount).toBe(7);
  });

  it('끼워 넣을 쪽 범위를 고른다', () => {
    const plan = buildPagePlan({ ...base, sourceRange: '3, 1' });
    expect(plan.sourcePages).toEqual([3, 1]);
    expect(plan.resultCount).toBe(7);
  });

  it('잘못된 범위와 위치를 거부한다', () => {
    expect(buildPagePlan({ ...base, sourceRange: '9' }).errors.length).toBeGreaterThan(0);
    expect(buildPagePlan({ ...base, insertAfter: 9 }).errors.length).toBeGreaterThan(0);
    expect(buildPagePlan({ ...base, baseCount: 0 }).errors.length).toBeGreaterThan(0);
  });
});

describe('buildPagePlan — 교체', () => {
  it('연속된 쪽을 다른 PDF 쪽으로 바꾼다', () => {
    const plan = buildPagePlan({
      ...base,
      mode: 'replace',
      baseRange: '2-3',
      sourceRange: '1-2',
    });
    expect(plan.errors).toEqual([]);
    expect(plan.resultCount).toBe(5);
    expect(plan.replacedCount).toBe(2);
    expect(plan.ops.map((op) => `${op.kind[0]}${op.index + 1}`)).toEqual([
      'b1',
      's1',
      's2',
      'b4',
      'b5',
    ]);
    expect(plan.summary).toContain('2-3쪽을 2쪽으로 바꿔');
  });

  it('쪽 수가 달라도 교체한다', () => {
    const longer = buildPagePlan({
      ...base,
      mode: 'replace',
      baseRange: '2',
      sourceRange: '1-3',
    });
    expect(longer.resultCount).toBe(7);

    const shorter = buildPagePlan({
      ...base,
      mode: 'replace',
      baseRange: '2-4',
      sourceRange: '1',
    });
    expect(shorter.resultCount).toBe(3);
  });

  it('연속되지 않은 범위는 거부한다', () => {
    const plan = buildPagePlan({
      ...base,
      mode: 'replace',
      baseRange: '1, 3',
      sourceRange: '1',
    });
    expect(plan.errors.join(' ')).toContain('연속');
  });

  it('빈 범위는 거부한다', () => {
    const plan = buildPagePlan({ ...base, mode: 'replace', baseRange: '  ', sourceRange: '1' });
    expect(plan.errors.length).toBeGreaterThan(0);
  });
});

describe('segments', () => {
  it('연속된 쪽을 묶어 요약한다', () => {
    const plan = buildPagePlan({ ...base, insertAfter: 2, sourceRange: '1-2' });
    expect(plan.segments).toEqual([
      { kind: 'base', pages: [1, 2] },
      { kind: 'source', pages: [1, 2] },
      { kind: 'base', pages: [3, 4, 5] },
    ]);
    expect(plan.segments.map((segment) => segmentLabel(segment, 'insert'))).toEqual([
      '기본 1-2',
      '삽입 1-2',
      '기본 3-5',
    ]);
  });

  it('교체 모드의 이름을 쓴다', () => {
    const plan = buildPagePlan({ ...base, mode: 'replace', baseRange: '2', sourceRange: '1' });
    expect(plan.segments.map((segment) => segmentLabel(segment, 'replace'))).toEqual([
      '기본 1',
      '교체 1',
      '기본 3-5',
    ]);
  });
});

describe('labels', () => {
  it('삽입 위치를 설명한다', () => {
    expect(insertPositionLabel(0, 5)).toBe('맨 앞');
    expect(insertPositionLabel(2, 5)).toBe('2쪽 뒤');
    expect(insertPositionLabel(5, 5)).toBe('맨 뒤');
  });

  it('파일명을 만든다', () => {
    expect(insertFileName('계약서.pdf')).toBe('계약서-page-edit.pdf');
    expect(insertFileName('a/b.PDF')).toBe('a_b-page-edit.pdf');
  });
});
