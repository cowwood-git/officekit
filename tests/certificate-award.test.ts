import { describe, expect, it } from 'vitest';
import { award } from '../src/data/forms/award';
import { certificate } from '../src/data/forms/certificate';
import { layoutDocument } from '../src/lib/doc/layout';
import { ptToMm } from '../src/lib/doc/theme';
import type { DocPage } from '../src/lib/doc/types';

const metrics = {
  widthOf: (text: string, sizePt: number, weight: 'regular' | 'bold'): number =>
    text.length * ptToMm(sizePt) * (weight === 'bold' ? 0.95 : 0.9),
};

const texts = (page: DocPage): string[] =>
  page.ops.filter((op) => op.kind === 'text').map((op) => op.text);

const allText = (pages: DocPage[]): string => pages.flatMap(texts).join(' ');

describe('수료증', () => {
  it('액자 테두리와 수료 정보, 발급 기관을 한 장에 그린다', () => {
    const pages = layoutDocument(certificate, certificate.sample, metrics, {
      mode: 'filled',
    });
    expect(pages).toHaveLength(1);
    const page = pages[0];
    expect(page).toBeDefined();
    if (!page) return;

    const text = texts(page).join(' ');
    expect(text).toContain('CERTIFICATE OF COMPLETION');
    expect(text).toContain('수료증');
    expect(text).toContain('김옷깃');
    expect(text).toContain('2026 사무행정 실무 과정');
    expect(text.replaceAll(' ', '')).toContain('40시간');
    expect(text).toContain('2026년 11월 15일');
    expect(text).toContain('옷깃 아카데미');
    expect(text).toContain('대표이사 박대표');

    const frame = page.ops.find(
      (op) =>
        op.kind === 'rect' &&
        Math.abs(op.x - 12) < 0.01 &&
        Math.abs(op.y - 12) < 0.01 &&
        Math.abs(op.width - 186) < 0.01,
    );
    expect(frame).toBeDefined();
    // 액자형 문서는 바닥글과 페이지 번호를 그리지 않는다.
    expect(text).not.toContain('1 / 1');
  });

  it('교육 기간과 시간을 확인한다', () => {
    expect(
      certificate.validate?.({ courseStart: '2026-11-01', courseEnd: '2026-10-01' }, {}),
    ).toContain('교육 시작일은 종료일보다 늦을 수 없습니다.');
    expect(certificate.validate?.({ hours: '0' }, {})).toContain(
      '교육 시간은 1시간 이상이어야 합니다.',
    );
  });

  it('빈 양식에서도 제목과 증명 문구는 남는다', () => {
    const pages = layoutDocument(certificate, {}, metrics, { mode: 'blank' });
    const text = allText(pages);

    expect(text).toContain('수료증');
    expect(text).toContain('아래 사람은 다음 교육 과정을 수료하였음을 증명합니다.');
    expect(text).not.toContain('김옷깃');
  });
});

describe('상장', () => {
  it('수상자와 상 이름, 수여 사유를 한 장에 그린다', () => {
    const pages = layoutDocument(award, award.sample, metrics, { mode: 'filled' });
    expect(pages).toHaveLength(1);
    const text = allText(pages);

    expect(text).toContain('CERTIFICATE OF APPRECIATION');
    expect(text).toContain('상장');
    expect(text).toContain('김옷깃');
    expect(text).toContain('2026년 우수 직원상');
    expect(text).toContain('연말 정산 업무를 안정적으로 마무리하고');
    expect(text).toContain('부상: 상금 50만 원, 상패');
    expect(text).toContain('2026년 11월 15일');
    expect(text).toContain('대표이사 박대표');
  });

  it('수여 사유가 너무 짧으면 안내한다', () => {
    expect(award.validate?.({ reason: '열심히 함' }, {})).toEqual([
      '수여 사유를 10자 이상 적어 주세요.',
    ]);
    expect(
      award.validate?.({ reason: '연말 정산을 기한 내 마무리하고 오류를 줄였습니다.' }, {}),
    ).toEqual([]);
  });
});
