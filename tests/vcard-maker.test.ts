import { describe, expect, it } from 'vitest';
import {
  parseVcf,
  serializeVCard,
  serializeVCardFile,
  type VCardInput,
  vCardFileName,
} from '../src/lib/vcf-ics';

const contact: VCardInput = {
  name: '홍길동',
  org: '옷깃',
  title: '대표',
  phone: '010-1234-5678',
  email: 'hello@example.com',
  address: '서울시 강남구 테헤란로 1',
  note: '오전 연락',
};

describe('vCard 만들기', () => {
  it('연락처를 vCard 3.0으로 만들고 다시 읽는다', () => {
    const parsed = parseVcf(serializeVCard(contact));
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      name: '홍길동',
      org: '옷깃',
      title: '대표',
      phones: ['010-1234-5678'],
      emails: ['hello@example.com'],
      address: '서울시 강남구 테헤란로 1',
      note: '오전 연락',
    });
  });

  it('여러 연락처를 한 파일로 만든다', () => {
    const file = serializeVCardFile([contact, { name: '김옷깃', phone: '02-000-0000' }]);
    const parsed = parseVcf(file);
    expect(parsed.map((item) => item.name)).toEqual(['홍길동', '김옷깃']);
  });

  it('긴 값을 접어도 다시 읽힌다', () => {
    const long = {
      ...contact,
      note: '아주 긴 메모 '.repeat(20),
    };
    const parsed = parseVcf(serializeVCard(long));
    expect(parsed[0]?.note).toContain('아주 긴 메모');
    expect(parsed[0]?.note?.length).toBe(long.note.trim().length);
  });

  it('이름이 없으면 기본 이름을 쓴다', () => {
    const parsed = parseVcf(serializeVCard({ name: '   ' }));
    expect(parsed[0]?.name).toBe('연락처');
  });

  it('빈 목록은 오류를 낸다', () => {
    expect(() => serializeVCardFile([])).toThrow('연락처를 하나 이상');
  });

  it('파일 이름을 만든다', () => {
    expect(vCardFileName(new Date(2026, 10, 13))).toBe('연락처-20261113.vcf');
  });
});
