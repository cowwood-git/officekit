import { describe, expect, it } from 'vitest';
import {
  addedLines,
  BLOCKED_CONTENT,
  messageLines,
  parseLocalList,
  scanFiles,
  scanLines,
} from '../scripts/check-commit.mjs';

// 테스트 문자열이 이 파일 자체를 막지 않도록 조각을 이어 붙여 만든다.
const join = (...parts: string[]) => parts.join('');
const line = (text: string) => [{ file: 'a.ts', line: 1, text }];

describe('check-commit', () => {
  it('비밀 파일 이름을 막고 예시 파일은 통과시킨다', () => {
    const files = ['.env', '.env.local', 'a/server.key', 'x.pem', 'data.db', 'b.bak', '.dev.vars'];
    expect(scanFiles(files)).toHaveLength(files.length);
    expect(scanFiles(['.env.example', 'src/keyboard.ts', 'README.md'])).toHaveLength(0);
  });

  it('토큰·개인키·개인 메일·내부 IP 를 잡는다', () => {
    const bad = [
      join('-----BEGIN ', 'PRIVATE KEY-----'),
      join('gh', 'p_', 'a'.repeat(36)),
      join('AKIA', 'ABCDEFGHIJKLMNOP'),
      join('const apiKey = "', 'x'.repeat(24), '"'),
      join('mail: someone', '@', 'gmail.com'),
      join('host 192.', '168.0.10'),
    ];
    for (const text of bad) expect(scanLines(line(text), BLOCKED_CONTENT), text).toHaveLength(1);
  });

  it('평범한 코드와 짧은 테스트 비밀번호는 통과시킨다', () => {
    const ok = [
      'const password = "pass123";',
      'contact: help@example.com',
      'version 1.2.3.4',
      'author 1+bot@users.noreply.github.com',
    ];
    for (const text of ok) expect(scanLines(line(text), BLOCKED_CONTENT), text).toHaveLength(0);
  });

  it('허용 표시가 있는 줄은 건너뛴다', () => {
    const text = join('someone', '@', 'gmail.com // check-commit', ':allow');
    expect(scanLines(line(text), BLOCKED_CONTENT)).toHaveLength(0);
  });

  it('로컬 목록: 주석 무시, 잘못된 정규식은 글자 그대로', () => {
    const rules = parseLocalList('# 주석\n\ninternal-host\n(broken\n');
    expect(rules).toHaveLength(2);
    expect(scanLines(line('ssh Internal-Host'), rules)).toHaveLength(1);
    expect(scanLines(line('x (broken y'), rules)).toHaveLength(1);
  });

  it('diff 에서 추가된 줄과 줄 번호만 뽑는다', () => {
    const diff = [
      'diff --git a/x.ts b/x.ts',
      '--- a/x.ts',
      '+++ b/x.ts',
      '@@ -3,0 +4,2 @@',
      '+one',
      '+two',
      '-gone',
    ].join('\n');
    expect(addedLines(diff)).toEqual([
      { file: 'x.ts', line: 4, text: 'one' },
      { file: 'x.ts', line: 5, text: 'two' },
    ]);
  });

  it('커밋 메시지의 git 주석과 diff 부분은 검사하지 않는다', () => {
    const msg =
      'feat: 제목\n\n본문\n# 주석\n# ------------------------ >8 ------------------------\n+diff';
    const texts = messageLines(msg).map((l: { text: string }) => l.text);
    expect(texts).toContain('본문');
    expect(texts.some((t: string) => t.startsWith('#') || t === '+diff')).toBe(false);
  });
});
