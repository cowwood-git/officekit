import { describe, expect, it } from 'vitest';
import {
  emailPayload,
  escapeWifi,
  phonePayload,
  smsPayload,
  urlPayload,
  vcardPayload,
  wifiPayload,
} from '../src/lib/qr-payload';

describe('wifiPayload', () => {
  it('WPA WiFi 문자열을 만든다', () => {
    expect(
      wifiPayload({ ssid: 'OfficeKit', password: 'pass123', encryption: 'WPA', hidden: false }),
    ).toBe('WIFI:T:WPA;S:OfficeKit;P:pass123;;');
  });

  it('숨김·특수문자를 이스케이프한다', () => {
    expect(escapeWifi('a;b,c:d"e\\f')).toBe('a\\;b\\,c\\:d\\"e\\\\f');
    expect(wifiPayload({ ssid: 'a;b', password: '', encryption: 'nopass', hidden: true })).toBe(
      'WIFI:T:nopass;S:a\\;b;H:true;;',
    );
  });
});

describe('vcardPayload', () => {
  it('명함 정보를 vCard로 만든다', () => {
    const card = vcardPayload({
      name: '김오피스',
      organization: '오피스킷',
      title: '개발',
      phone: '010-1234-5678',
      email: 'hello@officekit.kr',
      url: 'https://officekit.kr',
    });
    expect(card).toContain('BEGIN:VCARD');
    expect(card).toContain('FN:김오피스');
    expect(card).toContain('TEL;TYPE=CELL:010-1234-5678');
    expect(card).toContain('EMAIL:hello@officekit.kr');
    expect(card.endsWith('END:VCARD')).toBe(true);
  });
});

describe('other payloads', () => {
  it('이메일·전화·SMS', () => {
    expect(emailPayload('a@b.com', '문의', '안녕')).toBe(
      'mailto:a@b.com?subject=%EB%AC%B8%EC%9D%98&body=%EC%95%88%EB%85%95',
    );
    expect(phonePayload('010-1234-5678')).toBe('tel:01012345678');
    expect(smsPayload('010-1234-5678', '안녕')).toBe('SMSTO:01012345678:안녕');
  });

  it('URL에 https를 붙인다', () => {
    expect(urlPayload('officekit.kr')).toBe('https://officekit.kr');
    expect(urlPayload('https://officekit.kr')).toBe('https://officekit.kr');
    expect(urlPayload('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(urlPayload('')).toBe('');
  });
});
