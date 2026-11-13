import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { rotateCanvas } from '@/lib/canvas-rotate';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import {
  clampSignatureRect,
  DEFAULT_SIGNATURE_RECT,
  type NormalizedRect,
  signatureFileName,
  transparentBounds,
} from '@/lib/pdf-sign';
import { displayedSize, normalizeRotation, overlaySize, preRotationFor } from '@/lib/pdf-watermark';

type Target = 'last' | 'all' | 'custom';

interface Loaded {
  file: File;
  task: PDFDocumentLoadingTask;
  doc: PDFDocumentProxy;
  pageCount: number;
}

let current: Loaded | null = null;
let signatureBitmap: ImageBitmap | null = null;
let resultUrl: string | null = null;
let rect: NormalizedRect = { ...DEFAULT_SIGNATURE_RECT };
let previewAspect = 595.28 / 841.89;
let previewRun = 0;
let previewBusy = false;
let previewPending = false;
let previewTimer: number | null = null;
let dragging = false;
let dragOffset = { x: 0, y: 0 };
let running = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('서명 이미지를 만들지 못했습니다.'));
    }, 'image/png');
  });
}

async function trimBitmap(bitmap: ImageBitmap): Promise<ImageBitmap> {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return bitmap;
  context.drawImage(bitmap, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const bounds = transparentBounds(imageData.data, canvas.width, canvas.height);
  if (!bounds || (bounds.width === canvas.width && bounds.height === canvas.height)) {
    return bitmap;
  }
  const cropped = document.createElement('canvas');
  cropped.width = bounds.width;
  cropped.height = bounds.height;
  const croppedContext = cropped.getContext('2d');
  if (!croppedContext) return bitmap;
  croppedContext.drawImage(
    bitmap,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height,
  );
  return createImageBitmap(cropped);
}

export function initPdfSign(): void {
  const input = byId<HTMLInputElement>('ps-input');
  const drop = byId<HTMLElement>('ps-drop');
  const panel = byId<HTMLElement>('ps-panel');
  const fileInfo = byId<HTMLElement>('ps-file-info');
  const canvas = byId<HTMLCanvasElement>('ps-canvas');
  const previewWrap = byId<HTMLElement>('ps-preview-wrap');
  const previewLabel = byId<HTMLElement>('ps-preview-label');
  const signatureCanvas = byId<HTMLCanvasElement>('ps-draw');
  const signatureInput = byId<HTMLInputElement>('ps-signature-input');
  const sourceTabs = byId<HTMLElement>('ps-source-tabs');
  const drawPanel = byId<HTMLElement>('ps-draw-panel');
  const uploadPanel = byId<HTMLElement>('ps-upload-panel');
  const penColor = byId<HTMLInputElement>('ps-pen-color');
  const penWidth = byId<HTMLInputElement>('ps-pen-width');
  const clearButton = byId<HTMLButtonElement>('ps-clear-draw');
  const sizeRange = byId<HTMLInputElement>('ps-size');
  const sizeValue = byId<HTMLElement>('ps-size-value');
  const opacityRange = byId<HTMLInputElement>('ps-opacity');
  const opacityValue = byId<HTMLElement>('ps-opacity-value');
  const targetSelect = byId<HTMLSelectElement>('ps-target');
  const pageInput = byId<HTMLInputElement>('ps-page');
  const applyButton = byId<HTMLButtonElement>('ps-apply');
  const resetButton = byId<HTMLButtonElement>('ps-reset');
  const status = byId<HTMLElement>('ps-status');
  const error = byId<HTMLElement>('ps-error');
  const result = byId<HTMLElement>('ps-result');
  const resultPages = byId<HTMLElement>('ps-result-pages');
  const resultSize = byId<HTMLElement>('ps-result-size');
  const download = byId<HTMLAnchorElement>('ps-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !canvas ||
    !previewWrap ||
    !signatureCanvas ||
    !signatureInput ||
    !sourceTabs ||
    !drawPanel ||
    !uploadPanel ||
    !sizeRange ||
    !opacityRange ||
    !targetSelect ||
    !pageInput ||
    !applyButton ||
    !status ||
    !error ||
    !result
  ) {
    return;
  }

  const drawContext = signatureCanvas.getContext('2d');
  let drawing = false;
  let lastPoint: { x: number; y: number } | null = null;

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

  const targetPage = (): number => {
    const target = targetSelect.value as Target;
    if (target === 'last') return current?.pageCount ?? 1;
    if (target === 'custom') {
      return Math.min(current?.pageCount ?? 1, Math.max(1, Number(pageInput.value) || 1));
    }
    return 1;
  };

  const signSize = () => Number(sizeRange.value) / 100;

  const signatureRect = (): NormalizedRect => {
    if (!signatureBitmap) return rect;
    const width = signSize();
    const height = Math.min(
      0.8,
      (width * signatureBitmap.height) / signatureBitmap.width / previewAspect,
    );
    return clampSignatureRect({ ...rect, width, height });
  };

  const drawSignatureOnPreview = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    if (!signatureBitmap) return;
    const box = signatureRect();
    context.save();
    context.globalAlpha = Number(opacityRange.value) / 100;
    context.drawImage(
      signatureBitmap,
      box.x * width,
      box.y * height,
      box.width * width,
      box.height * height,
    );
    context.globalAlpha = 1;
    context.strokeStyle = 'rgba(204, 34, 34, 0.7)';
    context.setLineDash([5, 4]);
    context.lineWidth = 1;
    context.strokeRect(box.x * width, box.y * height, box.width * width, box.height * height);
    context.restore();
  };

  const renderPreview = async () => {
    if (!current || previewBusy) {
      if (current) previewPending = true;
      return;
    }
    previewBusy = true;
    const id = ++previewRun;
    const pageNumber = targetPage();
    let page: Awaited<ReturnType<PDFDocumentProxy['getPage']>> | null = null;

    try {
      page = await current.doc.getPage(pageNumber);
      if (id !== previewRun) return;
      const base = page.getViewport({ scale: 1 });
      const available = Math.max(300, previewWrap.clientWidth - 24 || 640);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const scale = Math.min(2.5, (available / base.width) * dpr);
      const viewport = page.getViewport({ scale });
      previewAspect = base.width / base.height;
      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
      await page.render({ canvas, viewport }).promise;
      if (id !== previewRun) return;
      drawSignatureOnPreview(context, canvas.width, canvas.height);
      if (previewLabel) {
        previewLabel.textContent = `${pageNumber} / ${current.pageCount}쪽 미리보기 · 서명을 끌어 이동`;
      }
      showError('');
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
    if (previewTimer !== null) window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => {
      previewTimer = null;
      void renderPreview();
    }, 100);
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
      current = { file, task, doc, pageCount: doc.numPages };
      pageInput.max = String(doc.numPages);
      pageInput.value = String(doc.numPages);
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${doc.numPages}쪽 · ${formatBytes(file.size)}`;
      }
      panel.hidden = false;
      status.textContent = '서명을 그리거나 이미지를 올린 뒤 페이지에 배치하세요.';
      await renderPreview();
    } catch (cause) {
      console.error(cause);
      current = null;
      panel.hidden = true;
      showError('PDF를 열 수 없습니다. 암호가 걸렸거나 손상된 파일인지 확인하세요.');
      status.textContent = '';
    }
  };

  const setSignature = async (bitmap: ImageBitmap) => {
    signatureBitmap?.close();
    signatureBitmap = await trimBitmap(bitmap);
    rect = clampSignatureRect(rect);
    applyButton.disabled = false;
    schedulePreview();
  };

  const pointerPosition = (event: PointerEvent) => {
    const bounds = signatureCanvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * signatureCanvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * signatureCanvas.height,
    };
  };

  signatureCanvas.addEventListener('pointerdown', (event) => {
    if (!drawContext) return;
    drawing = true;
    signatureCanvas.setPointerCapture(event.pointerId);
    lastPoint = pointerPosition(event);
  });

  signatureCanvas.addEventListener('pointermove', (event) => {
    if (!drawing || !drawContext || !lastPoint) return;
    const point = pointerPosition(event);
    drawContext.strokeStyle = penColor?.value ?? '#111827';
    drawContext.lineWidth = Number(penWidth?.value ?? 4);
    drawContext.lineCap = 'round';
    drawContext.lineJoin = 'round';
    drawContext.beginPath();
    drawContext.moveTo(lastPoint.x, lastPoint.y);
    drawContext.lineTo(point.x, point.y);
    drawContext.stroke();
    lastPoint = point;
  });

  const finishStroke = async () => {
    if (!drawing) return;
    drawing = false;
    lastPoint = null;
    const bounds = transparentBounds(
      drawContext?.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height).data ??
        new Uint8ClampedArray(0),
      signatureCanvas.width,
      signatureCanvas.height,
    );
    if (!bounds) return;
    const cropped = document.createElement('canvas');
    cropped.width = bounds.width;
    cropped.height = bounds.height;
    const context = cropped.getContext('2d');
    if (!context) return;
    context.drawImage(
      signatureCanvas,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      0,
      0,
      bounds.width,
      bounds.height,
    );
    const blob = await canvasToBlob(cropped);
    await setSignature(await createImageBitmap(blob));
  };

  signatureCanvas.addEventListener('pointerup', () => void finishStroke());
  signatureCanvas.addEventListener('pointercancel', () => void finishStroke());

  sourceTabs.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const mode = target.dataset.source;
    if (mode !== 'draw' && mode !== 'upload') return;
    drawPanel.hidden = mode !== 'draw';
    uploadPanel.hidden = mode !== 'upload';
    for (const button of sourceTabs.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button === target));
    }
  });

  signatureInput.addEventListener('change', async () => {
    const file = signatureInput.files?.[0];
    signatureInput.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('서명 이미지는 PNG·JPG 파일만 사용할 수 있습니다.');
      return;
    }
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      await setSignature(bitmap);
      showError('');
    } catch (cause) {
      console.error(cause);
      showError('서명 이미지를 읽지 못했습니다.');
    }
  });

  clearButton?.addEventListener('click', () => {
    drawContext?.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureBitmap?.close();
    signatureBitmap = null;
    applyButton.disabled = true;
    clearResult();
    schedulePreview();
  });

  const previewPoint = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    };
  };

  canvas.addEventListener('pointerdown', (event) => {
    if (!signatureBitmap) return;
    const point = previewPoint(event);
    const box = signatureRect();
    if (
      point.x < box.x ||
      point.x > box.x + box.width ||
      point.y < box.y ||
      point.y > box.y + box.height
    ) {
      return;
    }
    dragging = true;
    dragOffset = { x: point.x - box.x, y: point.y - box.y };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const point = previewPoint(event);
    const box = signatureRect();
    rect = clampSignatureRect({
      ...box,
      x: point.x - dragOffset.x,
      y: point.y - dragOffset.y,
    });
    clearResult();
    void renderPreview();
  });

  canvas.addEventListener('pointerup', () => {
    dragging = false;
  });

  for (const control of [sizeRange, opacityRange, targetSelect, pageInput]) {
    control.addEventListener('input', () => {
      if (sizeValue) sizeValue.textContent = `${sizeRange.value}%`;
      if (opacityValue) opacityValue.textContent = `${opacityRange.value}%`;
      rect = signatureRect();
      schedulePreview();
    });
    control.addEventListener('change', () => {
      rect = signatureRect();
      schedulePreview();
    });
  }

  pageInput.hidden = true;
  targetSelect.addEventListener('change', () => {
    pageInput.hidden = targetSelect.value !== 'custom';
    schedulePreview();
  });

  const run = async () => {
    const loaded = current;
    if (!loaded || !signatureBitmap || running) return;
    const target = targetSelect.value as Target;
    const selected =
      target === 'all'
        ? Array.from({ length: loaded.pageCount }, (_, index) => index + 1)
        : [targetPage()];
    const config = signatureRect();
    const opacity = Number(opacityRange.value) / 100;

    clearResult();
    showError('');
    running = true;
    applyButton.disabled = true;
    applyButton.setAttribute('aria-busy', 'true');
    status.textContent = '서명을 넣는 중…';

    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(await loaded.file.arrayBuffer());
      const cache = new Map<string, ReturnType<typeof pdfDoc.embedPng>>();

      for (const pageNumber of selected) {
        const page = pdfDoc.getPage(pageNumber - 1);
        const { width, height } = page.getSize();
        const rotation = normalizeRotation(page.getRotation().angle);
        const display = displayedSize(width, height, rotation);
        const px = overlaySize(display.width, display.height);
        const key = `${px.width}x${px.height}|${rotation}`;
        let overlay = cache.get(key);
        if (!overlay) {
          const overlayCanvas = document.createElement('canvas');
          overlayCanvas.width = px.width;
          overlayCanvas.height = px.height;
          const context = overlayCanvas.getContext('2d');
          if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
          const pageHeight = Math.min(
            0.8,
            (config.width * signatureBitmap.height) /
              signatureBitmap.width /
              (display.width / display.height),
          );
          context.globalAlpha = opacity;
          context.drawImage(
            signatureBitmap,
            config.x * px.width,
            config.y * px.height,
            config.width * px.width,
            pageHeight * px.height,
          );
          context.globalAlpha = 1;
          overlay = pdfDoc.embedPng(
            await canvasToBlob(rotateCanvas(overlayCanvas, preRotationFor(rotation))).then((blob) =>
              blob.arrayBuffer(),
            ),
          );
          cache.set(key, overlay);
        }
        page.drawImage(await overlay, { x: 0, y: 0, width, height });
        status.textContent = `${pageNumber}/${loaded.pageCount}쪽 처리 중…`;
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = signatureFileName(loaded.file.name);
        download.textContent = `서명 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultPages) resultPages.textContent = `${selected.length} / ${loaded.pageCount}쪽`;
      if (resultSize) resultSize.textContent = formatBytes(blob.size);
      status.textContent = `${selected.length}쪽에 서명을 넣었습니다.`;
      result.hidden = false;
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError('서명을 넣지 못했습니다. 암호가 걸린 PDF인지 확인하세요.');
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
    signatureBitmap?.close();
    signatureBitmap = null;
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

  if (sizeValue) sizeValue.textContent = `${sizeRange.value}%`;
  if (opacityValue) opacityValue.textContent = `${opacityRange.value}%`;
  applyButton.disabled = true;
}
