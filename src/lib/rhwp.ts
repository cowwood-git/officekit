/**
 * @rhwp/core(WASM) 로더 — HWP·HWPX 뷰어와 PDF 변환이 함께 쓴다.
 * 25MiB 원본 WASM을 번들하지 않도록 public/rhwp-loader.js 로 불러온다.
 */
export type RhwpModule = typeof import('@rhwp/core');

type RhwpGlobal = typeof globalThis & { __officekitRhwp?: RhwpModule };

let rhwpModule: RhwpModule | null = null;
let rhwpLoader: Promise<RhwpModule> | null = null;
let rhwpReady: Promise<void> | null = null;

export function loadRhwpModule(): Promise<RhwpModule> {
  if (rhwpModule) return Promise.resolve(rhwpModule);
  if (rhwpLoader) return rhwpLoader;

  rhwpLoader = new Promise<RhwpModule>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/rhwp-loader.js';
    script.onload = () => {
      const module = (globalThis as RhwpGlobal).__officekitRhwp;
      if (!module) {
        reject(new Error('HWP 변환 모듈을 초기화하지 못했습니다.'));
        return;
      }
      rhwpModule = module;
      resolve(module);
    };
    script.onerror = () => reject(new Error('HWP 변환 모듈을 불러오지 못했습니다.'));
    document.head.append(script);
  }).catch((cause) => {
    rhwpLoader = null;
    throw cause;
  });

  return rhwpLoader;
}

/** rhwp WASM을 한 번만 준비한다. HWP와 HWPX 모두 이 파서로 페이지를 그린다. */
export function ensureRhwp(): Promise<void> {
  if (rhwpReady) return rhwpReady;
  rhwpReady = (async () => {
    let context: CanvasRenderingContext2D | null = null;
    let lastFont = '';
    (
      globalThis as unknown as {
        measureTextWidth: (font: string, text: string) => number;
      }
    ).measureTextWidth = (font, text) => {
      if (!context) context = document.createElement('canvas').getContext('2d');
      if (!context) return text.length * 8;
      if (font !== lastFont) {
        context.font = font;
        lastFont = font;
      }
      return context.measureText(text).width;
    };

    const response = await fetch('/rhwp/rhwp_bg.wasm.gz');
    if (!response.ok) throw new Error('HWP 변환 모듈을 불러오지 못했습니다.');
    const compressed = await response.arrayBuffer();
    const header = new Uint8Array(compressed, 0, Math.min(4, compressed.byteLength));
    const isRawWasm =
      header[0] === 0x00 && header[1] === 0x61 && header[2] === 0x73 && header[3] === 0x6d;

    let wasm: ArrayBuffer;
    if (isRawWasm) {
      wasm = compressed;
    } else if (typeof DecompressionStream !== 'undefined') {
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
      wasm = await new Response(stream).arrayBuffer();
    } else {
      throw new Error(
        '이 브라우저는 HWP 변환을 지원하지 않습니다. 최신 브라우저를 사용하거나 한글에서 HWPX로 저장하세요.',
      );
    }

    const rhwp = await loadRhwpModule();
    await rhwp.default({ module_or_path: new Uint8Array(wasm) });
  })().catch((cause) => {
    rhwpReady = null;
    throw cause;
  });
  return rhwpReady;
}
