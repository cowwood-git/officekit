import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import { cropBoxFor, cropFileName, croppedDisplaySize, mmToPt, ptToMm } from '@/lib/pdf-crop';
import { normalizeRotation } from '@/lib/pdf-watermark';

interface Loaded {
  file: File;
  task: PDFDocumentLoadingTask;
  doc: PDFDocumentProxy;
  pageCount: number;
}

const MAX_PAGES = 300;

let current: Loaded | null = null;
let resultUrl: string | null = null;
let previewRun = 0;
let previewBusy = false;
let previewPending = false;
let previewTimer: number | null = null;
let running = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfCrop(): void {
  const input = byId<HTMLInputElement>('pc-input');
  const drop = byId<HTMLElement>('pc-drop');
  const panel = byId<HTMLElement>('pc-panel');
  const fileInfo = byId<HTMLElement>('pc-file-info');
  const canvas = byId<HTMLCanvasElement>('pc-canvas');
  const previewWrap = byId<HTMLElement>('pc-preview-wrap');
  const previewLabel = byId<HTMLElement>('pc-preview-label');
  const topInput = byId<HTMLInputElement>('pc-top');
  const rightInput = byId<HTMLInputElement>('pc-right');
  const bottomInput = byId<HTMLInputElement>('pc-bottom');
  const leftInput = byId<HTMLInputElement>('pc-left');
  const presetButtons = byId<HTMLElement>('pc-presets');
  const applyButton = byId<HTMLButtonElement>('pc-apply');
  const resetButton = byId<HTMLButtonElement>('pc-reset');
  const status = byId<HTMLElement>('pc-status');
  const error = byId<HTMLElement>('pc-error');
  const result = byId<HTMLElement>('pc-result');
  const resultSize = byId<HTMLElement>('pc-result-size');
  const resultPages = byId<HTMLElement>('pc-result-pages');
  const download = byId<HTMLAnchorElement>('pc-download');
  const resetMargins = byId<HTMLButtonElement>('pc-reset-margins');

  if (
    !input ||
    !drop ||
    !panel ||
    !canvas ||
    !previewWrap ||
    !topInput ||
    !rightInput ||
    !bottomInput ||
    !leftInput ||
    !applyButton ||
    !status ||
    !error ||
    !result
  ) {
    return;
  }

  const margins = () => ({
    top: mmToPt(Number(topInput.value) || 0),
    right: mmToPt(Number(rightInput.value) || 0),
    bottom: mmToPt(Number(bottomInput.value) || 0),
    left: mmToPt(Number(leftInput.value) || 0),
  });

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

  const renderPreview = async () => {
    if (!current) return;
    if (previewBusy) {
      previewPending = true;
      return;
    }
    previewBusy = true;
    const id = ++previewRun;
    let page: Awaited<ReturnType<PDFDocumentProxy['getPage']>> | null = null;

    try {
      page = await current.doc.getPage(1);
      if (id !== previewRun) return;
      const base = page.getViewport({ scale: 1 });
      const available = Math.max(280, previewWrap.clientWidth - 24 || 620);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const scale = Math.min(2.5, (available / base.width) * dpr);
      const viewport = page.getViewport({ scale });
      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
      await page.render({ canvas, viewport }).promise;
      if (id !== previewRun) return;

      const m = margins();
      const pxPerPt = viewport.width / base.width;
      const crop = {
        x: m.left * pxPerPt,
        y: m.top * pxPerPt,
        width: Math.max(1, viewport.width - (m.left + m.right) * pxPerPt),
        height: Math.max(1, viewport.height - (m.top + m.bottom) * pxPerPt),
      };

      context.save();
      context.fillStyle = 'rgba(17, 24, 39, 0.48)';
      context.fillRect(0, 0, viewport.width, crop.y);
      context.fillRect(
        0,
        crop.y + crop.height,
        viewport.width,
        viewport.height - crop.y - crop.height,
      );
      context.fillRect(0, crop.y, crop.x, crop.height);
      context.fillRect(
        crop.x + crop.width,
        crop.y,
        viewport.width - crop.x - crop.width,
        crop.height,
      );
      context.strokeStyle = '#cc2222';
      context.lineWidth = 2;
      context.setLineDash([7, 4]);
      context.strokeRect(crop.x, crop.y, crop.width, crop.height);
      context.restore();

      const displayed = croppedDisplaySize(normalizeRotation(page.rotate), {
        x: m.left,
        y: m.bottom,
        width: base.width - m.left - m.right,
        height: base.height - m.top - m.bottom,
      });
      if (previewLabel) {
        previewLabel.textContent = `1쪽 미리보기 · 새 크기 ${ptToMm(displayed.width).toFixed(1)}×${ptToMm(displayed.height).toFixed(1)}mm`;
      }
    } catch (cause) {
      if (id !== previewRun) return;
      console.error(cause);
      showError('미리보기를 그리지 못했습니다.');
    } finally {
      page?.cleanup();
      previewBusy = false;
      if (previewPending) {
        previewPending = false;
        void renderPreview();
      }
    }
  };

  const schedulePreview = () => {
    if (!current) return;
    clearResult();
    showError('');
    if (previewTimer !== null) window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => {
      previewTimer = null;
      void renderPreview();
    }, 120);
  };

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
      const task = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
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
      current = { file, task, doc, pageCount: doc.numPages };
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${doc.numPages}쪽 · ${formatBytes(file.size)}`;
      }
      panel.hidden = false;
      status.textContent = '자를 여백을 확인한 뒤 적용하세요.';
      await renderPreview();
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
    const m = margins();
    clearResult();
    showError('');
    running = true;
    applyButton.disabled = true;
    applyButton.setAttribute('aria-busy', 'true');
    if (resetButton) resetButton.disabled = true;
    status.textContent = '여백을 자르는 중…';

    try {
      const { PDFDocument } = await import('pdf-lib');
      const document = await PDFDocument.load(await loaded.file.arrayBuffer());
      const pages = document.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        const rotation = normalizeRotation(page.getRotation().angle);
        const box = cropBoxFor(width, height, rotation, m);
        page.setCropBox(box.x, box.y, box.width, box.height);
        page.setMediaBox(box.x, box.y, box.width, box.height);
      }

      const bytes = await document.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = cropFileName(loaded.file.name);
        download.textContent = `잘라낸 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultPages) resultPages.textContent = `${pages.length}쪽`;
      if (resultSize) resultSize.textContent = formatBytes(blob.size);
      status.textContent = `${pages.length}쪽의 여백을 잘랐습니다.`;
      result.hidden = false;
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError('여백을 자르지 못했습니다. 암호가 걸린 PDF인지 확인하세요.');
      status.textContent = '';
    } finally {
      running = false;
      applyButton.disabled = false;
      applyButton.removeAttribute('aria-busy');
      if (resetButton) resetButton.disabled = false;
    }
  };

  for (const control of [topInput, rightInput, bottomInput, leftInput]) {
    control.addEventListener('input', schedulePreview);
    control.addEventListener('change', schedulePreview);
  }

  presetButtons?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const value = target.dataset.margin;
    if (value === undefined) return;
    topInput.value = value;
    rightInput.value = value;
    bottomInput.value = value;
    leftInput.value = value;
    schedulePreview();
  });

  resetMargins?.addEventListener('click', () => {
    topInput.value = '0';
    rightInput.value = '0';
    bottomInput.value = '0';
    leftInput.value = '0';
    schedulePreview();
  });

  applyButton.addEventListener('click', () => void doWork(applyButton, run));

  resetButton?.addEventListener('click', () => {
    void dispose();
    clearResult();
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

  window.addEventListener('resize', schedulePreview);
  window.addEventListener('pagehide', () => void dispose());
}
