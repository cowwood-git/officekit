export const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGES = 30;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface FileLike {
  name: string;
  size: number;
  type?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validatePdfSelection(files: FileLike[]): ValidationResult {
  const errors: string[] = [];
  if (files.length === 0) {
    errors.push('PDF 파일을 한 개 이상 선택하세요.');
  }

  const notPdf = files.filter(
    (file) => !file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf',
  );
  if (notPdf.length > 0) {
    errors.push(`PDF가 아닌 파일이 있습니다: ${notPdf.map((file) => file.name).join(', ')}`);
  }

  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_TOTAL_BYTES) {
    errors.push(
      `전체 용량이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 파일을 나눠서 합쳐 주세요.`,
    );
  }

  return { ok: errors.length === 0, errors };
}

/** 원본 배열을 바꾸지 않고 항목을 이동한다. 범위를 벗어나면 복사본을 그대로 반환. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) {
    return next;
  }
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return next;
  next.splice(to, 0, moved);
  return next;
}

export function moveBy<T>(items: readonly T[], index: number, delta: number): T[] {
  return moveItem(items, index, index + delta);
}

export interface Size {
  width: number;
  height: number;
}

/** 비율을 유지하면서 maxDimension 안으로 줄인다. 원본보다 키우지 않는다. */
export function fitWithin(size: Size, maxDimension: number): Size {
  if (maxDimension <= 0) return { ...size };
  const longest = Math.max(size.width, size.height);
  if (longest <= maxDimension) return { ...size };
  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}

export function replaceExtension(name: string, extension: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return `${base}${ext}`;
}

export function savingsPercent(originalBytes: number, compressedBytes: number): number {
  if (originalBytes <= 0) return 0;
  const saved = ((originalBytes - compressedBytes) / originalBytes) * 100;
  return Math.round(saved);
}

export function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120) || 'file';
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageSelection(files: FileLike[]): ValidationResult {
  const errors: string[] = [];
  if (files.length === 0) {
    errors.push('이미지를 한 장 이상 선택하세요.');
  }
  if (files.length > MAX_IMAGES) {
    errors.push(`한 번에 최대 ${MAX_IMAGES}장까지 추가할 수 있습니다.`);
  }

  const unsupported = files.filter(
    (file) => !IMAGE_TYPES.includes(file.type ?? '') && !/\.(jpe?g|png|webp)$/i.test(file.name),
  );
  if (unsupported.length > 0) {
    errors.push(
      `지원하지 않는 형식입니다: ${unsupported.map((file) => file.name).join(', ')} (JPG·PNG·WebP만 가능)`,
    );
  }

  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_TOTAL_BYTES) {
    errors.push(`전체 용량이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 나눠서 변환해 주세요.`);
  }

  return { ok: errors.length === 0, errors };
}
