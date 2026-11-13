import { describe, expect, it } from 'vitest';
import { TOOL_CAPABILITIES } from '../src/data/tool-capabilities';
import { tools } from '../src/data/tools';
import {
  extOf,
  FLOW_SLUGS,
  formatLabel,
  HANDOFF_TTL_MS,
  isHandoffFresh,
  matchesAccept,
  NEXT_BY_EXT,
  nextToolsFor,
  pastedName,
  suggestToolFor,
} from '../src/lib/file-flow';

const PDF_ACCEPT = 'application/pdf,.pdf';
const IMAGE_ACCEPT = 'image/*';
const file = (name: string, type = '') => ({ name, type });

describe('extOf', () => {
  it.each([
    ['보고서.PDF', 'pdf'],
    ['a.tar.gz', 'gz'],
    ['noext', ''],
    ['.hidden', ''],
    ['끝점.', ''],
  ])('%s → %s', (name, ext) => expect(extOf(name)).toBe(ext));
});

describe('matchesAccept', () => {
  it.each([
    [file('a.pdf', 'application/pdf'), PDF_ACCEPT, true],
    [file('a.pdf'), PDF_ACCEPT, true],
    [file('a.hwp'), PDF_ACCEPT, false],
    [file('a.jpg', 'image/jpeg'), IMAGE_ACCEPT, true],
    [file('a.heic'), IMAGE_ACCEPT, true],
    [file('a.pdf', 'application/pdf'), IMAGE_ACCEPT, false],
    [file('a.xlsx'), '.csv,.xlsx', true],
    [file('a.XLSX'), '.csv,.xlsx', true],
    [file('a.txt', 'text/plain'), '.csv,.xlsx', false],
    [file('anything.bin'), '', true],
  ])('%o / %s → %s', (f, accept, ok) => expect(matchesAccept(f, accept)).toBe(ok));
});

describe('formatLabel', () => {
  it('아는 형식은 한글 이름, 모르면 확장자', () => {
    expect(formatLabel('a.hwpx')).toBe('한글 문서');
    expect(formatLabel('a.key')).toBe('KEY 파일');
    expect(formatLabel('noext')).toBe('알 수 없는 형식');
  });
});

describe('suggestToolFor', () => {
  it('PDF 도구에 오피스 문서를 넣으면 PDF로 바꾸는 도구', () => {
    expect(suggestToolFor(file('a.hwp'), PDF_ACCEPT, 'pdf-merge')).toBe('hwpx-to-pdf');
    expect(suggestToolFor(file('a.docx'), PDF_ACCEPT, 'pdf-merge')).toBe('docx-to-pdf');
    expect(suggestToolFor(file('a.pptx'), PDF_ACCEPT, 'pdf-merge')).toBe('pptx-to-pdf');
    expect(suggestToolFor(file('a.jpg', 'image/jpeg'), PDF_ACCEPT, 'pdf-merge')).toBe('jpg-to-pdf');
  });

  it('이미지 도구에 PDF·HEIC 를 넣으면 이미지로 바꾸는 도구', () => {
    expect(suggestToolFor(file('a.pdf'), 'image/jpeg,image/png', 'image-crop')).toBe('pdf-to-jpg');
    expect(suggestToolFor(file('a.heic'), 'image/jpeg,image/png', 'image-crop')).toBe(
      'heic-to-jpg',
    );
  });

  it('지금 도구 자신은 고르지 않는다', () => {
    expect(suggestToolFor(file('a.zip'), PDF_ACCEPT, 'zip')).toBeNull();
  });

  it('모르는 형식은 고르지 않는다', () => {
    expect(suggestToolFor(file('a.exe'), PDF_ACCEPT, 'pdf-merge')).toBeNull();
  });

  it('고른 도구는 그 파일을 실제로 받는다', () => {
    const cases = ['a.hwp', 'a.docx', 'a.pptx', 'a.xlsx', 'a.heic', 'a.pdf', 'a.csv', 'a.zip'];
    for (const accept of [PDF_ACCEPT, IMAGE_ACCEPT, '.csv']) {
      for (const name of cases) {
        const slug = suggestToolFor(file(name), accept, 'none');
        if (!slug) continue;
        const accepts = TOOL_CAPABILITIES[slug]?.accepts ?? [];
        const ext = extOf(name);
        expect(accepts.includes(ext) || accepts.includes('image'), `${name} → ${slug}`).toBe(true);
      }
    }
  });
});

describe('nextToolsFor', () => {
  it('결과 형식에 맞는 다음 도구를 최대 3개, 자기 자신은 빼고', () => {
    expect(nextToolsFor('pdf-merge', '합친.pdf')).toEqual([
      'pdf-compress',
      'pdf-page-number',
      'pdf-sign',
    ]);
    expect(nextToolsFor('pdf-compress', 'a.pdf')).not.toContain('pdf-compress');
    expect(nextToolsFor('image-crop', 'a.png')).toHaveLength(3);
  });

  it('암호를 건 PDF 는 다른 도구가 못 열어 이어서 하기를 보이지 않는다', () => {
    expect(nextToolsFor('pdf-protect', 'a.pdf')).toEqual([]);
  });

  it('모르는 결과 형식은 비어 있다', () => {
    expect(nextToolsFor('text-diff', 'a.txt')).toEqual([]);
  });

  it('다음 도구는 모두 있고, 그 결과 형식을 받는다', () => {
    const slugs = new Set(tools.map((tool) => tool.slug));
    for (const [ext, list] of Object.entries(NEXT_BY_EXT)) {
      for (const slug of list) {
        expect(slugs.has(slug), slug).toBe(true);
        const accepts = TOOL_CAPABILITIES[slug]?.accepts ?? [];
        const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
        expect(
          accepts.includes(ext) || (isImage && accepts.includes('image')),
          `${ext} → ${slug}`,
        ).toBe(true);
      }
    }
  });
});

describe('FLOW_SLUGS', () => {
  it('없는 도구를 가리키지 않고 중복이 없다', () => {
    const slugs = new Set(tools.map((tool) => tool.slug));
    expect(FLOW_SLUGS.filter((slug) => !slugs.has(slug))).toEqual([]);
    expect(new Set(FLOW_SLUGS).size).toBe(FLOW_SLUGS.length);
  });
});

describe('pastedName', () => {
  const now = new Date(2026, 10, 13, 9, 5, 7);
  it('클립보드 기본 이름은 날짜가 든 이름으로 바꾼다', () => {
    expect(pastedName('image.png', 'image/png', now)).toBe('캡처-20261113-090507.png');
    expect(pastedName('', 'image/jpeg', now)).toBe('캡처-20261113-090507.jpg');
  });
  it('원래 이름이 있으면 그대로 둔다', () => {
    expect(pastedName('견적서.pdf', 'application/pdf', now)).toBe('견적서.pdf');
  });
});

describe('isHandoffFresh', () => {
  it('10분 안에만 받는다', () => {
    expect(isHandoffFresh(1000, 1000 + HANDOFF_TTL_MS)).toBe(true);
    expect(isHandoffFresh(1000, 1001 + HANDOFF_TTL_MS)).toBe(false);
    expect(isHandoffFresh(2000, 1000)).toBe(false);
  });
});
