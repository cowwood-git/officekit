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
