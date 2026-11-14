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

// imgly 안에 묶여 있는 ndarray 는 배열 클래스를 new Function() 으로 만든다(eval).
// 사이트 CSP 에는 'unsafe-eval' 이 없어서 막히므로, 코드를 만들지 않는 작은 구현으로 바꾼다.
// imgly 는 3차원 get/set 과 .data·.shape 만 쓴다(테스트로 결과가 같은지 확인).
const NDARRAY_START = 'var require_ndarray = __commonJS({';
const NDARRAY_END = '    module.exports = wrappedNDArrayCtor;\n  }\n});';

export const NDARRAY_SAFE = `var require_ndarray = __commonJS({
  "officekit-ndarray-csp-safe"(exports, module) {
    module.exports = function ndarray(data, shape, stride, offset) {
      shape = shape || [data.length];
      var d = shape.length;
      if (!stride) {
        stride = new Array(d);
        for (var i = d - 1, size = 1; i >= 0; --i) { stride[i] = size; size *= shape[i]; }
      }
      offset = offset || 0;
      var s0 = stride[0] || 0, s1 = stride[1] || 0, s2 = stride[2] || 0;
      var at = d === 3
        ? function (a, b, c) { return offset + s0 * a + s1 * b + s2 * c; }
        : function () { var p = offset; for (var k = 0; k < d; ++k) p += stride[k] * arguments[k]; return p; };
      return {
        data: data, shape: shape, stride: stride, offset: offset, dimension: d,
        size: shape.reduce(function (a, b) { return a * b; }, 1),
        index: at,
        get: d === 3
          ? function (a, b, c) { return data[offset + s0 * a + s1 * b + s2 * c]; }
          : function () { return data[at.apply(null, arguments)]; },
        set: d === 3
          ? function (a, b, c, v) { return (data[offset + s0 * a + s1 * b + s2 * c] = v); }
          : function () { var args = Array.prototype.slice.call(arguments); var v = args.pop(); return (data[at.apply(null, args)] = v); },
      };
    };
  }
});`;

function replaceNdarray(code) {
  const start = code.indexOf(NDARRAY_START);
  const end = code.indexOf(NDARRAY_END, start);
  if (start < 0 || end < 0) {
    throw new Error(
      'imgly 코드가 바뀌었습니다 — ndarray 를 찾지 못했습니다(scripts/vite-imgly-self-host.mjs).',
    );
  }
  return code.slice(0, start) + NDARRAY_SAFE + code.slice(end + NDARRAY_END.length);
}

export function rewriteImgly(code) {
  let out = replaceNdarray(code);
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
