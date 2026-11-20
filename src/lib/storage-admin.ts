/**
 * 브라우저 저장 공간 관리.
 *
 * 캐시를 "누끼 모델·엔진, OCR, HWPX, PDF.js, 글꼴, 사이트 코드" 같은 의미 단위로
 * 묶어 보여 주고, 각 단위를 개별로 지울 수 있게 한다.
 */

import { BG_VERSION } from './remove-bg';

/** public/sw.js 의 BG_CACHE 와 같아야 한다. */
export const BG_CACHE = 'officekit-bg';
export const BG_MODEL_PREFIX = `/bg/${BG_VERSION}/`;
export const BG_ENGINE_PREFIX = '/bg/ort-';

const MB = 1024 * 1024;
/** Content-Length가 없는 모델 청크의 안내용 대략 크기. */
const BG_MODEL_APPROX_BYTES = 85 * MB;
const BG_ENGINE_APPROX_BYTES = 27 * MB;

export interface StorageGroup {
  id: string;
  label: string;
  description: string;
  entries: number;
  bytes: number;
  unknown: number;
  /** 삭제 후 새로고침이 필요한 자산. */
  warning?: string;
}

export interface LocalUsage {
  keys: number;
  bytes: number;
}

interface GroupDef {
  id: string;
  label: string;
  description: string;
  prefixes?: readonly string[];
  /** 캐시 이름이 이 값으로 끝나야 한다. */
  cacheSuffix?: string;
  /** 이 캐시 이름에만 속한다. */
  exactCache?: string;
  approxBytes?: number;
  warning?: string;
}

const GROUPS: readonly GroupDef[] = [
  {
    id: 'bg-model',
    label: '누끼 AI 모델',
    description: '배경 제거 모델 본체',
    exactCache: BG_CACHE,
    prefixes: [BG_MODEL_PREFIX],
    approxBytes: BG_MODEL_APPROX_BYTES,
  },
  {
    id: 'bg-engine',
    label: '누끼 실행 엔진',
    description: 'ONNX 런타임·그래픽 가속',
    exactCache: BG_CACHE,
    prefixes: [BG_ENGINE_PREFIX],
    approxBytes: BG_ENGINE_APPROX_BYTES,
  },
  {
    id: 'ocr',
    label: 'OCR 엔진·언어팩',
    description: '이미지·PDF 글자 인식',
    cacheSuffix: '-assets',
    prefixes: ['/ocr/'],
  },
  {
    id: 'rhwp',
    label: '한글(HWP) 엔진',
    description: '한글 문서 보기·PDF를 HWP로 변환',
    cacheSuffix: '-assets',
    prefixes: ['/rhwp/'],
  },
  {
    id: 'pdfjs',
    label: 'PDF.js 자산',
    description: 'PDF 미리보기·편집',
    cacheSuffix: '-assets',
    prefixes: ['/pdfjs/'],
  },
  {
    id: 'fonts',
    label: '문서 글꼴',
    description: '양식·PDF 나눔고딕',
    cacheSuffix: '-assets',
    prefixes: ['/fonts/'],
  },
  {
    id: 'site-code',
    label: '사이트·도구 코드',
    description: '화면 스크립트·스타일',
    cacheSuffix: '-assets',
    prefixes: ['/_astro/'],
    warning: '삭제 후 새로고침해야 합니다.',
  },
  {
    id: 'site-assets',
    label: '기타 사이트 자산',
    description: '아이콘·매니페스트 등',
    cacheSuffix: '-assets',
    warning: '삭제 후 새로고침해야 합니다.',
  },
  {
    id: 'site-shell',
    label: '사이트 기본 캐시',
    description: '첫 화면·오프라인 셸',
    exactCache: 'officekit-v5',
    warning: '삭제 후 새로고침해야 합니다.',
  },
];

const groupFor = (cacheName: string, path: string): string | null => {
  for (const group of GROUPS) {
    if (group.exactCache && group.exactCache !== cacheName) continue;
    if (group.cacheSuffix && !cacheName.endsWith(group.cacheSuffix)) continue;
    if (group.prefixes && !group.prefixes.some((prefix) => path.startsWith(prefix))) continue;
    return group.id;
  }
  if (cacheName.startsWith('officekit-')) return `cache:${cacheName}`;
  return null;
};

const groupDef = (id: string): GroupDef | null =>
  GROUPS.find((group) => group.id === id) ??
  (id.startsWith('cache:')
    ? {
        id,
        label: '이전 버전 캐시',
        description: id.slice('cache:'.length),
        warning: '삭제 후 새로고침해야 합니다.',
      }
    : null);

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return '—';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export const formatStorageBytes = formatBytes;

export async function listStorageGroups(): Promise<StorageGroup[]> {
  if (typeof caches === 'undefined') return [];
  const names = await caches.keys();
  const accum = new Map<string, { entries: number; bytes: number; unknown: number }>();

  for (const name of names) {
    const cache = await caches.open(name);
    for (const request of await cache.keys()) {
      const path = new URL(request.url).pathname;
      const id = groupFor(name, path);
      if (!id) continue;
      const current = accum.get(id) ?? { entries: 0, bytes: 0, unknown: 0 };
      current.entries += 1;
      const response = await cache.match(request);
      const length = Number(response?.headers.get('content-length') ?? 0);
      if (Number.isFinite(length) && length > 0) {
        current.bytes += length;
      } else if (id === 'bg-model' || id === 'bg-engine') {
        current.unknown += 1;
      } else {
        try {
          current.bytes += (await response?.clone().blob())?.size ?? 0;
        } catch {
          current.unknown += 1;
        }
      }
      accum.set(id, current);
    }
  }

  const result: StorageGroup[] = [];
  for (const [id, usage] of accum) {
    const def = groupDef(id);
    if (!def) continue;
    let bytes = usage.bytes;
    let unknown = usage.unknown;
    if ((id === 'bg-model' || id === 'bg-engine') && bytes === 0 && usage.entries > 0) {
      bytes = def.approxBytes ?? 0;
      unknown = 0;
    }
    result.push({
      id,
      label: def.label,
      description: def.description,
      entries: usage.entries,
      bytes,
      unknown,
      warning: def.warning,
    });
  }

  const order = (group: StorageGroup): number => {
    const index = GROUPS.findIndex((def) => def.id === group.id);
    return index === -1 ? 99 : index;
  };
  return result.sort((a, b) => order(a) - order(b) || a.label.localeCompare(b.label));
}

export async function clearStorageGroup(id: string): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  if (id.startsWith('cache:')) return caches.delete(id.slice('cache:'.length));

  const def = groupDef(id);
  if (!def) return false;
  if (def.exactCache && !def.prefixes) return caches.delete(def.exactCache);

  let removed = false;
  for (const name of await caches.keys()) {
    if (def.exactCache && def.exactCache !== name) continue;
    if (def.cacheSuffix && !name.endsWith(def.cacheSuffix)) continue;
    const cache = await caches.open(name);
    for (const request of await cache.keys()) {
      const path = new URL(request.url).pathname;
      if (groupFor(name, path) !== id) continue;
      await cache.delete(request);
      removed = true;
    }
  }
  return removed;
}

export async function hasBgModel(): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  if (!(await caches.keys()).includes(BG_CACHE)) return false;
  const cache = await caches.open(BG_CACHE);
  for (const request of await cache.keys()) {
    if (new URL(request.url).pathname.startsWith(BG_MODEL_PREFIX)) return true;
  }
  return false;
}

export async function clearBgModel(): Promise<boolean> {
  return clearStorageGroup('bg-model');
}

export function localUsage(): LocalUsage {
  if (typeof localStorage === 'undefined') return { keys: 0, bytes: 0 };
  let keys = 0;
  let bytes = 0;
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith('officekit')) continue;
    const value = localStorage.getItem(key) ?? '';
    keys += 1;
    bytes += (key.length + value.length) * 2;
  }
  return { keys, bytes };
}

/**
 * 서비스 워커가 이 페이지를 제어할 때까지 잠깐 기다린다.
 * 첫 방문에는 설치·활성화가 끝나기 전에 모델 요청이 나가 캐시를 건너뛸 수 있다.
 */
export async function ensureServiceWorkerControl(timeoutMs = 1500): Promise<boolean> {
  if (!import.meta.env.PROD) return false;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  if (navigator.serviceWorker.controller) return true;

  try {
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } catch {
    return false;
  }
  if (navigator.serviceWorker.controller) return true;

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
      resolve(false);
    }, timeoutMs);
    function onChange(): void {
      clearTimeout(timer);
      resolve(true);
    }
    navigator.serviceWorker.addEventListener('controllerchange', onChange, { once: true });
  });
}

export async function storageEstimate(): Promise<StorageEstimate | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  try {
    return await navigator.storage.estimate();
  } catch {
    return null;
  }
}
