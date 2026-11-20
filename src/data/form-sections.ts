/**
 * 업무 양식과 유아·어린이 학습 공책을 나눈다. 양식관(/forms/)은 업무 양식만, /kids/는 공책만 보여 준다.
 * 판단 기준은 카테고리 하나(form-categories.ts의 KIDS_CATEGORY)다.
 */

import { FORM_BUNDLES } from '@/data/form-bundles';
import { isKidsForm, KIDS_CATEGORY } from '@/data/form-categories';
import { FORMS } from '@/data/forms';

export const BUSINESS_FORMS = FORMS.filter((form) => !isKidsForm(form));
export const KIDS_FORMS = FORMS.filter(isKidsForm);

export const BUSINESS_BUNDLES = FORM_BUNDLES.filter((bundle) => bundle.category !== KIDS_CATEGORY);
export const KIDS_BUNDLES = FORM_BUNDLES.filter((bundle) => bundle.category === KIDS_CATEGORY);

export const KIDS_FORM_SLUGS: ReadonlySet<string> = new Set(KIDS_FORMS.map((form) => form.slug));
export const KIDS_BUNDLE_SLUGS: ReadonlySet<string> = new Set(
  KIDS_BUNDLES.map((bundle) => bundle.slug),
);
