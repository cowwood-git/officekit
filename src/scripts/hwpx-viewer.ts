import { formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';
import { isHangulFile, isHwpFile } from '@/lib/hwpx';
import { ensureRhwp, loadRhwpModule, type RhwpModule } from '@/lib/rhwp';

type HwpDoc = InstanceType<RhwpModule['HwpDocument']>;
type Purifier = typeof import('dompurify').default;

interface Loaded {
  file: File;
  doc: HwpDoc;
  isHwp: boolean;
  pageCount: number;
  hwpxUrl?: string;
}

let loaded: Loaded | null = null;
let purifier: Purifier | null = null;
let pageIndex = 0;
let layout: 'single' | 'spread' = 'single';
const svgCache = new Map<number, string>();

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initHwpxViewer(): void {
  const input = byId<HTMLInputElement>('hv-input');
  const drop = byId<HTMLElement>('hv-drop');
  const panel = byId<HTMLElement>('hv-panel');
  const info = byId<HTMLElement>('hv-file-info');
  const stage = byId<HTMLElement>('hv-content');
  const layoutSelect = byId<HTMLSelectElement>('hv-layout');
  const stats = {
    current: byId<HTMLElement>('hv-stat-current'),
    total: byId<HTMLElement>('hv-stat-total'),
    view: byId<HTMLElement>('hv-stat-view'),
    format: byId<HTMLElement>('hv-stat-format'),
  };
  const pagePrev = byId<HTMLButtonElement>('hv-prev');
  const pageNext = byId<HTMLButtonElement>('hv-next');
  const pageLabel = byId<HTMLElement>('hv-page-label');
  const status = byId<HTMLElement>('hv-status');
  const error = byId<HTMLElement>('hv-error');
  const clearButton = byId<HTMLButtonElement>('hv-clear');
  const download = byId<HTMLAnchorElement>('hv-hwpx-download');

  if (!input || !drop || !panel || !stage || !status || !error) return;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const updatePager = () => {
    const count = loaded?.pageCount ?? 0;
    const current = count === 0 ? 0 : pageIndex + 1;
    if (pageLabel) {
      pageLabel.textContent =
        loaded && layout === 'spread' && pageIndex + 2 <= count
          ? `${current}–${current + 1} / ${count}`
          : `${current} / ${count}`;
    }
    if (pagePrev) pagePrev.disabled = count === 0 || pageIndex <= 0;
    if (pageNext) {
      const step = layout === 'spread' ? 2 : 1;
      pageNext.disabled = count === 0 || pageIndex + step >= count;
    }
    if (stats.current) {
      stats.current.textContent =
        layout === 'spread' && pageIndex + 2 <= count
          ? `${current}–${current + 1}`
          : String(current);
    }
    if (stats.total) stats.total.textContent = String(count);
    if (stats.view) stats.view.textContent = layout === 'spread' ? '두 쪽' : '한 쪽';
    if (stats.format) stats.format.textContent = loaded?.isHwp ? 'HWP' : 'HWPX';
  };

  const svgFor = (pageNumber: number): string => {
    const cached = svgCache.get(pageNumber);
    if (cached) return cached;
    if (!loaded || !purifier) return '';
    const raw = loaded.doc.renderPageSvg(pageNumber - 1);
    const clean = purifier.sanitize(raw, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
    svgCache.set(pageNumber, clean);
    return clean;
  };

  const renderView = () => {
    if (!loaded) return;
    const count = loaded.pageCount;
    const first = pageIndex + 1;
    const pageNumbers =
      layout === 'spread' ? [first, first + 1].filter((page) => page <= count) : [first];

    stage.replaceChildren();
    stage.dataset.layout = layout;
    for (const pageNumber of pageNumbers) {
      const page = document.createElement('div');
      page.className = 'hwp-svg-page';
      page.dataset.page = String(pageNumber);
      page.innerHTML = svgFor(pageNumber);
      stage.append(page);
    }
    stage.scrollTop = 0;
    updatePager();
  };

  const showPage = (index: number) => {
    if (!loaded) return;
    pageIndex = Math.min(loaded.pageCount - 1, Math.max(0, index));
    renderView();
  };

  const revokeDownload = () => {
    if (loaded?.hwpxUrl) URL.revokeObjectURL(loaded.hwpxUrl);
    if (loaded) loaded.hwpxUrl = undefined;
    if (download) {
      download.hidden = true;
      download.removeAttribute('href');
    }
  };

  const clearDocument = () => {
    revokeDownload();
    if (loaded) {
      loaded.doc.free();
      loaded = null;
    }
    svgCache.clear();
    pageIndex = 0;
    stage.replaceChildren();
    updatePager();
  };

  const load = async (file: File) => {
    showError('');
    clearDocument();
    panel.hidden = true;

    if (!isHangulFile(file.name)) {
      showError('HWP·HWPX 파일만 열 수 있습니다.');
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(`파일이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 더 작은 문서를 사용하세요.`);
      return;
    }

    const isHwp = isHwpFile(file.name);
    status.textContent = isHwp ? 'HWP를 불러와 페이지를 그리는 중…' : 'HWPX 페이지를 그리는 중…';

    try {
      await ensureRhwp();
      const rhwp = await loadRhwpModule();
      const { default: DOMPurify } = await import('dompurify');
      purifier = DOMPurify;

      const doc = new rhwp.HwpDocument(new Uint8Array(await file.arrayBuffer()));
      const pageCount = doc.pageCount();
      if (pageCount < 1) throw new Error('페이지가 없는 문서입니다.');

      loaded = { file, doc, isHwp, pageCount };
      layout = 'single';
      pageIndex = 0;
      if (layoutSelect) layoutSelect.value = 'single';

      if (isHwp) {
        const hwpx = doc.exportHwpx();
        const buffer = new ArrayBuffer(hwpx.byteLength);
        new Uint8Array(buffer).set(hwpx);
        loaded.hwpxUrl = URL.createObjectURL(
          new Blob([buffer], { type: 'application/octet-stream' }),
        );
        if (download) {
          download.href = loaded.hwpxUrl;
          download.download = file.name.replace(/\.hwp$/i, '.hwpx');
          download.hidden = false;
        }
      }

      if (info) {
        info.textContent = `${file.name} · ${formatBytes(file.size)} · ${
          isHwp ? 'HWP → HWPX' : 'HWPX'
        }`;
      }
      panel.hidden = false;
      renderView();
      status.textContent = `${isHwp ? 'HWP를 HWPX로 변환해 ' : ''}${pageCount}쪽을 불러왔습니다. ←/→로 페이지를 넘겨 보세요.`;
    } catch (cause) {
      console.error(cause);
      clearDocument();
      panel.hidden = true;
      status.textContent = '';
      showError(
        cause instanceof Error
          ? cause.message
          : '한글 문서를 읽지 못했습니다. 한글에서 다시 저장한 뒤 시도하세요.',
      );
    }
  };

  layoutSelect?.addEventListener('change', () => {
    layout = layoutSelect.value === 'spread' ? 'spread' : 'single';
    if (layout === 'spread' && pageIndex % 2 !== 0) pageIndex -= 1;
    renderView();
  });

  pagePrev?.addEventListener('click', () => {
    const step = layout === 'spread' ? 2 : 1;
    showPage(pageIndex - step);
  });
  pageNext?.addEventListener('click', () => {
    const step = layout === 'spread' ? 2 : 1;
    showPage(pageIndex + step);
  });

  drop.addEventListener('dragover', (event) => {
    event.preventDefault();
    drop.dataset.drag = 'true';
  });
  drop.addEventListener('dragleave', () => {
    drop.dataset.drag = 'false';
  });
  drop.addEventListener('drop', (event) => {
    event.preventDefault();
    drop.dataset.drag = 'false';
    const file = event.dataTransfer?.files?.[0];
    if (file) void load(file);
  });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void load(file);
    input.value = '';
  });

  clearButton?.addEventListener('click', () => {
    clearDocument();
    panel.hidden = true;
    status.textContent = '';
    showError('');
    input.value = '';
    input.focus();
  });

  window.addEventListener('pagehide', clearDocument);
  updatePager();
}
