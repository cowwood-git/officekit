import { describe, expect, it } from 'vitest';
import {
  extensionOf,
  imageMimeFor,
  MAX_CREATE_FILES,
  MAX_ZIP_ENTRIES,
  sanitizeZipPath,
  uniqueZipPath,
  zipArchiveFileName,
  zipEntryKind,
  zipExtractFileName,
} from '../src/lib/zip';

describe('ZIP 경로와 종류', () => {
  it('상위 경로와 제어 문자를 제거한다', () => {
    expect(sanitizeZipPath('../../etc/passwd')).toBe('etc/passwd');
    expect(sanitizeZipPath('/folder\\file?.txt')).toBe('folder/file_.txt');
    expect(sanitizeZipPath('   ')).toBe('file');
  });

  it('같은 이름에는 번호를 붙인다', () => {
    const used = new Set<string>();
    expect(uniqueZipPath('photo.jpg', used)).toBe('photo.jpg');
    expect(uniqueZipPath('photo.jpg', used)).toBe('photo (1).jpg');
    expect(uniqueZipPath('photo.jpg', used)).toBe('photo (2).jpg');
  });

  it('텍스트·이미지 종류를 구분한다', () => {
    expect(zipEntryKind('readme.md')).toBe('text');
    expect(zipEntryKind('photo.JPG')).toBe('image');
    expect(zipEntryKind('archive.bin')).toBe('other');
    expect(imageMimeFor('icon.svg')).toBe('image/svg+xml');
  });

  it('확장자를 소문자로 읽는다', () => {
    expect(extensionOf('A.PDF')).toBe('pdf');
    expect(extensionOf('README')).toBe('');
  });

  it('내려받을 ZIP 이름을 만든다', () => {
    expect(zipArchiveFileName(new Date(2026, 10, 13))).toBe('압축-20261113.zip');
    expect(zipExtractFileName('photos.zip', new Date(2026, 10, 13))).toBe(
      'photos-선택-20261113.zip',
    );
  });

  it('안전한 처리 한도를 제공한다', () => {
    expect(MAX_ZIP_ENTRIES).toBe(2000);
    expect(MAX_CREATE_FILES).toBe(1000);
  });
});
