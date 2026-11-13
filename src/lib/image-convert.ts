import { safeFileName } from './files';

export type OutputMime = 'image/jpeg' | 'image/png' | 'image/webp';

export const OUTPUT_FORMATS: Array<{ mime: OutputMime; label: string; extension: string }> = [
  { mime: 'image/jpeg', label: 'JPG', extension: 'jpg' },
  { mime: 'image/png', label: 'PNG', extension: 'png' },
  { mime: 'image/webp', label: 'WebP', extension: 'webp' },
];

export function extensionFor(mime: OutputMime): string {
  return OUTPUT_FORMATS.find((format) => format.mime === mime)?.extension ?? 'jpg';
}

export function labelFor(mime: OutputMime): string {
  return OUTPUT_FORMATS.find((format) => format.mime === mime)?.label ?? 'JPG';
}

export function supportsQuality(mime: OutputMime): boolean {
  return mime !== 'image/png';
}

/** 중복되지 않는 출력 파일명을 만든다. */
export function imageOutputName(originalName: string, mime: OutputMime, used: Set<string>): string {
  const base = safeFileName(originalName.replace(/\.[^.]+$/, '')) || 'image';
  const extension = extensionFor(mime);
  let candidate = `${base}.${extension}`;
  let counter = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base}-${counter}.${extension}`;
    counter += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

const ACCEPTED = /\.(jpe?g|png|webp|gif|bmp|svg|avif)$/i;

export function isSupportedImage(file: { name: string; type?: string }): boolean {
  return file.type?.startsWith('image/') === true || ACCEPTED.test(file.name);
}
