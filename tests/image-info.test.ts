import { describe, expect, it } from 'vitest';
import { exifFacts, exifMapUrl, formatExposure, formatGps, gpsMapUrl } from '../src/lib/image-info';

describe('formatGps', () => {
  it('소수 6자리로 표시한다', () => {
    expect(formatGps(37.5665, 126.978)).toBe('37.566500, 126.978000');
  });

  it('값이 없으면 null', () => {
    expect(formatGps(undefined, 126)).toBeNull();
  });
});

describe('formatExposure', () => {
  it('1초 이상과 이하를 구분한다', () => {
    expect(formatExposure(0.008)).toBe('1/125초');
    expect(formatExposure(2.5)).toBe('2.5초');
    expect(formatExposure(0)).toBeNull();
  });
});

describe('exifFacts', () => {
  it('주요 EXIF 항목을 한국어 라벨로 만든다', () => {
    const facts = exifFacts({
      Make: 'OfficeKit',
      Model: 'TestCam',
      FNumber: 2.8,
      ISO: 200,
      FocalLength: 35,
      ExposureTime: 0.01,
      latitude: 37.5,
      longitude: 127,
    });
    expect(facts).toContainEqual({ label: '카메라 제조사', value: 'OfficeKit' });
    expect(facts).toContainEqual({ label: '조리개', value: 'f/2.8' });
    expect(facts).toContainEqual({ label: 'ISO', value: '200' });
    expect(facts).toContainEqual({ label: '초점 거리', value: '35mm' });
    expect(facts).toContainEqual({ label: 'GPS 위치', value: '37.500000, 127.000000' });
  });

  it('빈 값은 제외한다', () => {
    expect(exifFacts({ Make: '', Model: undefined })).toEqual([]);
  });
});

describe('map urls', () => {
  it('OpenStreetMap 링크를 만든다', () => {
    expect(gpsMapUrl(37.5, 127)).toContain('mlat=37.5');
    expect(exifMapUrl({ latitude: 37.5, longitude: 127 })).toContain('openstreetmap.org');
    expect(exifMapUrl({})).toBeNull();
  });
});
