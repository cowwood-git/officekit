// imgly 배경 지우기 라이브러리를 이 사이트에 맞게 고친 사본을 만든다(src/vendor/, 저장소에는 넣지 않음).
//
// 왜 사본인가: 예전에는 Vite 변환 플러그인으로 node_modules 코드를 그때그때 고쳤는데,
//  - 개발 서버는 node_modules 파일을 `?v=` 주소에 1년 캐시(immutable)로 내준다 → 고치는 내용이 바뀌어도
//    브라우저가 옛 코드를 계속 써서 개발 화면이 깨졌다.
//  - 워커 번들은 플러그인 목록이 따로라 빠뜨리기 쉬웠다.
// 일반 소스 파일로 만들어 두면 개발 서버는 매번 확인(no-cache)하고, 배포 빌드는 내용 해시로 이름이 바뀐다.
//
// 고치는 것
// 1) onnxruntime 실행 파일(.mjs·.wasm)을 blob: URL 로 불러오는 두 줄 → /bg/ort-<버전>/ 직접 경로
//    (사이트 CSP 는 blob: 스크립트를 막는다)
// 2) new Function() 으로 코드를 만드는 ndarray → 코드 생성 없는 구현(CSP 에 'unsafe-eval' 없음)
// 3) 여러 스레드를 못 쓰는 환경에서 스레드 수를 1로(onnxruntime 경고 제거)
// 라이브러리가 바뀌어 고칠 곳을 못 찾으면 멈춘다.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
export const IMGLY_SOURCE = join(
  ROOT,
  'node_modules',
  '@imgly',
  'background-removal',
  'dist',
  'index.mjs',
);
export const IMGLY_PATCHED = join(ROOT, 'src', 'vendor', 'imgly-background-removal.mjs');

export function replacements(ortDir) {
  return [
    [
      // 여러 스레드는 crossOriginIsolated(COOP·COEP) 일 때만 된다. 이 사이트는 광고 때문에 켤 수 없어
      // 늘 한 스레드로 돌아가는데, 코어 수로 정하면 onnxruntime 이 매번 경고를 두 줄씩 남긴다.
      'var maxNumThreads = () => navigator.hardwareConcurrency ?? 4;',
      'var maxNumThreads = () => (globalThis.crossOriginIsolated ? (navigator.hardwareConcurrency ?? 4) : 1);',
    ],
    [
      // biome-ignore lint/suspicious/noTemplateCurlyInString: imgly 원본 코드를 글자 그대로 찾는다
      'const wasmPath = await loadAsUrl(`${baseFilePath}.wasm`, config);',
      `const wasmPath = new URL(\`../${ortDir}/\${baseFilePath.split('/').pop()}.wasm\`, config.publicPath).href;`,
    ],
    [
      // biome-ignore lint/suspicious/noTemplateCurlyInString: imgly 원본 코드를 글자 그대로 찾는다
      'const mjsPath = await loadAsUrl(`${baseFilePath}.mjs`, config);',
      `const mjsPath = new URL(\`../${ortDir}/\${baseFilePath.split('/').pop()}.mjs\`, config.publicPath).href;`,
    ],
  ];
}

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
      'imgly 코드가 바뀌었습니다 — ndarray 를 찾지 못했습니다(scripts/imgly-patch.mjs).',
    );
  }
  return code.slice(0, start) + NDARRAY_SAFE + code.slice(end + NDARRAY_END.length);
}

export function rewriteImgly(code, ortDir) {
  let out = replaceNdarray(code);
  for (const [from, to] of replacements(ortDir)) {
    if (!out.includes(from)) {
      throw new Error(`imgly 코드가 바뀌었습니다 — scripts/imgly-patch.mjs 확인 필요: ${from}`);
    }
    out = out.replace(from, to);
  }
  // 원본 소스맵(index.mjs.map)은 사본 옆에 없으므로 연결을 뗀다.
  out = out.replace(/\n\/\/# sourceMappingURL=\S+\s*$/, '\n');
  return `// 자동 생성 — scripts/imgly-patch.mjs (직접 고치지 말 것)\n${out}`;
}

/** 고친 사본을 쓴다. 내용이 같으면 건드리지 않는다(개발 서버가 괜히 다시 읽지 않게). */
export function writePatchedImgly(ortDir) {
  const next = rewriteImgly(readFileSync(IMGLY_SOURCE, 'utf8'), ortDir);
  let current = '';
  try {
    current = readFileSync(IMGLY_PATCHED, 'utf8');
  } catch {}
  if (current !== next) writeFileSync(IMGLY_PATCHED, next);
  return next.length;
}
