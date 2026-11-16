import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';
import { loadForm } from '../src/data/forms/loaders';

describe('양식 지연 로더', () => {
  it('공개된 모든 양식에 로더가 등록되어 있다', async () => {
    for (const form of FORMS) {
      const loaded = await loadForm(form.slug);
      expect(loaded, `${form.slug} 로더 누락`).not.toBeNull();
      expect(loaded?.slug, form.slug).toBe(form.slug);
    }
  });
});
