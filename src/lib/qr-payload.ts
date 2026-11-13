export type QrPreset = 'text' | 'url' | 'wifi' | 'vcard' | 'email' | 'phone' | 'sms';

export const QR_PRESETS: Array<{ value: QrPreset; label: string }> = [
  { value: 'text', label: '텍스트' },
  { value: 'url', label: 'URL' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'vcard', label: '명함 (vCard)' },
  { value: 'email', label: '이메일' },
  { value: 'phone', label: '전화번호' },
  { value: 'sms', label: 'SMS' },
];

/** WiFi QR 규격에서 특수문자를 이스케이프한다. */
export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

export interface WifiInput {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export function wifiPayload({ ssid, password, encryption, hidden }: WifiInput): string {
  const type = encryption === 'nopass' ? 'nopass' : encryption;
  const pass = encryption === 'nopass' ? '' : `P:${escapeWifi(password)};`;
  return `WIFI:T:${type};S:${escapeWifi(ssid)};${pass}${hidden ? 'H:true;' : ''};`;
}

export interface VCardInput {
  name: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  url: string;
}

export function vcardPayload(input: VCardInput): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (input.name) lines.push(`FN:${input.name}`);
  if (input.organization) lines.push(`ORG:${input.organization}`);
  if (input.title) lines.push(`TITLE:${input.title}`);
  if (input.phone) lines.push(`TEL;TYPE=CELL:${input.phone}`);
  if (input.email) lines.push(`EMAIL:${input.email}`);
  if (input.url) lines.push(`URL:${input.url}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

export function emailPayload(to: string, subject: string, body: string): string {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const query = params.toString();
  return `mailto:${to}${query ? `?${query}` : ''}`;
}

export function phonePayload(number: string): string {
  return `tel:${number.replace(/[^\d+]/g, '')}`;
}

export function smsPayload(number: string, message: string): string {
  return `SMSTO:${number.replace(/[^\d+]/g, '')}:${message}`;
}

export function urlPayload(url: string): string {
  const trimmed = url.trim();
  if (trimmed === '') return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
