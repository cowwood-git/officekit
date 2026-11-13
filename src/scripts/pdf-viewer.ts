import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import { clampPage, fitWidthZoom, nextZoom } from '@/lib/pdf-viewer';

/**
 * PDF 뷰어 — 쪽마다 자리만 먼저 잡고, 화면에 들어오는 쪽만 그린다(긴 PDF도 가볍게).
 * 뷰어는 "여는 것이 곧 목적"이라 실행 버튼·진행 체크리스트를 두지 않는다(src/data/work-steps.ts).
 */
const MAX_PAGES = 2000;

interface PageSlot {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  /** 100% 배율의 쪽 크기(pt) */
  width: number;
  height: number;
  /** 그려 둔 배율(바뀌면 다시 그린다) */
  renderedZoom: number;
  rendering: boolean;
}

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfViewer(): void {
  const input = byId<HTMLInputElement>('pv-input');
  const drop = byId<HTMLElement>('pv-drop');
  const panel = byId<HTMLElement>('pv-panel');
  const info = byId<HTMLElement>('pv-info');
  const status = byId<HTMLElement>('pv-status');
  const error = byId<HTMLElement>('pv-error');
  const pages = byId<HTMLElement>('pv-pages');
  const pageInput = byId<HTMLInputElement>('pv-page');
  const pageTotal = byId<HTMLElement>('pv-total');
  const prev = byId<HTMLButtonElement>('pv-prev');
  const next = byId<HTMLButtonElement>('pv-next');
  const zoomOut = byId<HTMLButtonElement>('pv-zoom-out');
  const zoomIn = byId<HTMLButtonElement>('pv-zoom-in');
  const zoomFit = byId<HTMLButtonElement>('pv-fit');
  const zoomLabel = byId<HTMLElement>('pv-zoom');
  const closeButton = byId<HTMLButtonElement>('pv-close');
  if (!input || !drop || !panel || !pages || !status || !error || !pageInput) return;

  let task: PDFDocumentLoadingTask | null = null;
  let doc: PDFDocumentProxy | null = null;
  let slots: PageSlot[] = [];
  let zoom = 1;
  let current = 1;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const renderSlot = async (slot: PageSlot, pageNumber: number) => {
    if (!doc || slot.rendering || slot.renderedZoom === zoom) return;
    slot.rendering = true;
    const target = zoom;
    try {
      const page = await doc.getPage(pageNumber);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: target * ratio });
      const canvas = slot.canvas;
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      await page.render({ canvas, viewport }).promise;
      page.cleanup();
      slot.renderedZoom = target;
    } catch (cause) {
      console.error(cause);
    } finally {
      slot.rendering = false;
    }
    // 그리는 동안 배율이 바뀌었으면 다시 그린다.
    if (slot.renderedZoom !== zoom && !slot.element.hidden) {
      void renderSlot(slot, pageNumber);
    }
  };

  const layout = () => {
    for (const slot of slots) {
      slot.element.style.width = `${Math.round(slot.width * zoom)}px`;
      slot.element.style.aspectRatio = `${slot.width} / ${slot.height}`;
    }
    if (zoomLabel) zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    const slot = slots[current - 1];
    if (slot) void renderSlot(slot, current);
  };

  const currentPage = (): number => current;

  const goTo = (page: number) => {
    const target = clampPage(page, slots.length);
    if (!target) return;
    current = target;
    slots.forEach((slot, index) => {
      slot.element.hidden = index !== target - 1;
    });
    pageInput.value = String(target);
    pages.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const slot = slots[target - 1];
    if (slot) void renderSlot(slot, target);
  };

  const setZoom = (value: number) => {
    if (!doc || Math.abs(value - zoom) < 1e-6) return;
    const keep = currentPage();
    zoom = value;
    layout();
    goTo(keep);
  };

  const close = async () => {
    for (const slot of slots) {
      slot.canvas.width = 0;
      slot.canvas.height = 0;
    }
    slots = [];
    current = 1;
    pages.replaceChildren();
    await task?.destroy();
    task = null;
    doc = null;
    panel.hidden = true;
    drop.hidden = false;
    status.textContent = '';
  };

  const open = async (file: File) => {
    showError('');
    const validation = validatePdfSelection([file]);
    if (!validation.ok) {
      showError(validation.errors.join(' '));
      return;
    }
    await close();
    status.textContent = 'PDF를 여는 중…';
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      task = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        wasmUrl: '/pdfjs/wasm/',
        iccUrl: '/pdfjs/iccs/',
      });
      doc = await task.promise;
      if (doc.numPages > MAX_PAGES) throw new Error(`${MAX_PAGES}쪽이 넘는 PDF는 열 수 없습니다.`);

      // 쪽 크기만 먼저 읽어 자리를 잡는다(그리기는 화면에 들어올 때).
      const fragment = document.createDocumentFragment();
      for (let number = 1; number <= doc.numPages; number += 1) {
        const page = await doc.getPage(number);
        const viewport = page.getViewport({ scale: 1 });
        const element = document.createElement('div');
        element.className = 'pv-page';
        element.dataset.page = String(number);
        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', `${number}쪽`);
        const canvas = document.createElement('canvas');
        element.append(canvas);
        fragment.append(element);
        slots.push({
          element,
          canvas,
          width: viewport.width,
          height: viewport.height,
          renderedZoom: 0,
          rendering: false,
        });
      }
      pages.replaceChildren(fragment);

      drop.hidden = true;
      panel.hidden = false;
      if (info) info.textContent = `${file.name} · ${doc.numPages}쪽 · ${formatBytes(file.size)}`;
      if (pageTotal) pageTotal.textContent = `/ ${doc.numPages}`;
      pageInput.max = String(doc.numPages);
      pageInput.value = '1';
      status.textContent = '';

      zoom = fitWidthZoom(pages.clientWidth, slots[0]?.width ?? 1);
      current = 1;
      slots.forEach((slot, index) => {
        slot.element.hidden = index !== 0;
      });
      layout();
      goTo(1);
    } catch (cause) {
      console.error(cause);
      await close();
      const message =
        cause instanceof Error && /password/i.test(cause.name + cause.message)
          ? '암호가 걸린 PDF는 열 수 없습니다.'
          : cause instanceof Error && cause.message.includes('쪽이 넘는')
            ? cause.message
            : 'PDF를 열 수 없습니다. 파일이 손상되지 않았는지 확인하세요.';
      showError(message);
    }
  };

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void open(file);
    input.value = '';
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
    const file = event.dataTransfer?.files[0];
    if (file) void open(file);
  });

  prev?.addEventListener('click', () => goTo(Math.max(1, currentPage() - 1)));
  next?.addEventListener('click', () => goTo(Math.min(slots.length, currentPage() + 1)));
  pageInput.addEventListener('change', () => {
    const page = clampPage(pageInput.value, slots.length);
    if (page) goTo(page);
  });
  zoomIn?.addEventListener('click', () => setZoom(nextZoom(zoom, 1)));
  zoomOut?.addEventListener('click', () => setZoom(nextZoom(zoom, -1)));
  zoomFit?.addEventListener('click', () =>
    setZoom(fitWidthZoom(pages.clientWidth, slots[currentPage() - 1]?.width ?? 1)),
  );
  closeButton?.addEventListener('click', () => void close());

  // 뷰어 안에서: ←/→ 쪽 이동, +/- 배율
  pages.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'PageDown') next?.click();
    else if (event.key === 'ArrowLeft' || event.key === 'PageUp') prev?.click();
    else if (event.key === '+' || event.key === '=') zoomIn?.click();
    else if (event.key === '-') zoomOut?.click();
    else return;
    event.preventDefault();
  });

  window.addEventListener('pagehide', () => {
    void close();
  });
}
