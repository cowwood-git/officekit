// 배경 지우기 워커를 부르는 공용 코드 — 누끼 따기·증명사진 도구가 같이 쓴다.
import { fitSide } from '@/lib/remove-bg';
import type { RemoveBgMessage } from './remove-bg.worker';

let worker: Worker | null = null;

export const hasWebGpu = (): boolean => typeof navigator !== 'undefined' && 'gpu' in navigator;

export function stopRemoveBg(): void {
  worker?.terminate();
  worker = null;
}

/** 너무 큰 사진은 줄여서 PNG 로 넘긴다(모델은 1024px 로 보고, 결과는 넘긴 크기로 돌려준다) */
export async function toModelInput(source: Blob | ImageBitmap): Promise<Blob> {
  const bitmap =
    source instanceof Blob
      ? await createImageBitmap(source, { imageOrientation: 'from-image' })
      : source;
  const size = fitSide(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, size.width, size.height);
  if (source instanceof Blob) bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('사진을 읽지 못했습니다.'))),
      'image/png',
    ),
  );
}

/** 배경을 지운 투명 PNG 를 돌려준다. 처음에는 모델을 받으며 onDownload 로 진행을 알린다. */
export function removeBackgroundInWorker(
  image: Blob,
  onDownload?: (done: number, total: number) => void,
): Promise<{ image: Blob; device: 'gpu' | 'cpu' }> {
  stopRemoveBg();
  const current = new Worker(new URL('./remove-bg.worker.ts', import.meta.url), {
    type: 'module',
  });
  worker = current;
  const finish = () => {
    current.terminate();
    if (worker === current) worker = null;
  };
  return new Promise((resolve, reject) => {
    current.addEventListener('message', (event: MessageEvent<RemoveBgMessage>) => {
      const message = event.data;
      if (message.type === 'download') {
        onDownload?.(message.done, message.total);
        return;
      }
      finish();
      if (message.type === 'done') resolve({ image: message.image, device: message.device });
      else reject(new Error(message.message));
    });
    current.addEventListener('error', (event) => {
      finish();
      reject(new Error(event.message || '배경 지우기 엔진을 불러오지 못했습니다.'));
    });
    current.postMessage({ image, gpu: hasWebGpu() });
  });
}

if (typeof window !== 'undefined') window.addEventListener('pagehide', stopRemoveBg);
