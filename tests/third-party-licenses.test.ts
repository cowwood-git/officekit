import { describe, expect, it } from 'vitest';
import { productionPackages, render } from '../scripts/third-party-licenses.mjs';

describe('third-party-licenses', () => {
  it('개발 전용 패키지는 빼고 운영 의존성만 고른다', () => {
    const lock = {
      packages: {
        '': { name: 'officekit' },
        'node_modules/mupdf': {},
        'node_modules/vitest': { dev: true },
        'node_modules/fsevents': { devOptional: true },
        'node_modules/a/node_modules/b': {},
      },
    };
    expect(productionPackages(lock)).toEqual([
      'node_modules/mupdf',
      'node_modules/a/node_modules/b',
    ]);
  });

  it('패키지마다 이름·버전·라이선스와 원문을 적는다', () => {
    const text = render([
      {
        name: 'pkg-a',
        version: '1.0.0',
        license: 'MIT',
        homepage: '',
        texts: ['MIT License\nCopyright (c) A'],
      },
      { name: 'pkg-b', version: '2.0.0', license: 'ISC', homepage: '', texts: [] },
    ]);
    expect(text).toContain('pkg-a@1.0.0 — MIT');
    expect(text).toContain('Copyright (c) A');
    expect(text).toContain('pkg-b@2.0.0 — ISC');
    expect(text).toContain('패키지 2개');
  });
});
