import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPTS = join(process.cwd(), 'src', 'scripts');

/** 리소스를 오래 붙잡지 않는 헬퍼·일회성 다운로드 도구. */
const PAGE_HIDE_EXEMPT = new Set(['heic-file.ts', 'image-colors.ts', 'ocr-client.ts', 'qr.ts']);

describe('메모리 정리', () => {
  it('무거운 리소스를 쓰는 도구는 pagehide 정리 지점을 둔다', () => {
    const missing = readdirSync(SCRIPTS)
      .filter((name) => name.endsWith('.ts'))
      .filter((name) => !PAGE_HIDE_EXEMPT.has(name))
      .filter((name) => {
        const source = readFileSync(join(SCRIPTS, name), 'utf8');
        const heavy =
          source.includes('createObjectURL') ||
          source.includes('createImageBitmap') ||
          source.includes('getDocument(') ||
          source.includes('Worker(');
        return heavy && !source.includes('pagehide');
      });
    expect(missing).toEqual([]);
  });

  it('Object URL을 만드는 도구는 해제 코드도 있다', () => {
    const missing = readdirSync(SCRIPTS)
      .filter((name) => name.endsWith('.ts'))
      .filter((name) => {
        const source = readFileSync(join(SCRIPTS, name), 'utf8');
        return source.includes('createObjectURL') && !source.includes('revokeObjectURL');
      });
    expect(missing).toEqual([]);
  });
});
