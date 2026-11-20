import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';
import { buildHwpx } from '../src/lib/hwpx-native';
import { buildHwpxParts } from '../src/lib/hwpx-native/document';

const build = (slug: string, mode: 'filled' | 'blank' = 'filled') => {
  const form = FORMS.find((item) => item.slug === slug);
  if (!form) throw new Error(`form not found: ${slug}`);
  return buildHwpxParts(form, {
    values: form.sample,
    rows: form.sampleRows ?? {},
    mode,
  });
};

describe('HWPX 네이티브 생성', () => {
  it('모든 양식이 오류 없이 생성된다', async () => {
    for (const form of FORMS) {
      const bytes = await buildHwpx(form, {
        values: form.sample,
        rows: form.sampleRows ?? {},
        mode: 'filled',
      });
      expect(bytes.byteLength, form.slug).toBeGreaterThan(2000);
    }
  });

  it('글자와 상자를 그림이 아니라 텍스트·표로 만든다', () => {
    const parts = build('leave-request');
    // 입력 상자는 1×1 표, 서명란은 3칸 표 — 모두 편집 가능한 표다.
    expect(parts.sectionXml).toContain('<hp:tbl ');
    expect(parts.sectionXml).toContain('<hp:t>');
    expect(parts.sectionXml).toContain('김옷깃');
    expect(parts.sectionXml).toContain('개인 사정으로 연차를 사용합니다.');
    // PDF를 거치지 않으므로 어떤 글자도 그림 개체가 되지 않는다.
    expect(parts.sectionXml).not.toContain('<hp:pic ');
    expect(parts.sectionXml).not.toContain('data:image');
  });

  it('kv 줄은 탭 정지와 점선 리더로 만든다', () => {
    const parts = build('leave-request');
    expect(parts.headXml).toContain('leader="DOT"');
    expect(parts.headXml).toContain('type="RIGHT"');
    // 3칸 줄: 58mm·116mm·174mm 지점을 HwpUnitChar(1/2 HWPUNIT)로 적는다.
    expect(parts.headXml).toContain('<hh:tabItem');
  });

  it('합계·서명·본문 표가 실제 표로 들어간다', () => {
    const parts = build('travel-expense');
    const tables = parts.sectionXml.match(/<hp:tbl /g) ?? [];
    expect(tables.length).toBeGreaterThanOrEqual(4); // 항목 표·합계·서명
    expect(parts.sectionXml).toContain('지출 합계');
    expect(parts.sectionXml).toContain('잔액');
  });

  it('빈 양식은 값을 비우고 점선 줄을 남긴다', () => {
    const parts = build('leave-request', 'blank');
    expect(parts.sectionXml).not.toContain('김옷깃');
    expect(parts.sectionXml).not.toContain('개인 사정으로');
    expect(parts.sectionXml).toContain('성명');
    expect(parts.headXml).toContain('bottomBorder type="DOT"');
  });

  it('쪽 번호와 2쪽 이후 머리글을 넣는다', () => {
    const parts = build('travel-report'); // 2쪽 문서
    expect(parts.sectionXml).toContain('<hp:pageNum pos="BOTTOM_RIGHT"');
    expect(parts.sectionXml).toContain('<hp:header ');
    expect(parts.sectionXml).toContain('hideFirstHeader="1"');
    expect(parts.sectionXml).toContain('applyPageType="BOTH"');
  });

  it('액자형 양식은 쪽 번호를 넣지 않고 테두리를 사각형으로 그린다', () => {
    const parts = build('certificate');
    expect(parts.sectionXml).not.toContain('<hp:pageNum');
    expect(parts.sectionXml).toContain('<hp:rect ');
    expect(parts.sectionXml).toContain('vertRelTo="PAPER"');
  });

  it('HWPX 패키지는 mimetype을 첫 항목·무압축으로 넣는다', async () => {
    const form = FORMS[0];
    if (!form) throw new Error('양식이 없습니다.');
    const bytes = await buildHwpx(form, {
      values: form.sample,
      rows: form.sampleRows ?? {},
      mode: 'filled',
    });
    expect(Buffer.from(bytes.subarray(0, 2)).toString('latin1')).toBe('PK');
    // 첫 로컬 헤더의 파일 이름이 mimetype이어야 한글이 형식을 알아본다.
    const first = Buffer.from(bytes.subarray(0, 80)).toString('latin1');
    expect(first).toContain('mimetype');
    const zip = await JSZip.loadAsync(bytes);
    expect(await zip.file('mimetype')?.async('string')).toBe('application/hwp+zip');
    const section = await zip.file('Contents/section0.xml')?.async('string');
    const header = await zip.file('Contents/header.xml')?.async('string');
    expect(section).toContain('<hs:sec');
    expect(header).toContain('<hh:charProperties');
    expect(header).toContain('face="나눔고딕"');
  });
});
