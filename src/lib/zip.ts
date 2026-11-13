/** ZIP 열기·만들기 — 경로 안전성과 파일 종류 판별을 한곳에서 다룬다. */

export const MAX_ZIP_BYTES = 100 * 1024 * 1024;
export const MAX_ZIP_UNCOMPRESSED = 500 * 1024 * 1024;
export const MAX_ZIP_ENTRIES = 2000;
export const MAX_CREATE_FILES = 1000;
export const MAX_CREATE_BYTES = 500 * 1024 * 1024;
export const MAX_PREVIEW_TEXT_BYTES = 200 * 1024;

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'csv',
  'tsv',
  'json',
  'xml',
  'html',
  'htm',
  'css',
  'js',
  'ts',
  'log',
  'yml',
  'yaml',
  'ini',
  'svg',
]);

const IMAGE_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
};

/** ZIP 안의 경로를 안전한 상대 경로로 바꾼다. `..`와 제어 문자를 제거한다. */
export function sanitizeZipPath(name: string): string {
  const parts = name
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part && part !== '.' && part !== '..')
    .map((part) =>
      Array.from(part)
        .map((char) => (char.charCodeAt(0) < 32 || /[<>:"|?*]/.test(char) ? '_' : char))
        .join(''),
    );
  return parts.join('/') || 'file';
}

/** 같은 경로가 이미 있으면 ` (1)`, ` (2)`를 붙인다. */
export function uniqueZipPath(path: string, used: Set<string>): string {
  if (!used.has(path)) {
    used.add(path);
    return path;
  }
  const dot = path.lastIndexOf('.');
  const slash = path.lastIndexOf('/');
  const hasExtension = dot > slash;
  const base = hasExtension ? path.slice(0, dot) : path;
  const extension = hasExtension ? path.slice(dot) : '';
  let index = 1;
  let candidate = `${base} (${index})${extension}`;
  while (used.has(candidate)) {
    index += 1;
    candidate = `${base} (${index})${extension}`;
  }
  used.add(candidate);
  return candidate;
}

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function zipEntryKind(name: string): 'text' | 'image' | 'other' {
  const extension = extensionOf(name);
  if (IMAGE_MIME[extension]) return 'image';
  if (TEXT_EXTENSIONS.has(extension)) return 'text';
  return 'other';
}

export function imageMimeFor(name: string): string | undefined {
  return IMAGE_MIME[extensionOf(name)];
}

export function zipExtractFileName(sourceName: string, date = new Date()): string {
  const base = sourceName.replace(/\.zip$/i, '') || 'archive';
  const safeBase = sanitizeZipPath(base).replace(/\.\./g, '_');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${safeBase}-선택-${date.getFullYear()}${month}${day}.zip`;
}

export function zipArchiveFileName(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `압축-${date.getFullYear()}${month}${day}.zip`;
}
