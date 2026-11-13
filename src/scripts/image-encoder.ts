// 캔버스 → 파일. 고급 코덱(워커)으로 먼저 저장하고, 실패하면 브라우저 기본 인코더로 저장한다.
import { type EncodeMime, smaller } from '@/lib/image-encode';
import type { EncodeRequest, EncodeResponse } from './image-encode.worker';

let worker: Worker | null = null;
let broken = false;
let nextId = 1;
const pending = new Map<
  number,
  { resolve: (b: ArrayBuffer) => void; reject: (e: Error) => void }
>();

function getWorker(): Worker | null {
  if (broken) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./image-encode.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    broken = true;
    return null;
  }
  worker.addEventListener('message', (event: MessageEvent<EncodeResponse>) => {
    const job = pending.get(event.data.id);
    if (!job) return;
    pending.delete(event.data.id);
    if (event.data.ok) job.resolve(event.data.buffer);
    else job.reject(new Error(event.data.message));
  });
  worker.addEventListener('error', () => {
    // 워커 자체를 못 띄우면(구형 브라우저 등) 이후엔 기본 인코더만 쓴다.
    broken = true;
    worker?.terminate();
    worker = null;
    for (const job of pending.values()) job.reject(new Error('인코더를 불러오지 못했습니다.'));
    pending.clear();
  });
  return worker;
}

function encodeInWorker(canvas: HTMLCanvasElement, mime: EncodeMime, quality: number) {
  const target = getWorker();
  if (!target) return Promise.reject(new Error('인코더 없음'));
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject(new Error('캔버스를 읽을 수 없습니다.'));
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  const id = nextId;
  nextId += 1;
  const request: EncodeRequest = { id, mime, quality, width, height, pixels: data };
  return new Promise<ArrayBuffer>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    target.postMessage(request, [data.buffer]);
  });
}

function nativeBlob(canvas: HTMLCanvasElement, mime: EncodeMime, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob && blob.type === mime ? blob : null), mime, quality);
  });
}

/**
 * 캔버스를 mime 형식으로 저장한다. 고급 코덱과 기본 인코더 중 더 작은 결과를 돌려준다.
 * (Safari 는 WebP 를 기본 인코더로 못 만들어서 코덱 결과만 쓴다.)
 */
export async function encodeCanvas(
  canvas: HTMLCanvasElement,
  mime: EncodeMime,
  quality = 0.8,
): Promise<Blob> {
  const native = nativeBlob(canvas, mime, quality);
  let codec: Blob | null = null;
  try {
    codec = new Blob([await encodeInWorker(canvas, mime, quality)], { type: mime });
  } catch (cause) {
    console.warn('고급 인코더를 쓰지 못해 기본 인코더로 저장합니다.', cause);
  }
  const fallback = await native;
  if (!fallback && !codec) throw new Error('이 형식으로 저장할 수 없습니다.');
  if (!fallback) return codec as Blob;
  return smaller(fallback, codec);
}

// 페이지를 떠나면 워커와 코덱 메모리를 놓아준다(다시 오면 필요할 때 새로 띄운다).
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    worker?.terminate();
    worker = null;
    for (const job of pending.values()) job.reject(new Error('페이지를 떠났습니다.'));
    pending.clear();
  });
}
