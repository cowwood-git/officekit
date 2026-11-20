import { describe, expect, it } from 'vitest';
import { formCategory } from '../src/data/form-categories';
import { formHaystack, formSearchEntries } from '../src/data/form-search';
import { FORMS } from '../src/data/forms';

describe('홈 양식 검색 색인', () => {
  it('양식 전체를 담고, 홈 스크립트가 만드는 검색 문자열이 양식관 카드와 같다', () => {
    const entries = formSearchEntries();
    expect(entries).toHaveLength(FORMS.length);
    for (const form of FORMS) {
      const entry = entries.find((item) => item.slug === form.slug);
      expect(entry, form.slug).toBeDefined();
      if (!entry) continue;
      // src/pages/index.astro buildFormCards와 같은 조합
      const rebuilt = `${entry.title} ${entry.lead} ${entry.terms} ${entry.family}`;
      expect(rebuilt).toBe(formHaystack(form, formCategory(form.category).label));
    }
  });
});
