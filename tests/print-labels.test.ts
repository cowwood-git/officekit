import { describe, expect, it } from 'vitest';
import { invitation } from '../src/data/forms/invitation';
import { nameBadge } from '../src/data/forms/name-badge';
import { shippingLabel } from '../src/data/forms/shipping-label';
import { ticket } from '../src/data/forms/ticket';
import { layoutDocument } from '../src/lib/doc/layout';
import { ptToMm } from '../src/lib/doc/theme';
import type { DocPage, FormTemplate } from '../src/lib/doc/types';

const metrics = {
  widthOf: (text: string, sizePt: number, weight: 'regular' | 'bold'): number =>
    text.length * ptToMm(sizePt) * (weight === 'bold' ? 0.95 : 0.9),
};

const texts = (pages: DocPage[]): string[] =>
  pages.flatMap((page) =>
    page.ops.filter((op) => op.kind === 'text').map((op) => (op.kind === 'text' ? op.text : '')),
  );

const blank = (form: FormTemplate) => layoutDocument(form, {}, metrics, { mode: 'blank' });
const filled = (form: FormTemplate) =>
  layoutDocument(form, form.sample ?? {}, metrics, { mode: 'filled' }, form.sampleRows ?? {});

describe('인쇄 카드', () => {
  it('빈 명찰·티켓·라벨에도 안내 문구를 남긴다', () => {
    expect(texts(blank(nameBadge))).toEqual(
      expect.arrayContaining(['NAME BADGE', '이름', '소속 · 직위']),
    );
    expect(texts(blank(ticket))).toEqual(expect.arrayContaining(['ADMIT ONE', '행사명', '좌석']));
    expect(texts(blank(invitation))).toEqual(
      expect.arrayContaining(['I N V I T A T I O N', '초대합니다', '날짜 · 시간']),
    );
    expect(texts(blank(shippingLabel))).toEqual(
      expect.arrayContaining(['받는 곳', '주소', '연락처']),
    );
  });

  it('작성본에는 입력값을 그린다', () => {
    expect(texts(filled(nameBadge))).toEqual(
      expect.arrayContaining(['김옷깃', '경영지원팀 · 팀장', '진행']),
    );
    expect(texts(filled(ticket))).toEqual(
      expect.arrayContaining(['2026 옷깃 컨퍼런스', 'A-12', '001']),
    );
    expect(texts(filled(invitation))).toEqual(
      expect.arrayContaining(['2026 옷깃 고객 감사행사', '서울 강남구 그랜드홀 3층']),
    );
  });

  it('인쇄 카드는 1쪽으로 유지된다', () => {
    for (const form of [nameBadge, ticket, invitation, shippingLabel]) {
      expect(filled(form)).toHaveLength(1);
      expect(blank(form)).toHaveLength(1);
    }
  });
});
