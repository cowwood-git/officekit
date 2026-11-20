/**
 * 홈 검색창의 양식 결과용 색인. 양식관 카드(FormCard)와 같은 검색 문자열을 쓴다.
 *
 * 홈에 양식 149개 카드를 숨겨서 미리 그려 두면 HTML이 160KB 늘어난다. 그래서 카드는
 * 검색할 때만 이 색인(/forms-search.json)을 받아 템플릿 카드 하나를 복제해 만든다.
 */
import { formCategory } from '@/data/form-categories';
import { FORM_FAMILIES, FORMS } from '@/data/forms';
import type { FormTemplate } from '@/lib/doc/types';

export interface FormSearchEntry {
  slug: string;
  title: string;
  lead: string;
  /** 카드 윗줄에 보이는 양식 묶음 이름 */
  family: string;
  /** 키워드·카테고리. 검색 문자열은 `${title} ${lead} ${terms} ${family}`(formHaystack과 같다) */
  terms: string;
}

function formTerms(form: FormTemplate, categoryLabel: string): string {
  return `${form.keywords.join(' ')} ${categoryLabel}`;
}

export function formHaystack(form: FormTemplate, categoryLabel: string): string {
  return `${form.title} ${form.lead} ${formTerms(form, categoryLabel)} ${FORM_FAMILIES[form.family]}`;
}

export function formSearchEntries(): FormSearchEntry[] {
  return FORMS.map((form) => ({
    slug: form.slug,
    title: form.title,
    lead: form.lead,
    family: FORM_FAMILIES[form.family],
    terms: formTerms(form, formCategory(form.category).label),
  }));
}
