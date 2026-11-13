// gifski(wasm)로 GIF 를 만든다 — 프레임마다 팔레트를 정교하게 골라 색 번짐이 적다.
import encode from 'gifski-wasm';

export interface GifEncodeRequest {
  frames: Uint8ClampedArray<ArrayBuffer>[];
  width: number;
  height: number;
  durations: number[];
  repeat: number;
  quality: number;
}

export type GifEncodeResponse = { ok: true; bytes: Uint8Array } | { ok: false; message: string };

self.addEventListener('message', async (event: MessageEvent<GifEncodeRequest>) => {
  const { frames, width, height, durations, repeat, quality } = event.data;
  const post = (message: GifEncodeResponse, transfer: Transferable[] = []) =>
    (self as unknown as Worker).postMessage(message, transfer);
  try {
    const bytes = await encode({
      frames: frames.map((data) => new ImageData(data, width, height)),
      width,
      height,
      frameDurations: durations,
      repeat,
      quality,
    });
    post({ ok: true, bytes }, [bytes.buffer]);
  } catch (cause) {
    post({ ok: false, message: cause instanceof Error ? cause.message : String(cause) });
  }
});
