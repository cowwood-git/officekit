/* 옷깃 서비스 워커 — 방문한 페이지·도구 자산을 캐시해 오프라인에서도 열리게 한다.
 *
 * 전략
 * - 페이지(HTML): 네트워크 먼저, 끊기면 캐시 → 오프라인 안내.
 * - /_astro/*: 파일 이름에 해시가 있어 내용이 바뀌지 않는다 → 캐시 먼저.
 * - 그 밖의 자산(/ocr·/pdfjs·/rhwp·아이콘·글꼴 등): 경로가 같아도 업그레이드로 내용이 바뀐다
 *   → 네트워크 먼저(브라우저 HTTP 캐시를 거치므로 가볍다), 끊기면 캐시.
 * - /api/*: 매번 새 값이어야 한다(좋아요 수) → 서비스 워커가 손대지 않는다.
 */
const VERSION = 'officekit-v5';
const ASSETS = `${VERSION}-assets`;
/** 해시 자산 캐시는 배포마다 새 파일이 쌓이므로 오래된 것부터 지운다 */
const MAX_ASSETS = 150;
const SHELL = [
  '/',
  '/offline/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== VERSION && key !== ASSETS).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  // cache.keys() 는 넣은 순서대로 돌려준다 — 앞쪽(오래된 것)부터 지운다.
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
}

function store(cacheName, request, response) {
  if (!response.ok || response.type !== 'basic') return;
  const copy = response.clone();
  caches
    .open(cacheName)
    .then((cache) => cache.put(request, copy))
    .then(() => (cacheName === ASSETS ? trim(ASSETS, MAX_ASSETS) : undefined))
    .catch(() => undefined);
}

function networkFirst(request, cacheName) {
  return fetch(request)
    .then((response) => {
      store(cacheName, request, response);
      return response;
    })
    .catch(async () => (await caches.match(request)) ?? Response.error());
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js') return;
  if (url.pathname.startsWith('/api/')) return;
  if (request.headers.has('range')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status >= 500) throw new Error('network error');
          store(VERSION, request, response);
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return (await caches.match('/offline/')) ?? (await caches.match('/')) ?? Response.error();
        }),
    );
    return;
  }

  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            store(ASSETS, request, response);
            return response;
          }),
      ),
    );
    return;
  }

  event.respondWith(networkFirst(request, VERSION));
});
