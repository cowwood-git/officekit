// 배경 지우기를 화면과 다른 스레드에서 돌린다(imgly ISNet + onnxruntime).
// 모델·엔진 파일은 모두 이 사이트의 /bg/ 에서 받는다(외부 서버로 사진·IP가 가지 않는다).
import { BG_MODEL, BG_VERSION } from '@/lib/remove-bg';

export interface RemoveBgRequest {
  image: Blob;
  gpu: boolean;
}

export type RemoveBgMessage =
  | { type: 'download'; done: number; total: number }
  | { type: 'done'; image: Blob; device: 'gpu' | 'cpu' }
  | { type: 'error'; message: string };

const post = (message: RemoveBgMessage) => (self as unknown as Worker).postMessage(message);

/**
 * 모델·엔진 응답을 CacheStorage에 직접 보관한다.
 * 서비스 워커가 없는 첫 방문이나, 워커 요청을 가로채지 못하는 브라우저에서도
 * 누끼 모델이 HTTP 캐시에만 남아 "저장 공간"에 보이지 않는 문제를 막는다.
 */
let bgFetchInstalled = false;
function installBgFetchCache(): void {
  if (bgFetchInstalled) return;
  bgFetchInstalled = true;
  if (typeof caches === 'undefined') return;

  const nativeFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, self.location.href);
    if (url.origin !== self.location.origin || !url.pathname.startsWith('/bg/')) {
      return nativeFetch(input, init);
    }

    try {
      const cache = await caches.open('officekit-bg');
      const cached = await cache.match(url);
      if (cached) return cached;
      const response = await nativeFetch(input, init);
      if (response.ok) {
        cache.put(url, response.clone()).catch(() => undefined);
      }
      return response;
    } catch {
      return nativeFetch(input, init);
    }
  }) as typeof fetch;
}

async function run(request: RemoveBgRequest, device: 'gpu' | 'cpu'): Promise<Blob> {
  installBgFetchCache();
  // 이 사이트용으로 고친 사본(scripts/imgly-patch.mjs 가 만든다)
  const { removeBackground } = await import('@/vendor/imgly-background-removal.mjs');
  return removeBackground(request.image, {
    publicPath: new URL(`/bg/${BG_VERSION}/`, self.location.origin).href,
    model: BG_MODEL,
    device,
    proxyToWorker: false,
    output: { format: 'image/png' },
    progress: (key: string, done: number, total: number) => {
      if (key.startsWith('fetch:')) post({ type: 'download', done, total });
    },
  });
}

self.addEventListener('message', async (event: MessageEvent<RemoveBgRequest>) => {
  const request = event.data;
  try {
    if (request.gpu) {
      try {
        post({ type: 'done', image: await run(request, 'gpu'), device: 'gpu' });
        return;
      } catch (cause) {
        // 그래픽 가속이 안 되는 기기(메모리·버퍼 한도 등)는 일반 실행으로 다시 한다.
        console.warn('WebGPU 로 실행하지 못해 일반 모드로 다시 실행합니다.', cause);
      }
    }
    post({ type: 'done', image: await run(request, 'cpu'), device: 'cpu' });
  } catch (cause) {
    post({ type: 'error', message: cause instanceof Error ? cause.message : String(cause) });
  }
});
