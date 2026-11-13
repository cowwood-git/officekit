import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import { planPages } from '@/lib/pdf-image';
import {
  displayedSize,
  normalizeRotation,
  overlaySize,
  preRotationFor,
  watermarkFileName,
  watermarkSummary,
} from '@/lib/pdf-watermark';
import { drawWatermark, type WatermarkLayout } from '@/lib/watermark-canvas';

interface Loaded {
  file: File;
  task: PDFDocumentLoadingTask;
  doc: PDFDocumentProxy;
  pageCount: number;
}

const MAX_PAGES = 100;

let current: Loaded | null = null;
let resultUrl: string | null = null;
let previewRun = 0;
let previewTimer: number | null = null;
let running = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('워터마크 이미지를 만들지 못했습니다.'));
    }, 'image/png');
  });
}

/** 캔버스를 지정 각도로 회전한 새 캔버스를 만든다. */
function rotateCanvas(source: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  if (degrees === 0) return source;
  const radians = (degrees * Math.PI) / 180;
  const swap = Math.abs(degrees) === 90;
  const output = document.createElement('canvas');
  output.width = swap ? source.height : source.width;
  output.height = swap ? source.width : source.height;
  const context = output.getContext('2d');
  if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
  context.translate(output.width / 2, output.height / 2);
  context.rotate(radians);
  context.drawImage(source, -source.width / 2, -source.height / 2);
  return output;
}

export function initPdfWatermark(): void {
  const input = byId<HTMLInputElement>('pw-input');
  const drop = byId<HTMLElement>('pw-drop');
  const panel = byId<HTMLElement>('pw-panel');
  const fileInfo = byId<HTMLElement>('pw-file-info');
  const canvas = byId<HTMLCanvasElement>('pw-canvas');
  const previewWrap = byId<HTMLElement>('pw-preview-wrap');
  const previewLabel = byId<HTMLElement>('pw-preview-label');
  const textInput = byId<HTMLInputElement>('pw-text');
  const layoutSelect = byId<HTMLSelectElement>('pw-layout');
  const sizeRange = byId<HTMLInputElement>('pw-size');
  const sizeValue = byId<HTMLElement>('pw-size-value');
  const opacityRange = byId<HTMLInputElement>('pw-opacity');
  const opacityValue = byId<HTMLElement>('pw-opacity-value');
  const colorInput = byId<HTMLInputElement>('pw-color');
  const angleSelect = byId<HTMLSelectElement>('pw-angle');
  const rangeInput = byId<HTMLInputElement>('pw-range');
  const applyButton = byId<HTMLButtonElement>('pw-apply');
  const resetButton = byId<HTMLButtonElement>('pw-reset');
  const status = byId<HTMLElement>('pw-status');
  const error = byId<HTMLElement>('pw-error');
  const result = byId<HTMLElement>('pw-result');
  const resultPages = byId<HTMLElement>('pw-result-pages');
  const resultSize = byId<HTMLElement>('pw-result-size');
  const resultNote = byId<HTMLElement>('pw-result-note');
  const download = byId<HTMLAnchorElement>('pw-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !canvas ||
    !previewWrap ||
    !textInput ||
    !sizeRange ||
    !opacityRange ||
    !colorInput ||
    !angleSelect ||
    !layoutSelect ||
    !rangeInput ||
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

  const options = () => ({
    text: textInput.value,
    sizePercent: Number(sizeRange.value) || 6,
    opacity: Number(opacityRange.value) / 100,
    color: colorInput.value || '#cc2222',
    angle: Number(angleSelect.value) || 0,
    layout: (layoutSelect.value as WatermarkLayout) ?? 'tile',
    shadow: false,
  });

  const clearResult = () => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      resultUrl = null;
    }
    result.hidden = true;
    download?.removeAttribute('href');
    if (download) download.hidden = true;
    if (resultNote) resultNote.hidden = true;
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
    const id = ++previewRun;
    const plan = planPages(rangeInput.value, current.pageCount);
    if (plan.errors.length > 0) {
      showError(plan.errors.join(' '));
      return;
    }
    showError('');

    const pageNumber = plan.pages[0] ?? 1;
    let page: PDFPageProxy | null = null;
    try {
      page = await current.doc.getPage(pageNumber);
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

      if (typeof window !== 'undefined') {
        drawWatermark(context, { width: canvas.width, height: canvas.height }, options());
      }

      if (previewLabel) {
        if (rangeInput.value.trim() === '') {
          previewLabel.textContent = `${pageNumber}쪽 미리보기 · 전체 ${current.pageCount}쪽`;
        } else if (plan.pages.length > 1) {
          previewLabel.textContent = `${pageNumber}쪽 미리보기 · 총 ${plan.pages.length}쪽에 적용`;
        } else {
          previewLabel.textContent = `${pageNumber}쪽 미리보기`;
        }
      }
    } catch (cause) {
      if (id !== previewRun) return;
      console.error(cause);
      showError('미리보기를 그리지 못했습니다. 다른 페이지 범위로 다시 시도하세요.');
    } finally {
      page?.cleanup();
    }
  };

  const schedulePreview = () => {
    if (previewTimer !== null) window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => {
      previewTimer = null;
      void renderPreview();
    }, 180);
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
        showError(`한 번에 최대 ${MAX_PAGES}쪽까지 처리합니다. 문서를 나눠서 사용하세요.`);
        status.textContent = '';
        return;
      }

      current = { file, task, doc, pageCount: doc.numPages };
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${doc.numPages}쪽 · ${formatBytes(file.size)}`;
      }
      panel.hidden = false;
      status.textContent = '문구와 배치를 확인한 뒤 워터마크를 넣으세요.';
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

    const text = textInput.value.trim();
    if (text === '') {
      showError('워터마크 문구를 입력하세요.');
      textInput.focus();
      return;
    }

    const plan = planPages(rangeInput.value, loaded.pageCount);
    if (plan.errors.length > 0) {
      showError(plan.errors.join(' '));
      return;
    }

    showError('');
    clearResult();
    running = true;
    applyButton.disabled = true;
    applyButton.setAttribute('aria-busy', 'true');
    if (resetButton) resetButton.disabled = true;
    status.textContent = '워터마크를 넣는 중…';

    try {
      const { PDFDocument } = await import('pdf-lib');
      const output = await PDFDocument.load(await loaded.file.arrayBuffer());

      if (output.getPageCount() !== loaded.pageCount) {
        throw new Error('페이지 수가 일치하지 않습니다.');
      }

      const selected = new Set(plan.pages);
      const cache = new Map<string, ReturnType<typeof output.embedPng>>();
      const targets = Array.from({ length: loaded.pageCount }, (_, index) => index + 1).filter(
        (pageNumber) => selected.has(pageNumber),
      );

      for (const pageNumber of targets) {
        const page = output.getPage(pageNumber - 1);
        const { width, height } = page.getSize();
        const rotation = normalizeRotation(page.getRotation().angle);
        const display = displayedSize(width, height, rotation);
        const pixels = overlaySize(display.width, display.height);
        const key = `${pixels.width}x${pixels.height}|${rotation}`;

        let embedded = cache.get(key);
        if (!embedded) {
          const overlay = document.createElement('canvas');
          overlay.width = pixels.width;
          overlay.height = pixels.height;
          const context = overlay.getContext('2d');
          if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
          drawWatermark(context, { width: pixels.width, height: pixels.height }, options());
          const rotated = rotateCanvas(overlay, preRotationFor(rotation));
          embedded = output.embedPng(await (await canvasToBlob(rotated)).arrayBuffer());
          cache.set(key, embedded);
        }

        page.drawImage(await embedded, { x: 0, y: 0, width, height });
        status.textContent = `${pageNumber}/${loaded.pageCount}쪽 처리 중…`;
      }

      const bytes = await output.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);

      if (download) {
        download.href = resultUrl;
        download.download = watermarkFileName(loaded.file.name);
        download.textContent = `워터마크 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultPages) resultPages.textContent = `${targets.length} / ${loaded.pageCount}쪽`;
      if (resultSize) resultSize.textContent = formatBytes(blob.size);
      if (resultNote) {
        resultNote.textContent =
          '원본 텍스트·링크·폼은 그대로 두고 투명 이미지 레이어만 추가했습니다.';
        resultNote.hidden = false;
      }
      if (status) {
        status.textContent = watermarkSummary({
          pageCount: loaded.pageCount,
          appliedCount: targets.length,
          bytes: blob.size,
        });
      }

      result.hidden = false;
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError('워터마크를 넣지 못했습니다. 암호가 걸린 PDF이거나 파일이 손상되었을 수 있습니다.');
      status.textContent = '';
    } finally {
      running = false;
      applyButton.disabled = textInput.value.trim() === '';
      applyButton.removeAttribute('aria-busy');
      if (resetButton) resetButton.disabled = false;
    }
  };

  for (const control of [
    textInput,
    layoutSelect,
    sizeRange,
    opacityRange,
    colorInput,
    angleSelect,
    rangeInput,
  ]) {
    control.addEventListener('input', () => {
      if (sizeValue) sizeValue.textContent = `${sizeRange.value}%`;
      if (opacityValue) opacityValue.textContent = `${opacityRange.value}%`;
      applyButton.disabled = textInput.value.trim() === '';
      clearResult();
      schedulePreview();
    });
  }

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

  if (sizeValue) sizeValue.textContent = `${sizeRange.value}%`;
  if (opacityValue) opacityValue.textContent = `${opacityRange.value}%`;
}
