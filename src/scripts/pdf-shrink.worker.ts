// PDF 사진 재압축을 화면과 다른 스레드에서 돌린다(MuPDF wasm 은 큰 동기 작업이라 화면이 멈추지 않게).
import { type ShrinkOptions, shrinkPdf } from '@/lib/pdf-shrink';

export interface ShrinkRequest {
  bytes: Uint8Array;
  options: Omit<ShrinkOptions, 'onProgress'>;
}

export type ShrinkMessage =
  | { type: 'progress'; done: number; total: number }
  | { type: 'done'; bytes: Uint8Array; images: number; rewritten: number }
  | { type: 'error'; message: string };

const post = (message: ShrinkMessage, transfer: Transferable[] = []) =>
  (self as unknown as Worker).postMessage(message, transfer);

self.addEventListener('message', async (event: MessageEvent<ShrinkRequest>) => {
  try {
    const mupdf = await import('mupdf');
    let last = 0;
    const result = shrinkPdf(mupdf, event.data.bytes, {
      ...event.data.options,
      onProgress: (done, total) => {
        const now = performance.now();
        if (now - last < 100 && done < total) return;
        last = now;
        post({ type: 'progress', done, total });
      },
    });
    post({ type: 'done', ...result }, [result.bytes.buffer]);
  } catch (cause) {
    post({ type: 'error', message: cause instanceof Error ? cause.message : String(cause) });
  }
});
