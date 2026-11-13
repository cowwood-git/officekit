import { describe, expect, it } from 'vitest';
import {
  applyRename,
  cleanBase,
  DEFAULT_RULE,
  padNumber,
  splitName,
  todayStamp,
} from '../src/lib/file-rename';

const rule = (patch: Partial<typeof DEFAULT_RULE>) => ({
  ...DEFAULT_RULE,
  date: '20261111',
  ...patch,
});

describe('file-rename', () => {
  it('이름과 확장자를 나눈다', () => {
    expect(splitName('a.b.jpg')).toEqual(['a.b', '.jpg']);
    expect(splitName('.env')).toEqual(['.env', '']);
    expect(splitName('README')).toEqual(['README', '']);
  });

  it('순번·날짜 틀', () => {
    const names = ['IMG_1.JPG', 'IMG_2.jpg', 'memo.txt'];
    expect(applyRename(names, rule({ template: '여행_{n}', digits: 3 }))).toEqual([
      '여행_001.JPG',
      '여행_002.jpg',
      '여행_003.txt',
    ]);
    expect(applyRename(['a.png'], rule({ template: '{date}_{name}' }))).toEqual(['20261111_a.png']);
    expect(
      applyRename(['a.png', 'b.png'], rule({ template: '{name}-{n}', start: 9, digits: 1 })),
    ).toEqual(['a-9.png', 'b-10.png']);
  });

  it('찾아 바꾸기와 대소문자(확장자는 그대로)', () => {
    expect(
      applyRename(['IMG_0001.JPG'], rule({ find: 'IMG_', replace: '', textCase: 'lower' })),
    ).toEqual(['0001.JPG']);
    expect(applyRename(['report draft.pdf'], rule({ textCase: 'upper' }))).toEqual([
      'REPORT DRAFT.pdf',
    ]);
  });

  it('겹치는 이름에 번호를 붙인다', () => {
    expect(applyRename(['a.jpg', 'b.jpg', 'c.png'], rule({ template: '사진' }))).toEqual([
      '사진.jpg',
      '사진 (2).jpg',
      '사진.png',
    ]);
  });

  it('쓸 수 없는 글자를 바꾸고, 비면 file', () => {
    expect(cleanBase('a/b:c*?')).toBe('a_b_c_');
    expect(applyRename(['x.txt'], rule({ template: '   ', find: 'x', replace: '' }))).toEqual([
      'file.txt',
    ]);
  });

  it('보조 함수', () => {
    expect(padNumber(7, 3)).toBe('007');
    expect(padNumber(7, 0)).toBe('7');
    expect(todayStamp(new Date(2026, 0, 5))).toBe('20260105');
  });
});
