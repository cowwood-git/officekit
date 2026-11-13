import { describe, expect, it } from 'vitest';
import {
  cleanHwpxText,
  findBinaryPath,
  hwpxPageLabel,
  hwpxSectionLabel,
  hwpxTitle,
  isHangulFile,
  isHwpFile,
  isHwpxFile,
  pageAspectRatio,
  placeGridCells,
  sectionFiles,
  sectionNumber,
} from '../src/lib/hwpx';

describe('isHwpxFile', () => {
  it('확장자를 구분한다', () => {
    expect(isHwpxFile('보고서.HWPX')).toBe(true);
    expect(isHwpxFile('보고서.hwp')).toBe(false);
  });

  it('HWP와 한글 문서 여부를 구분한다', () => {
    expect(isHwpFile('보고서.HWP')).toBe(true);
    expect(isHwpFile('보고서.hwpx')).toBe(false);
    expect(isHangulFile('보고서.hwp')).toBe(true);
    expect(isHangulFile('보고서.hwpx')).toBe(true);
    expect(isHangulFile('보고서.pdf')).toBe(false);
  });
});

describe('sectionFiles', () => {
  it('section 숫자 순서로 정렬한다', () => {
    expect(
      sectionFiles(['Contents/section10.xml', 'Contents/section2.xml', 'Preview/PrvText.txt']),
    ).toEqual(['Contents/section2.xml', 'Contents/section10.xml']);
  });

  it('section 번호를 읽는다', () => {
    expect(sectionNumber('Contents/section3.xml')).toBe(3);
    expect(sectionNumber('기타.xml')).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe('findBinaryPath', () => {
  const files = ['BinData/image1.png', 'BinData/image2.jpg', 'BinData/other.png'];
  it('ID와 같은 이름의 파일을 찾는다', () => {
    expect(findBinaryPath(files, 'image1')).toBe('BinData/image1.png');
    expect(findBinaryPath(files, 'image2')).toBe('BinData/image2.jpg');
  });

  it('없으면 undefined', () => {
    expect(findBinaryPath(files, 'image9')).toBeUndefined();
    expect(findBinaryPath(files, ' ')).toBeUndefined();
  });
});

describe('placeGridCells', () => {
  it('colspan·rowspan 자리를 비워 두고 배치한다', () => {
    const matrix = placeGridCells([
      { row: 0, col: 0, rowSpan: 1, colSpan: 2, value: '제목' },
      { row: 0, col: 2, rowSpan: 1, colSpan: 1, value: '값' },
      { row: 1, col: 0, rowSpan: 1, colSpan: 1, value: '가' },
      { row: 1, col: 1, rowSpan: 1, colSpan: 1, value: '나' },
      { row: 1, col: 2, rowSpan: 1, colSpan: 1, value: '다' },
    ]);
    expect(matrix).toHaveLength(2);
    expect(matrix[0]?.[0]?.value).toBe('제목');
    expect(matrix[0]?.[1]).toBeNull();
    expect(matrix[1]?.[2]?.value).toBe('다');
  });

  it('rowspan 이 다음 행을 차지한다', () => {
    const matrix = placeGridCells([
      { row: 0, col: 0, rowSpan: 2, colSpan: 1, value: '세로' },
      { row: 0, col: 1, rowSpan: 1, colSpan: 1, value: '오른쪽' },
      { row: 1, col: 1, rowSpan: 1, colSpan: 1, value: '아래' },
    ]);
    expect(matrix).toHaveLength(2);
    expect(matrix[0]?.[0]?.value).toBe('세로');
    expect(matrix[1]?.[0]).toBeNull();
    expect(matrix[1]?.[1]?.value).toBe('아래');
  });

  it('잘못된 값을 보정한다', () => {
    const matrix = placeGridCells([{ row: -1, col: -2, rowSpan: 0, colSpan: 0, value: 'x' }]);
    expect(matrix[0]?.[0]?.value).toBe('x');
  });

  it('빈 표는 빈 행렬', () => {
    expect(placeGridCells([])).toEqual([]);
  });
});

describe('pageAspectRatio', () => {
  it('HWPUNIT 비율을 돌려준다', () => {
    expect(pageAspectRatio(59528, 84186)).toBeCloseTo(59528 / 84186, 5);
  });

  it('잘못된 크기는 A4 비율', () => {
    expect(pageAspectRatio(0, 0)).toBeCloseTo(210 / 297, 2);
  });
});

describe('text helpers', () => {
  it('줄바꿈과 NBSP를 다듬는다', () => {
    expect(cleanHwpxText('가\u00a0나\r\n다')).toBe('가 나\n다');
  });

  it('라벨과 제목을 만든다', () => {
    expect(hwpxSectionLabel(0)).toBe('구역 1');
    expect(hwpxPageLabel(3)).toBe('3쪽');
    expect(hwpxTitle('보고서.HWPX')).toBe('보고서');
  });
});
