import { describe, expect, it } from 'vitest';
import { FORMS, getForm } from '../src/data/forms';
import { buildHwpxParts } from '../src/lib/hwpx-native/document';

const NOTEBOOKS = [
  'korean-notebook-8',
  'korean-notebook-10',
  'korean-notebook-11',
  'english-notebook-4',
  'english-notebook-3',
  'music-notebook',
  'math-notebook-5mm',
  'math-notebook-10mm',
  'hanja-notebook-8',
  'hanja-notebook-10',
  'dictation-notebook',
  'vocabulary-notebook',
] as const;

const build = (slug: string) => {
  const form = getForm(slug);
  if (!form) throw new Error(`form not found: ${slug}`);
  return {
    form,
    parts: buildHwpxParts(form, {
      values: form.sample,
      rows: form.sampleRows ?? {},
      mode: 'filled',
    }),
  };
};

describe('아이들 공책 12종', () => {
  it('모두 학교·학습 카테고리와 190×260mm 시트를 쓴다', () => {
    for (const slug of NOTEBOOKS) {
      const form = getForm(slug);
      expect(form, slug).toBeTruthy();
      expect(form?.category, slug).toBe('kids');
      expect(form?.sheet?.width, slug).toBe(190);
      expect(form?.sheet?.height, slug).toBe(260);
      expect(form?.sheet?.border, slug).toBe(false);
    }
    expect(FORMS.filter((form) => form.category === 'kids')).toHaveLength(NOTEBOOKS.length);
  });

  it('칸 노트는 점선 십자와 함께 실제 표로 만든다', () => {
    const { parts } = build('korean-notebook-10');
    expect(parts.sectionXml).toContain('<hp:tbl ');
    // 10칸×14줄 = 140칸이 모두 편집 가능한 표 세포다.
    expect((parts.sectionXml.match(/<hp:tc /g) ?? []).length).toBeGreaterThanOrEqual(140);
  });

  it('영어 4선은 네 줄씩 12묶음, 세 번째 선은 빨간색이다', () => {
    const { parts } = build('english-notebook-4');
    expect((parts.sectionXml.match(/<hp:tr>/g) ?? []).length).toBe(12 * 4 + 11);
    expect(parts.headXml).toContain('color="#D9534F"');
  });

  it('5mm 모눈은 38×48칸을 표로 만든다', () => {
    const { parts } = build('math-notebook-5mm');
    expect((parts.sectionXml.match(/<hp:tc /g) ?? []).length).toBeGreaterThanOrEqual(38 * 48);
  });

  it('받아쓰기·단어장은 입력 글씨를 연한 회색으로 인쇄한다', () => {
    const dictation = build('dictation-notebook').parts;
    expect(dictation.headXml).toContain('textColor="#C3CAD2"');
    expect(dictation.sectionXml).toContain('학');
    expect(dictation.sectionXml).toContain('교');

    const vocabulary = build('vocabulary-notebook').parts;
    expect(vocabulary.sectionXml).toContain('family');
    expect(vocabulary.sectionXml).toContain('가족');
    expect(vocabulary.headXml).toContain('textColor="#C3CAD2"');
  });
});
