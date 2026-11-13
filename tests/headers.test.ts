import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const headers = readFileSync(join(process.cwd(), 'public', '_headers'), 'utf8');
const scripts = join(process.cwd(), 'src', 'scripts');

describe('_headers', () => {
  it('카메라를 쓰는 도구가 있으면 이 사이트에는 카메라를 허용한다', () => {
    const usesCamera = readdirSync(scripts).some((name) =>
      readFileSync(join(scripts, name), 'utf8').includes('getUserMedia'),
    );
    const policy = headers.match(/Permissions-Policy: (.*)/)?.[1] ?? '';
    if (usesCamera) expect(policy).toContain('camera=(self)');
    expect(policy).toContain('microphone=()');
    expect(policy).toContain('geolocation=()');
  });

  it('HTTPS 강제(HSTS)를 보낸다', () => {
    expect(headers).toMatch(/Strict-Transport-Security: max-age=\d{7,}/);
  });
});

describe('서비스 워커', () => {
  const sw = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8');

  it('API 응답(좋아요 수)은 캐시하지 않는다', () => {
    expect(sw).toMatch(/pathname\.startsWith\('\/api\/'\)\) return;/);
  });

  it('해시 없는 자산은 네트워크 먼저, 해시 자산만 캐시 먼저', () => {
    expect(sw).toContain("url.pathname.startsWith('/_astro/')");
    expect(sw).toContain('networkFirst(request, VERSION)');
  });
});
