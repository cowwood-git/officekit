import { describe, expect, it } from 'vitest';
import {
  customSheet,
  hasHeaderRow,
  type LabelRow,
  labelFileName,
  labelRects,
  labelSize,
  labelsPerPage,
  pagesFor,
  presetById,
  rowsFromTable,
} from '../src/lib/label-print';

const row = (name: string): LabelRow => ({ name, postal: '', address: '', phone: '' });

describe('라벨 인쇄', () => {
  it('A4 3×8 프리셋은 24칸이고 라벨 크기가 맞는다', () => {
    const sheet = presetById('sheet-3x8');
    expect(labelsPerPage(sheet)).toBe(24);
    const size = labelSize(sheet);
    expect(size.widthMm).toBeCloseTo(63.5, 1);
    expect(size.heightMm).toBeCloseTo(33.9, 1);
    expect(labelRects(sheet)).toHaveLength(24);
  });

  it('시작 위치를 반영해 첫 페이지를 비운다', () => {
    const sheet = presetById('sheet-3x8');
    const pages = pagesFor([row('A'), row('B')], sheet, 3);
    expect(pages).toHaveLength(1);
    expect(pages[0]?.[0]).toBeNull();
    expect(pages[0]?.[1]).toBeNull();
    expect(pages[0]?.[2]?.name).toBe('A');
    expect(pages[0]?.[3]?.name).toBe('B');
  });

  it('한 페이지를 넘으면 다음 페이지로 나눈다', () => {
    const sheet = presetById('sheet-2x6');
    const rows = Array.from({ length: 14 }, (_, index) => row(`${index + 1}`));
    const pages = pagesFor(rows, sheet, 1);
    expect(pages).toHaveLength(2);
    expect(pages[0]?.filter(Boolean)).toHaveLength(12);
    expect(pages[1]?.filter(Boolean)).toHaveLength(2);
  });

  it('사용자 지정 시트의 행·열을 제한한다', () => {
    const sheet = customSheet({ columns: 99, rows: 0, marginMm: -4, gapMm: 99 });
    expect(sheet.columns).toBe(8);
    expect(sheet.rows).toBe(1);
    expect(sheet.marginXMm).toBe(0);
    expect(sheet.gapXMm).toBe(10);
  });

  it('CSV 머리글을 보고 이름·주소·연락처를 매핑한다', () => {
    const result = rowsFromTable([
      ['성명', '우편번호', '주소', '연락처'],
      ['홍길동', '06236', '서울시 강남구', '010-1234-5678'],
      ['김옷깃', '06235', '서울시 송파구', '010-0000-0000'],
    ]);
    expect(result.hasHeader).toBe(true);
    expect(result.rows[0]).toEqual({
      name: '홍길동',
      postal: '06236',
      address: '서울시 강남구',
      phone: '010-1234-5678',
    });
  });

  it('머리글이 없으면 이름·주소·연락처 순서로 읽는다', () => {
    const result = rowsFromTable([
      ['홍길동', '서울시 강남구', '010-1234-5678'],
      ['김옷깃', '서울시 송파구', '010-0000-0000'],
    ]);
    expect(result.hasHeader).toBe(false);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]?.name).toBe('김옷깃');
  });

  it('머리글 없는 네 열은 이름·우편번호·주소·연락처로 읽는다', () => {
    const result = rowsFromTable([['홍길동', '06236', '서울시 강남구', '010-1234-5678']]);
    expect(result.rows[0]).toEqual({
      name: '홍길동',
      postal: '06236',
      address: '서울시 강남구',
      phone: '010-1234-5678',
    });
  });

  it('한 열짜리 주소 목록도 읽는다', () => {
    const result = rowsFromTable([['서울시 강남구 테헤란로 1'], ['부산시 해운대구 1']]);
    expect(result.rows[0]).toMatchObject({ name: '', address: '서울시 강남구 테헤란로 1' });
  });

  it('빈 행은 버리고 최대 200개로 제한한다', () => {
    const rows = Array.from({ length: 205 }, (_, index) => [`사람 ${index}`]);
    const result = rowsFromTable([['주소'], ...rows]);
    expect(result.rows).toHaveLength(200);
    expect(result.rows[0]?.address).toBe('사람 0');
  });

  it('머리글 여부와 파일 이름을 만든다', () => {
    expect(hasHeaderRow([['이름', '주소']])).toBe(true);
    expect(hasHeaderRow([['홍길동', '서울']])).toBe(false);
    expect(labelFileName(new Date(2026, 10, 13))).toBe('라벨-20261113.pdf');
  });
});
