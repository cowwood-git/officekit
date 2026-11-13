export type TextOperation =
  | 'upper'
  | 'lower'
  | 'title'
  | 'camel'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'base64-encode'
  | 'base64-decode'
  | 'url-encode'
  | 'url-decode'
  | 'html-encode'
  | 'html-decode';

export const TEXT_OPERATIONS: Array<{ value: TextOperation; label: string; group: string }> = [
  { value: 'upper', label: '대문자', group: '대소문자' },
  { value: 'lower', label: '소문자', group: '대소문자' },
  { value: 'title', label: 'Title Case', group: '대소문자' },
  { value: 'camel', label: 'camelCase', group: '대소문자' },
  { value: 'snake', label: 'snake_case', group: '대소문자' },
  { value: 'kebab', label: 'kebab-case', group: '대소문자' },
  { value: 'constant', label: 'CONSTANT_CASE', group: '대소문자' },
  { value: 'base64-encode', label: 'Base64 인코딩', group: '인코딩' },
  { value: 'base64-decode', label: 'Base64 디코딩', group: '인코딩' },
  { value: 'url-encode', label: 'URL 인코딩', group: '인코딩' },
  { value: 'url-decode', label: 'URL 디코딩', group: '인코딩' },
  { value: 'html-encode', label: 'HTML 엔티티 인코딩', group: '인코딩' },
  { value: 'html-decode', label: 'HTML 엔티티 디코딩', group: '인코딩' },
];

function words(text: string): string[] {
  return text
    .trim()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function titleCase(text: string): string {
  return text.replace(/(^|[\s([{"“”‘’])(\p{L})/gu, (_match, prefix: string, char: string) => {
    return `${prefix}${char.toUpperCase()}`;
  });
}

export function camelCase(text: string): string {
  const list = words(text);
  if (list.length === 0) return '';
  return list.map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word))).join('');
}

export function snakeCase(text: string): string {
  return words(text)
    .map((word) => word.toLowerCase())
    .join('_');
}

export function kebabCase(text: string): string {
  return words(text)
    .map((word) => word.toLowerCase())
    .join('-');
}

export function constantCase(text: string): string {
  return words(text)
    .map((word) => word.toUpperCase())
    .join('_');
}

const BASE64_CHUNK = 0x8000;

function bytesToBinary(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK) {
    const chunk = bytes.subarray(offset, offset + BASE64_CHUNK);
    binary += String.fromCharCode(...chunk);
  }
  return binary;
}

/** 유니코드 문자열을 UTF-8 Base64로 인코딩한다. */
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return btoa(bytesToBinary(bytes));
}

/** Base64를 UTF-8 문자열로 디코딩한다. 잘못된 입력은 예외를 던진다. */
export function decodeBase64(value: string): string {
  const normalized = value.replace(/\s+/g, '');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

const HTML_NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
};

const HTML_ENCODE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function encodeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ENCODE[char] ?? char);
}

export function decodeHtml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = Number.parseInt(body.slice(2), 16);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    if (body.startsWith('#')) {
      const code = Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    return HTML_NAMED[body.toLowerCase()] ?? match;
  });
}

/** 선택한 변환을 적용한다. 디코딩 실패는 예외로 던진다. */
export function transformText(operation: TextOperation, text: string): string {
  switch (operation) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return titleCase(text);
    case 'camel':
      return camelCase(text);
    case 'snake':
      return snakeCase(text);
    case 'kebab':
      return kebabCase(text);
    case 'constant':
      return constantCase(text);
    case 'base64-encode':
      return encodeBase64(text);
    case 'base64-decode':
      return decodeBase64(text);
    case 'url-encode':
      return encodeURIComponent(text);
    case 'url-decode':
      return decodeURIComponent(text);
    case 'html-encode':
      return encodeHtml(text);
    case 'html-decode':
      return decodeHtml(text);
    default:
      return text;
  }
}
