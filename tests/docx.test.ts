import { describe, expect, it } from 'vitest';
import { charCount, docxTextFileName, isDocx, wordCount } from '../src/lib/docx';

describe('isDocx', () => {
  it('docx 확장자를 인식한다', () => {
    expect(isDocx('report.docx')).toBe(true);
    expect(isDocx('REPORT.DOCX')).toBe(true);
    expect(isDocx('report.doc')).toBe(false);
    expect(isDocx('report.pdf')).toBe(false);
  });
});

describe('wordCount', () => {
  it('공백 기준으로 센다', () => {
    expect(wordCount('한글 문서 테스트')).toBe(3);
    expect(wordCount('  앞뒤 공백  ')).toBe(2);
    expect(wordCount('')).toBe(0);
  });
});

describe('charCount', () => {
  it('공백을 제외하고 센다', () => {
    expect(charCount('한 글 자')).toBe(3);
  });
});

describe('docxTextFileName', () => {
  it('txt 파일명을 만든다', () => {
    expect(docxTextFileName('보고서.docx')).toBe('보고서.txt');
    expect(docxTextFileName('a/b.docx')).toBe('a_b.txt');
    expect(docxTextFileName('x')).toBe('x.txt');
  });
});
