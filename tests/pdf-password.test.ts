import { PDFDocument } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  checkNewPassword,
  hasRestriction,
  isEncryptedPdfError,
  lockedFileName,
  passwordHint,
  permissionOptions,
  unlockErrorMessage,
  unlockedFileName,
} from '../src/lib/pdf-password';

describe('pdf-password', () => {
  it('새 암호를 확인한다', () => {
    expect(checkNewPassword('', '')).toBe('암호를 입력하세요.');
    expect(checkNewPassword('abc', 'abc')).toContain('4자 이상');
    expect(checkNewPassword('abcd', 'abce')).toContain('서로 다릅니다');
    expect(checkNewPassword('a'.repeat(65), 'a'.repeat(65))).toContain('64자 이하');
    expect(checkNewPassword('abcd1234', 'abcd1234')).toBe('');
  });

  it('강도 안내', () => {
    expect(passwordHint('')).toBe('');
    expect(passwordHint('1234')).toContain('단순');
    expect(passwordHint('abcd1234')).toContain('보통');
    expect(passwordHint('Abcd1234!x')).toContain('강한');
  });

  it('권한 옵션과 제한 여부', () => {
    const all = { printing: true, copying: true, modifying: true };
    expect(hasRestriction(all)).toBe(false);
    expect(hasRestriction({ ...all, copying: false })).toBe(true);
    expect(permissionOptions({ ...all, printing: false }).printing).toBe(false);
    expect(permissionOptions(all).printing).toBe('highResolution');
  });

  it('파일 이름', () => {
    expect(lockedFileName('계약서.pdf')).toBe('계약서-locked.pdf');
    expect(unlockedFileName('a/b.pdf')).toBe('a_b-unlocked.pdf');
  });

  it('오류 문구', () => {
    expect(unlockErrorMessage(new Error('Password incorrect'))).toContain('맞지 않습니다');
    const encrypted = new Error('x');
    encrypted.name = 'EncryptedPDFError';
    expect(unlockErrorMessage(encrypted)).toBe('암호를 입력하세요.');
    expect(unlockErrorMessage(new Error('boom'))).toContain('열 수 없습니다');
  });

  it('암호를 걸고, 맞는 암호로 풀어 새 PDF로 옮기면 암호가 사라진다', async () => {
    const source = await PDFDocument.create();
    source.addPage([200, 200]);
    source.addPage([300, 300]);
    source.encrypt({ userPassword: 'open1234', ownerPassword: 'owner-x' });
    const locked = await source.save();
    await expect(PDFDocument.load(locked)).rejects.toThrow();
    await expect(PDFDocument.load(locked, { password: 'wrong' })).rejects.toThrow();

    const opened = await PDFDocument.load(locked, { password: 'open1234' });
    const output = await PDFDocument.create();
    const pages = await output.copyPages(opened, opened.getPageIndices());
    for (const page of pages) output.addPage(page);
    const bytes = await output.save();
    const text = new TextDecoder('latin1').decode(bytes);
    expect(text.includes('/Encrypt')).toBe(false);
    const reopened = await PDFDocument.load(bytes);
    expect(reopened.getPageCount()).toBe(2);
  });
});

describe('암호 PDF 오류 판별', () => {
  it('@cantoo/pdf-lib가 던지는 실제 오류 모양을 알아본다', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.encrypt({ userPassword: 'pw1', ownerPassword: 'pw1' });
    const locked = await source.save();

    const opened = await PDFDocument.load(locked).catch((cause: unknown) => cause);
    expect(isEncryptedPdfError(opened)).toBe(true);
    expect(unlockErrorMessage(opened)).toBe('암호를 입력하세요.');

    const wrong = await PDFDocument.load(locked, { password: 'nope' }).catch(
      (cause: unknown) => cause,
    );
    expect(isEncryptedPdfError(wrong)).toBe(false);
    expect(unlockErrorMessage(wrong)).toContain('암호가 맞지 않습니다');
  });

  it('메시지만 남은 배포 빌드 오류도 알아본다', () => {
    const minified = new Error('Input document to `PDFDocument.load` is encrypted.');
    expect(isEncryptedPdfError(minified)).toBe(true);
    expect(isEncryptedPdfError(new Error('Invalid PDF header'))).toBe(false);
  });
});
