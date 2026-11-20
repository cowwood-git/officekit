import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';
import { tools } from '../src/data/tools';
import { adsAllowed, NO_AD_FORMS, NO_AD_TOOLS } from '../src/lib/ad-exclusions';

describe('광고 제외 목록', () => {
  it('모든 항목이 실제 도구·양식이다(이름이 바뀌면 광고가 조용히 다시 붙는다)', () => {
    const toolSlugs = new Set(tools.map((tool) => tool.slug));
    const formSlugs = new Set(FORMS.map((form) => form.slug));
    expect([...NO_AD_TOOLS].filter((slug) => !toolSlugs.has(slug))).toEqual([]);
    expect([...NO_AD_FORMS].filter((slug) => !formSlugs.has(slug))).toEqual([]);
  });

  it('비밀번호 도구 3개·민감 양식 36개를 뺀다', () => {
    expect(NO_AD_TOOLS.size).toBe(3);
    expect(NO_AD_FORMS.size).toBe(36);
  });

  it.each([
    ['/tools/password-generator/', false],
    ['/tools/pdf-unlock/some-variant/', false],
    ['/forms/payslip/', false],
    ['/forms/nda/', false],
    ['/tools/pdf-merge/', true],
    ['/forms/quote/', true],
    ['/forms/', true],
    ['/forms/bundles/', true],
    ['/', true],
    ['/privacy/', true],
  ])('%s → %s', (path, expected) => {
    expect(adsAllowed(path)).toBe(expected);
  });
});
