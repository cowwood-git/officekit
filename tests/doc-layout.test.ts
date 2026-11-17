import { describe, expect, it } from 'vitest';
import { layoutDocument } from '../src/lib/doc/layout';
import { ptToMm } from '../src/lib/doc/theme';
import type { DocPage, FormTemplate } from '../src/lib/doc/types';

const metrics = {
  widthOf: (text: string, sizePt: number, weight: 'regular' | 'bold'): number =>
    text.length * ptToMm(sizePt) * (weight === 'bold' ? 0.95 : 0.9),
};

const baseTemplate: FormTemplate = {
  slug: 'test',
  title: '테스트 신청서',
  family: 'hr',
  category: 'people',
  description: '',
  keywords: [],
  updated: '2026-11-14',
  lead: '',
  useCases: [],
  howTo: [],
  notes: [],
  fields: [
    { id: 'name', label: '성명', type: 'text', group: '신청자', required: true },
    { id: 'date', label: '작성일', type: 'date', group: '기본 정보' },
    { id: 'reason', label: '사유', type: 'textarea', group: '내용' },
  ],
  blocks: [
    { kind: 'header', title: '테스트 신청서', docNoField: 'docNo', dateField: 'date' },
    { kind: 'section', title: '신청자' },
    { kind: 'kv', columns: 1, rows: [{ label: '성명', field: 'name' }] },
    { kind: 'section', title: '사유' },
    { kind: 'text', field: 'reason', minLines: 3 },
    { kind: 'signature', roles: ['신청인', '대표'] },
    { kind: 'notice', text: '참고용 양식입니다.' },
  ],
  sample: {},
  footer: '테스트 문서',
  faq: [],
  sources: [],
};

const texts = (page: DocPage): string[] =>
  page.ops.filter((op) => op.kind === 'text').map((op) => op.text);

describe('문서 레이아웃', () => {
  it('입력값을 문서 좌표에 그린다', () => {
    const pages = layoutDocument(
      baseTemplate,
      { name: '김옷깃', date: '2026-11-14', reason: '개인 사정으로 신청합니다.' },
      metrics,
      { mode: 'filled' },
    );

    expect(pages).toHaveLength(1);
    const page = pages[0];
    expect(page).toBeDefined();
    if (!page) return;

    const values = texts(page);
    expect(values).toContain('테스트 신청서');
    expect(values).toContain('김옷깃');
    expect(values.some((value) => value.includes('2026. 11. 14.'))).toBe(true);
    expect(values).toContain('신청인');
    expect(values).toContain('(서명)');
    expect(values).toContain('1 / 1');
  });

  it('editorial 헤더는 문서번호를 위에, 제목을 왼쪽에 그린다', () => {
    const pages = layoutDocument(
      {
        ...baseTemplate,
        fields: [
          ...baseTemplate.fields,
          { id: 'docNo', label: '문서번호', type: 'text', group: '문서' },
        ],
        blocks: [
          {
            kind: 'header',
            variant: 'editorial',
            title: '테스트 신청서',
            docNoField: 'docNo',
            dateField: 'date',
          },
        ],
      },
      { docNo: 'T-20261114-001', date: '2026-11-14' },
      metrics,
      { mode: 'filled' },
    );
    const page = pages[0];
    expect(page).toBeDefined();
    if (!page) return;

    const texts = page.ops.filter((op) => op.kind === 'text');
    const title = texts.find((op) => op.text === '테스트 신청서');
    const docNo = texts.find((op) => op.text.includes('T-20261114-001'));
    expect(title?.x).toBeLessThan(40);
    expect(title?.size).toBe(18);
    expect(docNo?.y).toBeLessThan(title?.y ?? 0);
    expect(texts.some((op) => op.text.includes('작성일 2026. 11. 14.'))).toBe(true);
  });

  it('빈 양식은 값을 지우고 라벨과 서명란만 남긴다', () => {
    const pages = layoutDocument(
      baseTemplate,
      { name: '김옷깃', date: '2026-11-14', reason: '개인 사정' },
      metrics,
      { mode: 'blank' },
    );
    const page = pages[0];
    expect(page).toBeDefined();
    if (!page) return;

    const values = texts(page);
    expect(values).toContain('성명');
    expect(values).not.toContain('김옷깃');
    expect(values).not.toContain('2026. 11. 14.');
    expect(values).toContain('(서명)');
  });

  it('내용이 길면 다음 페이지로 넘기고 머리글을 반복한다', () => {
    const longTemplate: FormTemplate = {
      ...baseTemplate,
      blocks: [
        { kind: 'header', title: '테스트 신청서', dateField: 'date' },
        { kind: 'section', title: '긴 목록' },
        {
          kind: 'kv',
          columns: 1,
          rows: Array.from({ length: 40 }, (_, index) => ({
            label: `항목 ${index + 1}`,
            value: `값 ${index + 1}`,
          })),
        },
        { kind: 'notice', text: '끝.' },
      ],
    };

    const pages = layoutDocument(longTemplate, {}, metrics, { mode: 'filled' });
    expect(pages.length).toBeGreaterThan(1);
    const last = pages[pages.length - 1];
    expect(last).toBeDefined();
    if (!last) return;
    expect(texts(last)).toContain(`${pages.length} / ${pages.length}`);
  });

  it('모든 글자가 용지 안에 들어간다', () => {
    const pages = layoutDocument(
      baseTemplate,
      { name: '김옷깃', date: '2026-11-14', reason: '테스트' },
      metrics,
      { mode: 'filled' },
    );
    for (const page of pages) {
      for (const op of page.ops) {
        if (op.kind === 'text') {
          expect(op.x).toBeGreaterThanOrEqual(0);
          expect(op.x).toBeLessThanOrEqual(page.width);
          expect(op.y).toBeGreaterThanOrEqual(0);
          expect(op.y).toBeLessThanOrEqual(page.height);
        }
      }
    }
  });

  it('표를 그리고 페이지가 넘어가면 머리글을 반복한다', () => {
    const rows = Array.from({ length: 60 }, (_, index) => [
      String(index + 1),
      `품목 ${index + 1}`,
      '1',
      '10,000',
    ]);
    const tableTemplate: FormTemplate = {
      ...baseTemplate,
      blocks: [
        { kind: 'header', title: '표 테스트', dateField: 'date' },
        { kind: 'section', title: '품목' },
        {
          kind: 'table',
          columns: [
            { label: 'No', width: 12, align: 'center' },
            { label: '항목', width: 80 },
            { label: '수량', width: 20, align: 'right' },
            { label: '금액', width: 40, align: 'right' },
          ],
          rows,
        },
        {
          kind: 'totals',
          rows: [{ label: '합계', value: '600,000원', strong: true }],
        },
      ],
    };

    const pages = layoutDocument(tableTemplate, { date: '2026-11-14' }, metrics, {
      mode: 'filled',
    });
    expect(pages.length).toBeGreaterThan(1);
    const first = pages[0];
    const second = pages[1];
    const last = pages[pages.length - 1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(last).toBeDefined();
    if (!first || !second || !last) return;

    expect(texts(first)).toContain('항목');
    expect(texts(second)).toContain('항목');
    expect(texts(first)).toContain('품목 1');
    expect(texts(last)).toContain('600,000원');
  });

  it('공급자·공급받는자 상자를 그린다', () => {
    const partyTemplate: FormTemplate = {
      ...baseTemplate,
      blocks: [
        { kind: 'header', title: '거래 문서', dateField: 'date' },
        {
          kind: 'parties',
          left: { label: '공급자', lines: ['옷깃', '사업자 123-45-67891'] },
          right: { label: '공급받는자', lines: ['거래처 주식회사'] },
        },
      ],
    };

    const pages = layoutDocument(partyTemplate, { date: '2026-11-14' }, metrics, {
      mode: 'filled',
    });
    const page = pages[0];
    expect(page).toBeDefined();
    if (!page) return;

    const values = texts(page);
    expect(values).toContain('공급자');
    expect(values).toContain('공급받는자');
    expect(values).toContain('옷깃');
    expect(values).toContain('거래처 주식회사');
  });

  it('빈 양식의 체크리스트 필드는 값을 지우고 빈 체크박스를 남긴다', () => {
    const checklistTemplate: FormTemplate = {
      ...baseTemplate,
      fields: [
        ...baseTemplate.fields,
        { id: 'documents', label: '제출 서류', type: 'textarea', group: '내용' },
      ],
      blocks: [
        { kind: 'header', title: '제출 서류', dateField: 'date' },
        { kind: 'checklist', field: 'documents', columns: 2 },
      ],
    };

    const pages = layoutDocument(
      checklistTemplate,
      { date: '2026-11-14', documents: '주민등록등본\n졸업증명서' },
      metrics,
      { mode: 'blank' },
    );
    const page = pages[0];
    expect(page).toBeDefined();
    if (!page) return;

    expect(texts(page)).not.toContain('주민등록등본');
    const boxes = page.ops.filter(
      (op) =>
        op.kind === 'rect' && Math.abs(op.width - 3.1) < 0.01 && Math.abs(op.height - 3.1) < 0.01,
    );
    expect(boxes).toHaveLength(4);
  });
});
