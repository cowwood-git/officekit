import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';

describe('양식 footer', () => {
  it('모든 양식에서 고지 문구를 쓰지 않는다', () => {
    for (const form of FORMS) {
      expect(form.footer, form.slug).toBeUndefined();
    }
  });
});
