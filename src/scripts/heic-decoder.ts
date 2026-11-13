// 브라우저가 HEIC를 못 읽을 때(Chrome·Edge·Firefox) libheif 워커로 풀어 ImageBitmap 으로 돌려준다.
import type { HeicDecodeResponse } from './heic-decode.worker';

export async function decodeHeicToBitmap(file: Blob): Promise<ImageBitmap> {
  const buffer = await file.arrayBuffer();
  const worker = new Worker(new URL('./heic-decode.worker.ts', import.meta.url), {
    type: 'module',
  });
  const stop = () => worker.terminate();
  // 한 장 풀고 바로 끝내는 짧은 작업이지만, 도중에 페이지를 떠나면 워커를 바로 정리한다.
  window.addEventListener('pagehide', stop, { once: true });
  try {
    const result = await new Promise<HeicDecodeResponse>((resolve, reject) => {
      worker.addEventListener('message', (event: MessageEvent<HeicDecodeResponse>) =>
        resolve(event.data),
      );
      worker.addEventListener('error', (event) =>
        reject(new Error(event.message || 'HEIC 디코더를 불러오지 못했습니다.')),
      );
      worker.postMessage(buffer, [buffer]);
    });
    if (!result.ok || !result.pixels || !result.width || !result.height) {
      throw new Error(result.message || 'HEIC 사진을 읽지 못했습니다.');
    }
    return createImageBitmap(new ImageData(result.pixels, result.width, result.height));
  } finally {
    stop();
    window.removeEventListener('pagehide', stop);
  }
}
