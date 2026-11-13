/** 이미지 ↔ Base64 변환 도우미. */
export const BASE64_MAX_BYTES = 10 * 1024 * 1024;

const SIGNATURES: [string, number[]][] = [
  ['image/png', [0x89, 0x50, 0x4e, 0x47]],
  ['image/jpeg', [0xff, 0xd8, 0xff]],
  ['image/gif', [0x47, 0x49, 0x46, 0x38]],
  ['image/webp', [0x52, 0x49, 0x46, 0x46]],
  ['image/bmp', [0x42, 0x4d]],
  ['image/x-icon', [0x00, 0x00, 0x01, 0x00]],
];

export function sniffImageMime(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 5))
      .trimStart()
      .startsWith('<')
  ) {
    const head = new TextDecoder().decode(bytes.subarray(0, 256));
    if (/<svg[\s>]/i.test(head) || /<\?xml/i.test(head)) return 'image/svg+xml';
  }
  for (const [mime, signature] of SIGNATURES) {
    if (signature.every((value, index) => bytes[index] === value)) {
      if (mime === 'image/webp' && String.fromCharCode(...bytes.subarray(8, 12)) !== 'WEBP')
        continue;
      return mime;
    }
  }
  return null;
}

export interface ParsedBase64 {
  mime: string | null;
  base64: string;
}

/** data URI 또는 순수 Base64 를 받아 정리한다. 형식이 아니면 null. */
export function parseBase64Input(text: string): ParsedBase64 | null {
  const trimmed = text
    .trim()
    .replace(/^url\(/i, '')
    .replace(/^["'`(]+|["'`);]+$/g, '');
  const match = /^data:([^;,]+)?(?:;[^,]*)?;base64,(.*)$/is.exec(trimmed);
  const mime = match ? (match[1] ?? null) : null;
  const body = (match ? (match[2] as string) : trimmed)
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  if (body === '' || !/^[A-Za-z0-9+/]+={0,2}$/.test(body)) return null;
  const padded = body + '='.repeat((4 - (body.length % 4)) % 4);
  return { mime, base64: padded };
}

export function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export function dataUri(mime: string, base64: string): string {
  return `data:${mime};base64,${base64}`;
}

export interface Snippets {
  dataUri: string;
  html: string;
  css: string;
  markdown: string;
}

export function snippetsFor(uri: string, alt = '이미지'): Snippets {
  return {
    dataUri: uri,
    html: `<img src="${uri}" alt="${alt.replace(/"/g, '&quot;')}">`,
    css: `background-image: url("${uri}");`,
    markdown: `![${alt.replace(/[[\]]/g, '')}](${uri})`,
  };
}

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
  'image/svg+xml': 'svg',
};

export function extensionFor(mime: string): string {
  return EXTENSIONS[mime] ?? 'bin';
}
