export interface ExifFact {
  label: string;
  value: string;
}

export function formatGps(latitude?: number, longitude?: number): string | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return `${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`;
}

export function gpsMapUrl(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
}

export function formatExposure(value?: number): string | null {
  if (!Number.isFinite(value) || !value || value <= 0) return null;
  if (value >= 1) return `${Number(value.toFixed(2))}초`;
  return `1/${Math.round(1 / value)}초`;
}

function formatDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(value);
  }
  if (typeof value === 'string' && value.trim() !== '') return value;
  return null;
}

/** exifr 결과에서 사람이 읽기 좋은 항목만 골라낸다. */
export function exifFacts(data: Record<string, unknown>): ExifFact[] {
  const facts: ExifFact[] = [];
  const add = (label: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'number') {
      facts.push({ label, value: String(value) });
    } else if (typeof value === 'string' || value instanceof Date) {
      facts.push({ label, value: String(value) });
    }
  };

  add('카메라 제조사', data.Make);
  add('카메라 모델', data.Model);
  add('렌즈', data.LensModel);
  const date = formatDate(data.DateTimeOriginal) ?? formatDate(data.CreateDate);
  if (date) facts.push({ label: '촬영 시각', value: date });
  add('소프트웨어', data.Software);
  add('작성자', data.Artist);
  add('저작권', data.Copyright);
  add('방향', data.Orientation);

  const exposure = formatExposure(data.ExposureTime as number | undefined);
  if (exposure) facts.push({ label: '노출 시간', value: exposure });
  const fNumber = data.FNumber;
  if (typeof fNumber === 'number' && Number.isFinite(fNumber)) {
    facts.push({ label: '조리개', value: `f/${fNumber}` });
  }
  const iso = data.ISO;
  if (typeof iso === 'number' && Number.isFinite(iso)) {
    facts.push({ label: 'ISO', value: String(iso) });
  }
  const focal = data.FocalLength;
  if (typeof focal === 'number' && Number.isFinite(focal)) {
    facts.push({ label: '초점 거리', value: `${focal}mm` });
  }

  const latitude = data.latitude;
  const longitude = data.longitude;
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    const gps = formatGps(latitude, longitude);
    if (gps) facts.push({ label: 'GPS 위치', value: gps });
  }
  return facts;
}

/** EXIF에 위치 정보가 있으면 지도 링크를 만든다. */
export function exifMapUrl(data: Record<string, unknown>): string | null {
  const latitude = data.latitude;
  const longitude = data.longitude;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return gpsMapUrl(latitude, longitude);
}
