import { PDFDocument, PDFName } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  applyMetadata,
  cleanMetadata,
  formatPdfDate,
  hasMetadata,
  metadataFileName,
  metadataSummary,
} from '../src/lib/pdf-metadata';

describe('cleanMetadata', () => {
  it('공백을 정리하고 길이를 제한한다', () => {
    const result = cleanMetadata({
      title: '  보고서   초안  ',
      author: ' 김오피스 ',
      subject: '2026년   1분기',
      keywords: '보고서, 초안',
    });
    expect(result.title).toBe('보고서 초안');
    expect(result.author).toBe('김오피스');
    expect(result.subject).toBe('2026년 1분기');
    expect(result.keywords).toEqual(['보고서', '초안']);
  });

  it('키워드 중복과 빈 값을 제거한다', () => {
    const result = cleanMetadata({
      title: '',
      author: '',
      subject: '',
      keywords: 'PDF, pdf, , 계약서; 계약서\n견적',
    });
    expect(result.keywords).toEqual(['PDF', '계약서', '견적']);
  });

  it('키워드 개수 상한을 지킨다', () => {
    const result = cleanMetadata({
      title: '',
      author: '',
      subject: '',
      keywords: Array.from({ length: 40 }, (_, index) => `k${index}`).join(','),
    });
    expect(result.keywords).toHaveLength(30);
  });
});

describe('hasMetadata / summary', () => {
  it('값이 있으면 true', () => {
    expect(hasMetadata({ title: '', author: '', subject: '', keywords: '' })).toBe(false);
    expect(hasMetadata({ title: '', author: '김', subject: '', keywords: '' })).toBe(true);
  });

  it('채운 항목을 요약한다', () => {
    expect(
      metadataSummary({ title: '보고서', author: '김', subject: '', keywords: ['a', 'b'] }),
    ).toBe('제목 · 작성자 · 키워드 2개 저장');
    expect(metadataSummary({ title: '', author: '', subject: '', keywords: [] })).toBe(
      '모든 메타데이터 비움',
    );
  });
});

describe('metadataFileName', () => {
  it('결과 파일명을 만든다', () => {
    expect(metadataFileName('계약서.pdf')).toBe('계약서-metadata.pdf');
  });
});

describe('formatPdfDate', () => {
  it('날짜를 표시하고 잘못된 값은 그대로 둔다', () => {
    expect(formatPdfDate(undefined)).toBe('-');
    expect(formatPdfDate('not-a-date')).toBe('not-a-date');
    expect(formatPdfDate('2026-11-10T00:00:00Z')).toContain('2026');
  });
});

describe('applyMetadata', () => {
  it('작성자를 지우면 XMP에 남은 옛 작성자도 함께 지운다', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.setAuthor('김오피스');
    source.setProducer('Microsoft Word');
    const xmp = source.context.stream('<x:xmpmeta><dc:creator>김오피스</dc:creator></x:xmpmeta>', {
      Type: 'Metadata',
      Subtype: 'XML',
    });
    source.catalog.set(PDFName.of('Metadata'), source.context.register(xmp));
    const bytes = await source.save({ updateFieldAppearances: false });

    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    applyMetadata(doc, cleanMetadata({ title: '', author: '', subject: '', keywords: '' }));
    const saved = await PDFDocument.load(await doc.save(), { updateMetadata: false });

    expect(saved.getAuthor() ?? '').toBe('');
    expect(saved.catalog.get(PDFName.of('Metadata'))).toBeUndefined();
    expect(saved.getProducer()).toBe('Microsoft Word');
  });
});
