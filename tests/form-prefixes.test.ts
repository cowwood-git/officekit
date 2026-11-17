import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';

describe('문서번호 접두사', () => {
  it('모든 양식에 2~3자리 고유 접두사가 있다', () => {
    const prefixes = FORMS.map((form) => form.docPrefix ?? '');
    expect(prefixes.every(Boolean)).toBe(true);
    for (const prefix of prefixes) {
      expect(prefix).toMatch(/^[A-Z0-9]{2,3}$/);
    }
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});
