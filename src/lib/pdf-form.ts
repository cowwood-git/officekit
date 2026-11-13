export type FormFieldType =
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'optionlist'
  | 'unsupported';

export interface FormFieldInfo {
  name: string;
  type: FormFieldType;
  value: string;
  options: string[];
  multiline: boolean;
  readOnly: boolean;
}

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: '텍스트',
  checkbox: '체크박스',
  radio: '라디오',
  dropdown: '드롭다운',
  optionlist: '목록',
  unsupported: '지원 안 함',
};

export function fieldTypeLabel(type: FormFieldType): string {
  return FIELD_TYPE_LABELS[type] ?? type;
}

/** WinAnsi로 표현할 수 없는 문자(한글 등)가 있는지 확인한다. */
function hasUnicode(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code > 0x00ff) return true;
  }
  return false;
}

export function needsUnicodeFont(values: Array<string | string[]>): boolean {
  return values.some((value) =>
    Array.isArray(value) ? value.some((item) => hasUnicode(item)) : hasUnicode(value),
  );
}

export function isBlankFormValue(value: string | string[] | boolean): boolean {
  if (typeof value === 'boolean') return !value;
  if (Array.isArray(value)) return value.length === 0 || value.every((item) => item.trim() === '');
  return value.trim() === '';
}

export function formFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'document'}-filled.pdf`;
}

export function normalizeFieldValue(value: string): string {
  return value.replace(/\r\n/g, '\n');
}
