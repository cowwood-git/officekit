import { describe, expect, it } from 'vitest';
import {
  extensionFor,
  imageOutputName,
  isSupportedImage,
  labelFor,
  supportsQuality,
} from '../src/lib/image-convert';

describe('extensionFor / labelFor', () => {
  it('형식별 확장자와 라벨', () => {
    expect(extensionFor('image/jpeg')).toBe('jpg');
    expect(extensionFor('image/webp')).toBe('webp');
    expect(labelFor('image/png')).toBe('PNG');
  });
});

describe('supportsQuality', () => {
  it('PNG만 화질 설정을 쓰지 않는다', () => {
    expect(supportsQuality('image/png')).toBe(false);
    expect(supportsQuality('image/jpeg')).toBe(true);
    expect(supportsQuality('image/webp')).toBe(true);
  });
});

describe('imageOutputName', () => {
  it('확장자를 바꾼다', () => {
    const used = new Set<string>();
    expect(imageOutputName('photo.jpg', 'image/png', used)).toBe('photo.png');
  });

  it('중복 이름에 번호를 붙인다', () => {
    const used = new Set<string>();
    expect(imageOutputName('photo.jpg', 'image/jpeg', used)).toBe('photo.jpg');
    expect(imageOutputName('photo.png', 'image/jpeg', used)).toBe('photo-2.jpg');
    expect(imageOutputName('photo.webp', 'image/jpeg', used)).toBe('photo-3.jpg');
  });

  it('위험한 문자를 제거한다', () => {
    const used = new Set<string>();
    expect(imageOutputName('a/b:c.png', 'image/webp', used)).toBe('a_b_c.webp');
  });
});

describe('isSupportedImage', () => {
  it('MIME 또는 확장자로 판단한다', () => {
    expect(isSupportedImage({ name: 'a.jpg', type: 'image/jpeg' })).toBe(true);
    expect(isSupportedImage({ name: 'b.HEIC' })).toBe(false);
    expect(isSupportedImage({ name: 'c.svg', type: 'image/svg+xml' })).toBe(true);
    expect(isSupportedImage({ name: 'd.pdf', type: 'application/pdf' })).toBe(false);
  });
});
