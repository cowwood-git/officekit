import { describe, expect, it } from 'vitest';
import {
  buildSql,
  escapeSqlValue,
  inferColumnType,
  quoteIdentifier,
  type SqlOptions,
  sanitizeColumnName,
  sanitizeTableName,
  sqlFileName,
} from '../src/lib/csv-sql';

const rows = [
  ['이름', '나이', '가입일', 'VIP'],
  ['김오피스', '30', '2026-01-02', 'true'],
  ['이데이터', '25', '2026-02-03', 'false'],
];

const options: SqlOptions = {
  table: 'members',
  dialect: 'postgres',
  nullEmpty: true,
  batchSize: 100,
};

describe('inferColumnType', () => {
  it('정수·실수·날짜·불리언·문자를 구분한다', () => {
    expect(inferColumnType(['1', '2'])).toBe('INTEGER');
    expect(inferColumnType(['1.5', '2'])).toBe('REAL');
    expect(inferColumnType(['2026-01-01'])).toBe('DATE');
    expect(inferColumnType(['true', '0'])).toBe('BOOLEAN');
    expect(inferColumnType(['가', '나'])).toBe('TEXT');
    expect(inferColumnType([])).toBe('TEXT');
  });
});

describe('sanitize names', () => {
  it('공백·특수문자를 밑줄로 바꾼다', () => {
    expect(sanitizeTableName('  회원 목록! ')).toBe('회원_목록');
    expect(sanitizeTableName('')).toBe('table_name');
    expect(sanitizeColumnName('', 2)).toBe('column_3');
  });
});

describe('quoteIdentifier', () => {
  it('방언별로 인용한다', () => {
    expect(quoteIdentifier('members', 'mysql')).toBe('`members`');
    expect(quoteIdentifier('members', 'postgres')).toBe('"members"');
    expect(quoteIdentifier('we"ird', 'sqlite')).toBe('"we""ird"');
  });
});

describe('escapeSqlValue', () => {
  it('NULL·숫자·문자열을 처리한다', () => {
    expect(escapeSqlValue('', options)).toBe('NULL');
    expect(escapeSqlValue('42', options)).toBe('42');
    expect(escapeSqlValue("O'Reilly", options)).toBe("'O''Reilly'");
  });

  it('빈 문자열을 빈 값으로 둘 수 있다', () => {
    expect(escapeSqlValue('', { ...options, nullEmpty: false })).toBe("''");
  });
});

describe('buildSql', () => {
  it('CREATE TABLE과 INSERT를 만든다', () => {
    const sql = buildSql(rows, options);
    expect(sql.create).toContain('CREATE TABLE "members"');
    expect(sql.create).toContain('"나이" INTEGER');
    expect(sql.create).toContain('"가입일" DATE');
    expect(sql.inserts).toContain('INSERT INTO "members"');
    expect(sql.inserts).toContain("'김오피스', 30, '2026-01-02', TRUE");
    expect(sql.full).toContain('CREATE TABLE');
  });

  it('배치 크기로 INSERT를 나눈다', () => {
    const sql = buildSql(rows, { ...options, batchSize: 1 });
    expect(sql.inserts.match(/INSERT INTO/g)).toHaveLength(2);
  });
});

describe('sqlFileName', () => {
  it('SQL 파일명을 만든다', () => {
    expect(sqlFileName('회원.csv')).toBe('회원.sql');
  });
});
