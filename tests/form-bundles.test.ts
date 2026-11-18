import { describe, expect, it } from 'vitest';
import { bundlesForForm, FORM_BUNDLES, getBundle } from '../src/data/form-bundles';
import { FORMS, getForm } from '../src/data/forms';

describe('문서 묶음 데이터', () => {
  it('묶음과 단계의 식별자가 고유하다', () => {
    const slugs = FORM_BUNDLES.map((bundle) => bundle.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    for (const bundle of FORM_BUNDLES) {
      const steps = bundle.steps.map((step) => step.slug);
      expect(new Set(steps).size, bundle.slug).toBe(steps.length);
      expect(steps.length, bundle.slug).toBeGreaterThanOrEqual(3);
      expect(steps.length, bundle.slug).toBeLessThanOrEqual(5);
    }
  });

  it('모든 단계가 실제 양식과 연결된다', () => {
    for (const bundle of FORM_BUNDLES) {
      for (const step of bundle.steps) {
        expect(getForm(step.slug), `${bundle.slug} → ${step.slug}`).toBeDefined();
        expect(step.role.trim(), `${bundle.slug} → ${step.slug} 역할`).not.toBe('');
        expect(step.reason.trim(), `${bundle.slug} → ${step.slug} 이유`).not.toBe('');
      }
    }
  });

  it('묶음마다 체크리스트와 FAQ가 충분하다', () => {
    for (const bundle of FORM_BUNDLES) {
      expect(bundle.checklist.length, `${bundle.slug} 체크리스트`).toBeGreaterThanOrEqual(5);
      expect(bundle.faq.length, `${bundle.slug} FAQ`).toBeGreaterThanOrEqual(4);
      expect(bundle.notes.length, `${bundle.slug} 실수`).toBeGreaterThanOrEqual(3);
      expect(bundle.lead.length, `${bundle.slug} 리드`).toBeGreaterThan(60);
    }
  });

  it('묶음 제목과 설명이 고유하다', () => {
    for (const field of ['title', 'shortTitle', 'description'] as const) {
      const values = FORM_BUNDLES.map((bundle) => bundle[field]);
      expect(new Set(values).size, field).toBe(values.length);
    }
  });

  it('관련 묶음은 존재하고 자기 자신을 가리키지 않는다', () => {
    for (const bundle of FORM_BUNDLES) {
      expect(bundle.relatedBundles.length, bundle.slug).toBeGreaterThanOrEqual(2);
      for (const slug of bundle.relatedBundles) {
        expect(slug, bundle.slug).not.toBe(bundle.slug);
        expect(getBundle(slug), `${bundle.slug} → ${slug}`).toBeDefined();
      }
    }
  });

  it('양식에서 묶음을 역으로 찾을 수 있다', () => {
    for (const bundle of FORM_BUNDLES) {
      for (const step of bundle.steps) {
        expect(bundlesForForm(step.slug).map((item) => item.slug)).toContain(bundle.slug);
      }
    }

    for (const form of FORMS) {
      for (const bundle of bundlesForForm(form.slug)) {
        expect(bundle.steps.some((step) => step.slug === form.slug)).toBe(true);
      }
    }
  });

  it('모든 묶음이 공개 양식만 사용한다', () => {
    const slugs = new Set(FORMS.map((form) => form.slug));
    for (const bundle of FORM_BUNDLES) {
      for (const step of bundle.steps) {
        expect(slugs.has(step.slug), `${bundle.slug} → ${step.slug}`).toBe(true);
      }
    }
  });
});
