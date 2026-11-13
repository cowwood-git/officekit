/** 파일 해시 — 파일 내용을 브라우저 안에서만 읽어 지문을 만든다. */

export const MAX_HASH_BYTES = 100 * 1024 * 1024;

export const HASH_ALGORITHMS = [
  { id: 'SHA-256', label: 'SHA-256 (권장)', note: '가장 널리 쓰는 무결성 확인용' },
  { id: 'SHA-512', label: 'SHA-512', note: '더 긴 지문이 필요할 때' },
  { id: 'SHA-384', label: 'SHA-384', note: 'SHA-512 계열의 중간 길이' },
  { id: 'SHA-1', label: 'SHA-1 (호환용)', note: '오래된 배포 파일의 값 확인용' },
] as const;

export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number]['id'];

export function isHashAlgorithm(value: string): value is HashAlgorithm {
  return HASH_ALGORITHMS.some((algorithm) => algorithm.id === value);
}

export function algorithmNote(algorithm: HashAlgorithm): string {
  return HASH_ALGORITHMS.find((item) => item.id === algorithm)?.note ?? '';
}

/** SHA-1·SHA-256·SHA-384·SHA-512 를 소문자 16진수 문자열로 돌려준다. */
export async function hashHex(
  data: BufferSource,
  algorithm: HashAlgorithm = 'SHA-256',
): Promise<string> {
  const digest = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** 공백·콜론·대소문자 차이를 무시하고 비교한다. */
export function normalizeHash(value: string): string {
  return value.trim().toLowerCase().replace(/[\s:]/g, '');
}

export function hashesMatch(expected: string, actual: string): boolean {
  const left = normalizeHash(expected);
  return left !== '' && left === normalizeHash(actual);
}
