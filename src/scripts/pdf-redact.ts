import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import {
  boxFromPoints,
  type RedactionRect,
  rectToPixels,
  redactedPageCount,
  redactionFileName,
  totalBoxes,
} from '@/lib/pdf-redact';

interface Loaded {
  file: File;
  bytes: ArrayBuffer;
  task: PDFDocumentLoadingTask;
  doc: PDFDocumentProxy;
  pageCount: number;
}

const MAX_PAGES = 100;
const RENDER_DPI = 200;

let current: Loaded | null = null;
let pageNumber = 1;
let renderId = 0;
let boxes = new Map<number, RedactionRect[]>();
let resultUrl: string | null = null;
let running = false;
let dragging = false;
let dragStart: { x: number; y: number } | null = null;
let dragCurrent: { x: number; y: number } | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfRedact(): void {
  const input = byId<HTMLInputElement>('rd-input');
  const drop = byId<HTMLElement>('rd-drop');
  const panel = byId<HTMLElement>('rd-panel');
  const fileInfo = byId<HTMLElement>('rd-file-info');
  const canvas = byId<HTMLCanvasElement>('rd-canvas');
  const overlay = byId<HTMLCanvasElement>('rd-overlay');
  const stage = byId<HTMLElement>('rd-stage');
  const previewWrap = byId<HTMLElement>('rd-preview-wrap');
  const previewLabel = byId<HTMLElement>('rd-preview-label');
  const prevButton = byId<HTMLButtonElement>('rd-prev');
  const nextButton = byId<HTMLButtonElement>('rd-next');
  const pageInput = byId<HTMLInputElement>('rd-page');
  const undoButton = byId<HTMLButtonElement>('rd-undo');
  const clearPageButton = byId<HTMLButtonElement>('rd-clear-page');
  const clearAllButton = byId<HTMLButtonElement>('rd-clear-all');
  const applyButton = byId<HTMLButtonElement>('rd-apply');
  const resetButton = byId<HTMLButtonElement>('rd-reset');
  const status = byId<HTMLElement>('rd-status');
  const error = byId<HTMLElement>('rd-error');
  const result = byId<HTMLElement>('rd-result');
  const resultPages = byId<HTMLElement>('rd-result-pages');
  const resultBoxes = byId<HTMLElement>('rd-result-boxes');
  const resultSize = byId<HTMLElement>('rd-result-size');
  const download = byId<HTMLAnchorElement>('rd-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !canvas ||
    !overlay ||
    !stage ||
    !previewWrap ||
    !prevButton ||
    !nextButton ||
    !pageInput ||
    !undoButton ||
    !clearPageButton ||
    !applyButton ||
    !status ||
    !error ||
    !result
  ) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearResult = () => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      resultUrl = null;
    }
    result.hidden = true;
    download?.removeAttribute('href');
    if (download) download.hidden = true;
  };

  const dispose = async () => {
    if (current) {
      try {
        await current.task.destroy();
      } catch {
        // 이미 정리된 문서는 무시한다.
      }
    }
    current = null;
  };

  const pageBoxes = (): RedactionRect[] => boxes.get(pageNumber) ?? [];

  const drawOverlay = () => {
    const context = overlay.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, overlay.width, overlay.height);
    for (const box of pageBoxes()) {
      const pixels = rectToPixels(box, overlay.width, overlay.height);
      context.fillStyle = '#000000';
      context.fillRect(pixels.x, pixels.y, pixels.width, pixels.height);
    }
    if (dragging && dragStart && dragCurrent) {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const width = Math.abs(dragCurrent.x - dragStart.x);
      const height = Math.abs(dragCurrent.y - dragStart.y);
      context.fillStyle = 'rgba(0, 0, 0, 0.75)';
      context.fillRect(x, y, width, height);
      context.strokeStyle = '#cc2222';
      context.lineWidth = 2;
      context.setLineDash([6, 4]);
      context.strokeRect(x, y, width, height);
    }
    if (previewLabel && current) {
      const count = pageBoxes().length;
      previewLabel.textContent = `${pageNumber} / ${current.pageCount}쪽 · 가리기 ${count}개`;
    }
  };

  const renderPage = async () => {
    if (!current) return;
    const id = ++renderId;
    let page: Awaited<ReturnType<PDFDocumentProxy['getPage']>> | null = null;
    try {
      page = await current.doc.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const available = Math.max(280, previewWrap.clientWidth - 24 || 620);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const scale = Math.min(2.5, (available / base.width) * dpr);
      const viewport = page.getViewport({ scale });
      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      overlay.width = canvas.width;
      overlay.height = canvas.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
      await page.render({ canvas, viewport }).promise;
      if (id !== renderId) return;
      const cssWidth = Math.round(viewport.width / dpr);
      const cssHeight = Math.round(viewport.height / dpr);
      stage.style.width = `${cssWidth}px`;
      stage.style.height = `${cssHeight}px`;
      drawOverlay();
      if (pageInput) {
        pageInput.max = String(current.pageCount);
        pageInput.value = String(pageNumber);
      }
      prevButton.disabled = pageNumber <= 1;
      nextButton.disabled = pageNumber >= current.pageCount;
    } catch (cause) {
      console.error(cause);
      showError('페이지를 그리지 못했습니다.');
    } finally {
      page?.cleanup();
    }
  };

  const goToPage = (target: number) => {
    if (!current) return;
    pageNumber = Math.min(current.pageCount, Math.max(1, target));
    void renderPage();
  };

  const pointerPoint = (event: PointerEvent) => {
    const bounds = overlay.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * overlay.width,
      y: ((event.clientY - bounds.top) / bounds.height) * overlay.height,
    };
  };

  overlay.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    dragging = true;
    dragStart = pointerPoint(event);
    dragCurrent = dragStart;
    overlay.setPointerCapture(event.pointerId);
    drawOverlay();
  });

  overlay.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    dragCurrent = pointerPoint(event);
    drawOverlay();
  });

  const finishDrag = () => {
    if (!dragging || !dragStart || !dragCurrent) {
      dragging = false;
      return;
    }
    const box = boxFromPoints(
      dragStart.x,
      dragStart.y,
      dragCurrent.x,
      dragCurrent.y,
      overlay.width,
      overlay.height,
    );
    dragging = false;
    dragStart = null;
    dragCurrent = null;
    if (box) {
      const list = [...pageBoxes(), box];
      boxes.set(pageNumber, list);
      clearResult();
    }
    drawOverlay();
  };

  overlay.addEventListener('pointerup', finishDrag);
  overlay.addEventListener('pointercancel', finishDrag);

  prevButton.addEventListener('click', () => goToPage(pageNumber - 1));
  nextButton.addEventListener('click', () => goToPage(pageNumber + 1));
  pageInput.addEventListener('change', () => goToPage(Number(pageInput.value) || 1));

  undoButton.addEventListener('click', () => {
    const list = [...pageBoxes()];
    list.pop();
    if (list.length === 0) boxes.delete(pageNumber);
    else boxes.set(pageNumber, list);
    clearResult();
    drawOverlay();
  });

  clearPageButton.addEventListener('click', () => {
    boxes.delete(pageNumber);
    clearResult();
    drawOverlay();
  });

  clearAllButton?.addEventListener('click', () => {
    boxes = new Map();
    clearResult();
    drawOverlay();
  });

  const acceptFile = async (file: File) => {
    if (running) return;
    showError('');
    clearResult();
    await dispose();
    const validation = validatePdfSelection([file]);
    if (!validation.ok) {
      showError(validation.errors.join(' '));
      return;
    }

    status.textContent = 'PDF를 여는 중…';
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const bytes = await file.arrayBuffer();
      const task = pdfjs.getDocument({
        data: new Uint8Array(bytes.slice(0)),
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        wasmUrl: '/pdfjs/wasm/',
        iccUrl: '/pdfjs/iccs/',
      });
      const doc = await task.promise;
      if (doc.numPages > MAX_PAGES) {
        await task.destroy();
        showError(`한 번에 최대 ${MAX_PAGES}쪽까지 처리합니다.`);
        status.textContent = '';
        return;
      }
      current = { file, bytes, task, doc, pageCount: doc.numPages };
      boxes = new Map();
      pageNumber = 1;
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${doc.numPages}쪽 · ${formatBytes(file.size)}`;
      }
      panel.hidden = false;
      status.textContent = '가릴 영역을 페이지 위에서 드래그하세요.';
      await renderPage();
    } catch (cause) {
      console.error(cause);
      current = null;
      panel.hidden = true;
      showError('PDF를 열 수 없습니다. 암호가 걸렸거나 손상된 파일인지 확인하세요.');
      status.textContent = '';
    }
  };

  const run = async () => {
    const loaded = current;
    if (!loaded || running) return;
    const count = totalBoxes(boxes);
    if (count === 0) {
      showError('가릴 영역을 하나 이상 지정하세요.');
      return;
    }

    clearResult();
    showError('');
    running = true;
    applyButton.disabled = true;
    applyButton.setAttribute('aria-busy', 'true');
    status.textContent = '가린 페이지를 다시 만드는 중…';

    try {
      const { PDFDocument } = await import('pdf-lib');
      const source = await PDFDocument.load(loaded.bytes.slice(0));
      const output = await PDFDocument.create();
      // 가리기 결과물에는 원본 메타데이터(제목·작성자·주제·키워드)를 옮기지 않는다.
      // 민감 정보가 문서 속성에 남아 그대로 유출되는 경로를 막기 위해서다.
      output.setCreator('옷깃');

      for (let index = 0; index < loaded.pageCount; index += 1) {
        const number = index + 1;
        const list = boxes.get(number) ?? [];
        if (list.length === 0) {
          const copied = await output.copyPages(source, [index]);
          const page = copied[0];
          if (page) output.addPage(page);
          continue;
        }

        status.textContent = `${number}/${loaded.pageCount}쪽 가리는 중…`;
        const page = await loaded.doc.getPage(number);
        const base = page.getViewport({ scale: 1 });
        const scale = RENDER_DPI / 72;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, viewport }).promise;
        page.cleanup();

        context.fillStyle = '#000000';
        for (const box of list) {
          const pixels = rectToPixels(box, canvas.width, canvas.height);
          context.fillRect(pixels.x, pixels.y, pixels.width, pixels.height);
        }

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (value) => {
              if (value) resolve(value);
              else reject(new Error('페이지 이미지를 만들지 못했습니다.'));
            },
            'image/jpeg',
            0.92,
          );
        });
        const embedded = await output.embedJpg(await blob.arrayBuffer());
        const outPage = output.addPage([base.width, base.height]);
        outPage.drawImage(embedded, {
          x: 0,
          y: 0,
          width: base.width,
          height: base.height,
        });
      }

      const bytes = await output.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = redactionFileName(loaded.file.name);
        download.textContent = `가린 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultPages)
        resultPages.textContent = `${redactedPageCount(boxes)} / ${loaded.pageCount}쪽`;
      if (resultBoxes) resultBoxes.textContent = `${count}개`;
      if (resultSize) resultSize.textContent = formatBytes(blob.size);
      status.textContent = `${count}개 영역을 가렸습니다. 가린 페이지는 이미지로 대체되어 텍스트가 남지 않습니다.`;
      result.hidden = false;
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError('가리기를 적용하지 못했습니다. 암호가 걸린 PDF인지 확인하세요.');
      status.textContent = '';
    } finally {
      running = false;
      applyButton.disabled = false;
      applyButton.removeAttribute('aria-busy');
    }
  };

  applyButton.addEventListener('click', () => void doWork(applyButton, run));

  resetButton?.addEventListener('click', () => {
    void dispose();
    clearResult();
    boxes = new Map();
    panel.hidden = true;
    status.textContent = '';
    showError('');
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
    if (file) void acceptFile(file);
  });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void acceptFile(file);
    input.value = '';
  });

  window.addEventListener('resize', () => void drawOverlay());
  window.addEventListener('pagehide', () => void dispose());
}
