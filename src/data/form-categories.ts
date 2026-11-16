import type { FormCategory, FormTemplate } from '@/lib/doc/types';

export interface FormCategoryMeta {
  id: FormCategory;
  label: string;
  description: string;
  examples: string;
}

/** 홈·양식관·검색이 함께 쓰는 양식 탐색 카테고리. */
export const FORM_CATEGORIES: readonly FormCategoryMeta[] = [
  {
    id: 'people',
    label: '인사·총무',
    description: '휴가·출장·인수인계처럼 사람과 조직에 관한 문서',
    examples: '휴가 · 출장 · 인수인계',
  },
  {
    id: 'money',
    label: '재무·거래',
    description: '견적·발주·정산·납품처럼 돈과 거래에 관한 문서',
    examples: '견적 · 발주 · 지출 · 납품',
  },
  {
    id: 'report',
    label: '보고·기록',
    description: '회의·주간보고·표·체크리스트처럼 기록을 남기는 문서',
    examples: '회의록 · 주간보고 · 체크리스트',
  },
  {
    id: 'proof',
    label: '증명·행정',
    description: '재직·위임처럼 사실을 증명하거나 권한을 넘기는 문서',
    examples: '재직증명 · 위임',
  },
  {
    id: 'award',
    label: '수료·시상',
    description: '수료증·상장처럼 이수와 성과를 기리는 문서',
    examples: '수료증 · 상장',
  },
] as const;

export function formCategory(id: FormCategory): FormCategoryMeta {
  const found = FORM_CATEGORIES.find((category) => category.id === id);
  if (!found) throw new Error(`Unknown form category: ${id}`);
  return found;
}

export function formsInCategory(
  forms: readonly FormTemplate[],
  id: FormCategory,
): readonly FormTemplate[] {
  return forms.filter((form) => form.category === id);
}
