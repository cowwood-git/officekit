import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';

describe('결재선 5칸 규칙', () => {
  const forms = FORMS.filter((form) =>
    form.fields.some((field) => field.group === '결재선' && field.type === 'roles'),
  );

  it('결재선이 있는 모든 양식은 5칸을 제공한다', () => {
    expect(forms.length).toBe(60);

    for (const form of forms) {
      const field = form.fields.find((item) => item.group === '결재선' && item.type === 'roles');
      expect(field, form.slug).toBeDefined();
      if (!field) continue;

      expect(field.options, `${form.slug} 옵션`).toHaveLength(5);
      expect(field.maxSelected, `${form.slug} 최대 선택`).toBe(5);
      expect(field.defaultValue, `${form.slug} 기본값`).toBeTruthy();
      if (!field.defaultValue) continue;

      const defaults = JSON.parse(field.defaultValue) as {
        label: string;
        enabled: boolean;
      }[];
      expect(defaults, `${form.slug} 기본값 개수`).toHaveLength(5);
      expect(
        defaults.map((item) => item.label),
        `${form.slug} 기본값 순서`,
      ).toEqual([...(field.options ?? [])]);

      const enabled = defaults.filter((item) => item.enabled);
      expect(enabled.length, `${form.slug} 활성 개수`).toBeGreaterThanOrEqual(2);
      expect(enabled.length, `${form.slug} 활성 개수`).toBeLessThanOrEqual(3);
    }
  });

  it('서명·확인 역할은 결재선 5칸 규칙에서 제외한다', () => {
    const otherRoles = FORMS.flatMap((form) =>
      form.fields.filter(
        (field) =>
          field.type === 'roles' && field.group !== '결재선' && (field.options?.length ?? 0) < 5,
      ),
    );
    expect(otherRoles.length).toBeGreaterThan(0);
  });
});
