import { safeFileName } from './files';

/** PDF 암호 걸기·풀기 공통 규칙. 실제 암호화는 @cantoo/pdf-lib(AES-256)가 한다. */
export const PASSWORD_MIN = 4;
export const PASSWORD_MAX = 64;

export interface PdfPermissions {
  printing: boolean;
  copying: boolean;
  modifying: boolean;
}

/** 새 암호 확인. 문제가 없으면 빈 문자열. */
export function checkNewPassword(password: string, confirm: string): string {
  if (password === '') return '암호를 입력하세요.';
  if (password.length < PASSWORD_MIN) return `암호는 ${PASSWORD_MIN}자 이상으로 정하세요.`;
  if (password.length > PASSWORD_MAX) return `암호는 ${PASSWORD_MAX}자 이하로 정하세요.`;
  if (password !== confirm) return '두 칸의 암호가 서로 다릅니다.';
  return '';
}

/** 암호 강도 안내(막지는 않는다). */
export function passwordHint(password: string): string {
  if (password.length === 0) return '';
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (password.length >= 10 && kinds >= 3) return '충분히 강한 암호입니다.';
  if (password.length >= 8 && kinds >= 2) return '보통 강도입니다. 기호를 섞으면 더 안전합니다.';
  return '짧거나 단순한 암호입니다. 8자 이상, 숫자·기호를 섞으세요.';
}

/**
 * 암호화 옵션의 권한. 사용자 암호와 같은 소유자 암호를 쓰면 권한 제한이 의미가 없으므로,
 * 제한을 걸 때는 소유자 암호를 무작위로 만든다(src/scripts/pdf-protect.ts).
 */
export function permissionOptions(permissions: PdfPermissions) {
  return {
    printing: permissions.printing ? ('highResolution' as const) : false,
    copying: permissions.copying,
    modifying: permissions.modifying,
    annotating: permissions.modifying,
    fillingForms: true,
    contentAccessibility: true,
    documentAssembly: permissions.modifying,
  };
}

export function hasRestriction(permissions: PdfPermissions): boolean {
  return !permissions.printing || !permissions.copying || !permissions.modifying;
}

function baseName(original: string): string {
  return safeFileName(original.replace(/\.[^.]+$/, '')) || 'document';
}

export function lockedFileName(original: string): string {
  return `${baseName(original)}-locked.pdf`;
}

export function unlockedFileName(original: string): string {
  return `${baseName(original)}-unlocked.pdf`;
}

/** 암호 풀기 실패 원인을 사용자 문구로 바꾼다. */
export function unlockErrorMessage(cause: unknown): string {
  const text = cause instanceof Error ? `${cause.name} ${cause.message}` : String(cause);
  if (/password incorrect|incorrect password|wrong password/i.test(text)) {
    return '암호가 맞지 않습니다. 대소문자와 띄어쓰기를 확인하세요.';
  }
  if (/EncryptedPDFError/i.test(text)) return '암호를 입력하세요.';
  if (/unsupported|not supported|algorithm/i.test(text)) {
    return '이 PDF의 암호 방식은 지원하지 않습니다.';
  }
  return 'PDF를 열 수 없습니다. 손상된 파일인지 확인하세요.';
}
