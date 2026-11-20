// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { createLastmod } from './scripts/sitemap-lastmod.mjs';
import { DEFAULT_SITE_URL } from './src/site.mjs';

const site = process.env.SITE_URL || DEFAULT_SITE_URL;
const lastmodOf = createLastmod('dist');

/**
 * onnxruntime 번들의 `new URL('ort-wasm-…jsep.wasm', import.meta.url)` 때문에 Vite가 24MB wasm을
 * `_astro/`에도 내보낸다. 실제로는 imgly가 `env.wasm.wasmPaths`를 `/bg/ort-<버전>/`으로 정해
 * 그쪽만 받으므로(e2e/remove-bg.spec.ts가 확인) `_astro` 사본은 쓰이지 않는 중복이다.
 * Cloudflare Pages 파일당 25MB 상한에 가깝고 배포 용량만 늘려 빼 둔다.
 */
function dropUnusedOrtWasm() {
  return {
    name: 'officekit:drop-unused-ort-wasm',
    apply: /** @type {const} */ ('build'),
    /** @param {unknown} _options @param {Record<string, { type: string }>} bundle */
    generateBundle(_options, bundle) {
      for (const [file, output] of Object.entries(bundle)) {
        if (output.type === 'asset' && /(^|\/)ort-wasm-simd-threaded[^/]*\.wasm$/.test(file)) {
          delete bundle[file];
        }
      }
    },
  };
}

export default defineConfig({
  site,
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en', 'ja'],
    routing: {
      // 한국어를 기본으로 두고, 번역이 준비된 언어만 /en/, /ja/ 로 추가한다.
      // 번역 없는 페이지를 기계적으로 만들지 않기 위해 prefixDefaultLocale 은 false.
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/offline'),
      // 페이지가 밝힌 수정일만 쓴다(scripts/sitemap-lastmod.mjs). 날짜가 없으면 비운다.
      serialize(item) {
        const lastmod = lastmodOf(item.url);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  build: {
    format: 'directory',
  },
  vite: {
    // PDF 압축 워커가 mupdf(top-level await·wasm)를 불러오므로 ES 모듈 워커로 묶는다.
    worker: { format: 'es', plugins: () => [dropUnusedOrtWasm()] },
    plugins: [dropUnusedOrtWasm()],
    // 미리 묶으면 mupdf 가 wasm 파일 위치(import.meta.url)를 잃는다.
    optimizeDeps: { exclude: ['mupdf', 'onnxruntime-web'] },
  },
});
