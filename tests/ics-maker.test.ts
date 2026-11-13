import { describe, expect, it } from 'vitest';
import {
  type IcsEventInput,
  icsFileName,
  parseIcs,
  serializeIcsEvent,
  serializeIcsFile,
} from '../src/lib/vcf-ics';

const event: IcsEventInput = {
  summary: '프로젝트 회의',
  start: '2026-11-13',
  end: '2026-11-13',
  startTime: '10:00',
  endTime: '11:00',
  allDay: false,
  location: '회의실 A',
  description: '일정 설명입니다.\n두 번째 줄',
  url: 'https://example.com/meeting',
  reminderMinutes: 15,
};

const options = { uid: 'test-event@otgit', stamp: new Date(Date.UTC(2026, 10, 13, 1, 0, 0)) };

describe('ICS 만들기', () => {
  it('시간 일정을 만들고 다시 읽는다', () => {
    const text = serializeIcsEvent(event, options);
    expect(text).toContain('DTSTART:20261113T100000');
    expect(text).toContain('DTEND:20261113T110000');
    expect(text).toContain('TRIGGER:-PT15M');
    const parsed = parseIcs(text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      summary: '프로젝트 회의',
      location: '회의실 A',
      description: '일정 설명입니다.\n두 번째 줄',
    });
    expect(parsed[0]?.start?.allDay).toBe(false);
  });

  it('종일 일정의 종료일은 다음 날로 저장한다', () => {
    const text = serializeIcsEvent({ ...event, allDay: true, end: '2026-11-13' }, options);
    expect(text).toContain('DTSTART;VALUE=DATE:20261113');
    expect(text).toContain('DTEND;VALUE=DATE:20261114');
    const parsed = parseIcs(text);
    expect(parsed[0]?.start?.allDay).toBe(true);
  });

  it('여러 일정을 하나의 캘린더로 만든다', () => {
    const file = serializeIcsFile([event, { ...event, summary: '두 번째 일정' }]);
    const parsed = parseIcs(file);
    expect(parsed.map((item) => item.summary)).toEqual(['프로젝트 회의', '두 번째 일정']);
  });

  it('쉼표·줄바꿈을 이스케이프한다', () => {
    const text = serializeIcsEvent(
      { ...event, summary: '회의, 점심', description: '첫 줄\n둘째 줄' },
      options,
    );
    expect(text).toContain('SUMMARY:회의\\, 점심');
    expect(text).toContain('DESCRIPTION:첫 줄\\n둘째 줄');
  });

  it('종료가 시작보다 빠르면 오류를 낸다', () => {
    expect(() =>
      serializeIcsEvent({ ...event, startTime: '12:00', endTime: '11:00' }, options),
    ).toThrow('종료 시간');
  });

  it('파일 이름을 만든다', () => {
    expect(icsFileName(new Date(2026, 10, 13))).toBe('일정-20261113.ics');
  });
});
