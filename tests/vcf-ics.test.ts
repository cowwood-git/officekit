import { describe, expect, it } from 'vitest';
import {
  contactsToCsv,
  decodeText,
  eventsToCsv,
  parseIcs,
  parseIcsDate,
  parseVcf,
  parseVcfIcs,
} from '../src/lib/vcf-ics';

const VCF = `BEGIN:VCARD
VERSION:4.0
FN:홍길동
N:홍;길동;;;
TEL;TYPE=CELL:010-1234-5678
TEL;TYPE=WORK:02-123-4567
EMAIL;TYPE=WORK:hong@example.com
ORG:오킷 주식회사
TITLE:개발자
ADR;TYPE=WORK:;;서울시 강남구 테헤란로 1;서울;;06234;대한민국
NOTE:첫 번째 연락처
END:VCARD
BEGIN:VCARD
VERSION:3.0
N:Doe;John;;;
TEL:010-9999-0000
END:VCARD`;

const QP_VCF = `BEGIN:VCARD
VERSION:2.1
FN;CHARSET=EUC-KR;ENCODING=QUOTED-PRINTABLE:=C8=AB=B1=E6=B5=BF
TEL:010-0000-0000
END:VCARD`;

const ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:주간 회의
DTSTART:20261112T093000Z
DTEND:20261112T103000Z
LOCATION:회의실 A
DESCRIPTION:주간 진행 상황 공유
RRULE:FREQ=WEEKLY;COUNT=4
END:VEVENT
BEGIN:VEVENT
SUMMARY:종일 일정
DTSTART;VALUE=DATE:20261113
END:VEVENT
BEGIN:VEVENT
SUMMARY:마감
DTSTART;TZID=Asia/Seoul:20261110T180000
END:VEVENT
END:VCALENDAR`;

describe('VCF·ICS 파서', () => {
  it('vCard 연락처의 이름·전화·이메일·회사를 읽는다', () => {
    const contacts = parseVcf(VCF);
    expect(contacts).toHaveLength(2);
    expect(contacts[0]).toMatchObject({
      name: '홍길동',
      phones: ['010-1234-5678', '02-123-4567'],
      emails: ['hong@example.com'],
      org: '오킷 주식회사',
      title: '개발자',
    });
    expect(contacts[0]?.address).toContain('서울시 강남구');
    expect(contacts[1]?.name).toBe('John Doe');
  });

  it('EUC-KR quoted-printable 이름을 읽는다', () => {
    const contacts = parseVcf(QP_VCF);
    expect(contacts[0]?.name).toBe('홍길동');
  });

  it('UTF-8이 아닌 바이트는 EUC-KR로 읽는다', () => {
    const bytes = new Uint8Array([
      0xc8, 0xab, 0xb1, 0xe6, 0xb5, 0xbf, 0x20, 0xed, 0x85, 0x8c, 0xec, 0x8a, 0xa4, 0xed, 0x8a,
      0xb8,
    ]);
    expect(decodeText(bytes)).toContain('홍길동');
  });

  it('iCalendar 일정을 시간순으로 정렬한다', () => {
    const events = parseIcs(ICS);
    expect(events).toHaveLength(3);
    expect(events[0]?.summary).toBe('마감');
    expect(events[1]?.summary).toBe('주간 회의');
    expect(events[2]?.summary).toBe('종일 일정');
    expect(events[1]?.location).toBe('회의실 A');
    expect(events[1]?.rrule).toContain('FREQ=WEEKLY');
    expect(events[2]?.start?.allDay).toBe(true);
  });

  it('날짜 형식을 해석한다', () => {
    expect(parseIcsDate('20261112')?.allDay).toBe(true);
    expect(parseIcsDate('20261112T093000Z')?.sort).toBeGreaterThan(0);
    expect(parseIcsDate('아무거나')).toBeUndefined();
  });

  it('VCF·ICS를 구분하고 CSV로 내보낸다', () => {
    const vcf = parseVcfIcs(VCF);
    expect(vcf.kind).toBe('vcf');
    expect(contactsToCsv(vcf.contacts)).toContain('"홍길동"');
    const ics = parseVcfIcs(ICS);
    expect(ics.kind).toBe('ics');
    expect(eventsToCsv(ics.events)).toContain('"주간 회의"');
    const unknown = parseVcfIcs('hello');
    expect(unknown.kind).toBe('unknown');
    expect(unknown.warnings).toHaveLength(1);
  });

  it('CSV 따옴표를 이스케이프한다', () => {
    const csv = contactsToCsv([
      { name: '이름 "따옴표"', phones: [], emails: [], note: '줄1\n줄2' },
    ]);
    expect(csv).toContain('"이름 ""따옴표"""');
    expect(csv).toContain('"줄1\n줄2"');
  });
});
