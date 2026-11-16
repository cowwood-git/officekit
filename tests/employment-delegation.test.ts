import { describe, expect, it } from 'vitest';
import { delegation } from '../src/data/forms/delegation';
import { employmentCertificate } from '../src/data/forms/employment-certificate';
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

describe('재직증명서', () => {
  it('재직 정보와 발급 회사, 증명 문구를 한 장에 그린다', () => {
    const pages = layoutDocument(employmentCertificate, employmentCertificate.sample, metrics, {
      mode: 'filled',
    });
    expect(pages).toHaveLength(1);
    const text = allText(pages);

    expect(text).toContain('재직증명서');
    expect(text).toContain('김옷깃');
    expect(text).toContain('1990. 5. 12.');
    expect(text).toContain('2020. 3. 2. ~ 현재');
    expect(text).toContain('6년 8개월');
    expect(text).toContain('○○은행 대출 심사 제출용');
    expect(text).toContain('상기와 같이 재직하고 있음을 증명합니다.');
    expect(text).toContain('옷깃 주식회사');
    expect(text).toContain('123-45-67891');
    expect(text).toContain('발급번호');
    expect(text).toContain('발급일');
    expect(text).toContain('대표이사');
  });

  it('입사일과 사업자등록번호를 확인한다', () => {
    expect(
      employmentCertificate.validate?.({ date: '2026-11-15', joinedAt: '2026-12-01' }, {}),
    ).toContain('입사일은 발급일보다 늦을 수 없습니다.');
    expect(
      employmentCertificate.validate?.({ date: '2026-11-15', issuerBiz: '123-45-67890' }, {}),
    ).toContain('사업자등록번호를 다시 확인하세요.');
  });

  it('빈 양식에서도 증명 문구와 발급 회사 항목은 남는다', () => {
    const pages = layoutDocument(employmentCertificate, {}, metrics, {
      mode: 'blank',
    });
    const text = allText(pages);

    expect(text).toContain('재직증명서');
    expect(text).toContain('상기와 같이 재직하고 있음을 증명합니다.');
    expect(text).toContain('발급 회사');
    expect(text).not.toContain('김옷깃');
  });
});

describe('위임장', () => {
  it('위임인·수임인과 위임 사항, 첨부 체크리스트를 한 장에 그린다', () => {
    const pages = layoutDocument(delegation, delegation.sample, metrics, {
      mode: 'filled',
    });
    expect(pages).toHaveLength(1);
    const text = allText(pages);

    expect(text).toContain('위임장');
    expect(text).toContain('김옷깃');
    expect(text).toContain('박수임');
    expect(text).toContain('통장 재발급을 신청');
    expect(text).toContain('2026년 11월 15일부터');
    expect(text).toContain('○○은행 통장 재발급');
    expect(text).toContain('위임인 신분증 사본');
    expect(text).toContain('수임인 신분증 사본');

    const boxes = pages.flatMap((page) =>
      page.ops.filter((op) => op.kind === 'rect' && Math.abs(op.width - 3.1) < 0.01),
    );
    expect(boxes).toHaveLength(4);
  });

  it('위임 사항과 범위가 너무 짧으면 안내한다', () => {
    expect(delegation.validate?.({ matter: '대신 처리', scope: '한 달' }, {})).toHaveLength(2);
    expect(
      delegation.validate?.(
        {
          matter: '본인을 대신해 통장 재발급을 신청하고 서류를 수령하는 업무',
          scope: '2026년 11월 15일부터 2026년 12월 31일까지',
        },
        {},
      ),
    ).toEqual([]);
  });

  it('빈 양식에서는 당사자 이름을 지우고 안내 문구만 남긴다', () => {
    const pages = layoutDocument(delegation, {}, metrics, { mode: 'blank' });
    const text = allText(pages);

    expect(text).toContain('본인은 아래 사람에게 다음 사항을 위임합니다.');
    expect(text).toContain('위임인 (본인)');
    expect(text).toContain('수임인 (대리인)');
    expect(text).not.toContain('김옷깃');
    expect(text).not.toContain('박수임');
  });
});
