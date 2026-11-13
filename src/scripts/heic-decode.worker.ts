// HEIC(아이폰 사진)를 RGBA 픽셀로 푼다 — libheif(wasm). eval 을 쓰지 않아 엄격한 CSP 그대로 동작한다.
import createLibheif from 'libheif-js/libheif-wasm/libheif.js';
import wasmUrl from 'libheif-js/libheif-wasm/libheif.wasm?url';

export interface HeicDecodeResponse {
  ok: boolean;
  width?: number;
  height?: number;
  pixels?: Uint8ClampedArray<ArrayBuffer>;
  message?: string;
}

interface HeifImage {
  get_width(): number;
  get_height(): number;
  is_primary(): boolean;
  display(
    target: { data: Uint8ClampedArray<ArrayBuffer>; width: number; height: number },
    done: (result: { data: Uint8ClampedArray<ArrayBuffer> } | null) => void,
  ): void;
  free(): void;
}

interface Libheif {
  HeifDecoder: new () => { decode(buffer: ArrayBuffer | Uint8Array): HeifImage[] };
}

let ready: Promise<Libheif> | null = null;

function load(): Promise<Libheif> {
  ready ??= new Promise<Libheif>((resolve, reject) => {
    // emscripten 은 넘긴 설정 객체에 기능을 붙여 준다. 준비 콜백이 팩토리가 돌려주기 전에
    // 불릴 수 있어서, 반환값 대신 이 객체를 넘긴다.
    const options: Record<string, unknown> = {
      locateFile: () => wasmUrl,
      onAbort: (reason: unknown) => reject(new Error(String(reason))),
    };
    options.onRuntimeInitialized = () => resolve(options as unknown as Libheif);
    createLibheif(options);
  });
  return ready;
}

async function decode(buffer: ArrayBuffer): Promise<HeicDecodeResponse> {
  const libheif = await load();
  const images = new libheif.HeifDecoder().decode(new Uint8Array(buffer));
  const image = images.find((item) => item.is_primary()) ?? images[0];
  if (!image) return { ok: false, message: 'HEIC 사진을 찾지 못했습니다.' };
  const width = image.get_width();
  const height = image.get_height();
  const pixels = await new Promise<Uint8ClampedArray<ArrayBuffer> | null>((resolve) => {
    image.display({ data: new Uint8ClampedArray(width * height * 4), width, height }, (result) =>
      resolve(result ? result.data : null),
    );
  });
  for (const item of images) item.free();
  if (!pixels) return { ok: false, message: 'HEIC 사진을 풀지 못했습니다.' };
  return { ok: true, width, height, pixels };
}

self.addEventListener('message', async (event: MessageEvent<ArrayBuffer>) => {
  const post = (message: HeicDecodeResponse, transfer: Transferable[] = []) =>
    (self as unknown as Worker).postMessage(message, transfer);
  try {
    const result = await decode(event.data);
    post(result, result.pixels ? [result.pixels.buffer] : []);
  } catch (cause) {
    post({ ok: false, message: cause instanceof Error ? cause.message : String(cause) });
  }
});
