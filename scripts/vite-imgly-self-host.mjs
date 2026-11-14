// imgly 는 onnxruntime 실행 파일(.mjs·.wasm)을 blob: URL 로 바꿔 불러온다.
// 사이트 CSP(script-src 'self')는 blob: 스크립트를 막으므로, 빌드할 때 그 두 줄만
// 이 사이트의 /bg/ort-<버전>/ 경로를 직접 가리키게 바꾼다. 라이브러리가 바뀌어 문자열이 없으면 빌드를 멈춘다.

import { ORT_DIR } from './bg-assets.mjs';

const TARGET = /@imgly\/background-removal\/dist\/index\.mjs$/;

export const REPLACEMENTS = [
  [
    // biome-ignore lint/suspicious/noTemplateCurlyInString: imgly 원본 코드를 글자 그대로 찾는다
    'const wasmPath = await loadAsUrl(`${baseFilePath}.wasm`, config);',
    `const wasmPath = new URL(\`../${ORT_DIR}/\${baseFilePath.split('/').pop()}.wasm\`, config.publicPath).href;`,
  ],
  [
    // biome-ignore lint/suspicious/noTemplateCurlyInString: imgly 원본 코드를 글자 그대로 찾는다
    'const mjsPath = await loadAsUrl(`${baseFilePath}.mjs`, config);',
    `const mjsPath = new URL(\`../${ORT_DIR}/\${baseFilePath.split('/').pop()}.mjs\`, config.publicPath).href;`,
  ],
];

export function rewriteImgly(code) {
  let out = code;
  for (const [from, to] of REPLACEMENTS) {
    if (!out.includes(from)) {
      throw new Error(
        `imgly 코드가 바뀌었습니다 — scripts/vite-imgly-self-host.mjs 확인 필요: ${from}`,
      );
    }
    out = out.replace(from, to);
  }
  return out;
}

export function imglySelfHost() {
  return {
    name: 'officekit-imgly-self-host',
    enforce: 'pre',
    transform(code, id) {
      if (!TARGET.test(id.split('?')[0])) return null;
      return { code: rewriteImgly(code), map: null };
    },
  };
}
