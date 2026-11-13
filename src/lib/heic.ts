import { type FileLike, formatBytes, safeFileName, type ValidationResult } from './files';

export const MAX_HEIC_FILES = 20;
export const MAX_HEIC_TOTAL_BYTES = 50 * 1024 * 1024;
export const MAX_HEIC_FILE_BYTES = 30 * 1024 * 1024;

export function isHeic(file: FileLike): boolean {
  const type = (file.type ?? '').toLowerCase();
  return type === 'image/heic' || type === 'image/heif' || /\.(heic|heif)$/i.test(file.name);
}

export function validateHeicSelection(files: FileLike[]): ValidationResult {
  const errors: string[] = [];
  if (files.length === 0) {
    errors.push('HEIC 파일을 한 개 이상 선택하세요.');
  }
  if (files.length > MAX_HEIC_FILES) {
    errors.push(`한 번에 최대 ${MAX_HEIC_FILES}장까지 변환할 수 있습니다.`);
  }

  const notHeic = files.filter((file) => !isHeic(file));
  if (notHeic.length > 0) {
    errors.push(`HEIC/HEIF가 아닌 파일이 있습니다: ${notHeic.map((file) => file.name).join(', ')}`);
  }

  const tooLarge = files.filter((file) => file.size > MAX_HEIC_FILE_BYTES);
  if (tooLarge.length > 0) {
    errors.push(
      `파일 한 개가 ${formatBytes(MAX_HEIC_FILE_BYTES)}를 넘습니다: ${tooLarge
        .map((file) => file.name)
        .join(', ')}`,
    );
  }

  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_HEIC_TOTAL_BYTES) {
    errors.push(
      `전체 용량이 ${formatBytes(MAX_HEIC_TOTAL_BYTES)}를 넘습니다. 나눠서 변환해 주세요.`,
    );
  }

  return { ok: errors.length === 0, errors };
}

/** 중복되지 않는 .jpg 파일명을 만든다. */
export function jpegNameFor(originalName: string, used: Set<string>): string {
  const base = safeFileName(originalName.replace(/\.(heic|heif)$/i, '')) || 'image';
  let candidate = `${base}.jpg`;
  let counter = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base}-${counter}.jpg`;
    counter += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}
