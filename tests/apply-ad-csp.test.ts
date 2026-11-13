import { describe, expect, it } from 'vitest';
import { addAdSources, adsTxt, applyToHeaders } from '../scripts/apply-ad-csp.mjs';

const STRICT =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-src 'none'; object-src 'none'";

describe('apply-ad-csp', () => {
  it('광고 출처를 script/img/connect/frame 에 더한다', () => {
    const out: string = addAdSources(STRICT);
    expect(out).toContain(
      "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com",
    );
    expect(out).toMatch(/img-src [^;]*https:\/\/\*\.googlesyndication\.com/);
    expect(out).toMatch(/connect-src [^;]*https:\/\/pagead2\.googlesyndication\.com/);
  });

  it("frame-src 'none' 을 광고 프레임 출처로 바꾼다", () => {
    const out: string = addAdSources(STRICT);
    expect(out).not.toMatch(/frame-src [^;]*'none'/);
    expect(out).toMatch(/frame-src https:\/\/googleads\.g\.doubleclick\.net/);
  });

  it('다른 지시어는 건드리지 않는다', () => {
    const out: string = addAdSources(STRICT);
    expect(out).toContain("default-src 'self'");
    expect(out).toContain("object-src 'none'");
  });

  it('Google 동의 메시지(CMP) 출처를 script/frame/connect 에 더한다', () => {
    const out: string = addAdSources(STRICT);
    for (const name of ['script-src', 'frame-src', 'connect-src']) {
      expect(out).toMatch(new RegExp(`${name} [^;]*https://fundingchoicesmessages\\.google\\.com`));
    }
  });

  it('ads.txt 는 ca- 를 뗀 게시자 ID 와 Google 인증 ID 로 만든다', () => {
    expect(adsTxt('ca-pub-1234567890123456')).toBe(
      'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n',
    );
  });

  it('두 번 적용해도 출처가 중복되지 않는다', () => {
    const once: string = addAdSources(STRICT);
    expect(addAdSources(once)).toBe(once);
  });

  it('_headers 의 모든 CSP 줄(경로별 예외 포함)에 적용한다', () => {
    const headers = `/*\n  Content-Security-Policy: ${STRICT}\n\n/tools/heic-to-jpg/*\n  ! Content-Security-Policy\n  Content-Security-Policy: ${STRICT}\n`;
    const out: string = applyToHeaders(headers);
    expect(out.match(/pagead2\.googlesyndication\.com/g)?.length).toBeGreaterThanOrEqual(4);
    expect(out).toContain('  ! Content-Security-Policy\n');
  });
});
