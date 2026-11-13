import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import { planPages } from '@/lib/pdf-image';
import {
  anchorFor,
  clampNumberMargin,
  clampNumberSize,
  clampStartNumber,
  type PageNumberFormat,
  type PageNumberPosition,
  pageNumberFileName,
  pageNumberLabel,
  pageNumberPlan,
  parseHexColor,
} from '@/lib/pdf-page-number';

interface Loaded {
  file: File;
  task: PDFDocumentLoadingTask;
  doc: PDFDocumentProxy;
  pageCount: number;
}

const MAX_PAGES = 200;

let current: Loaded | null = null;
let resultUrl: string | null = null;
let previewRun = 0;
let previewTimer: number | null = null;
let running = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfPageNumber(): void {
  const input = byId<HTMLInputElement>('pn-input');
  const drop = byId<HTMLElement>('pn-drop');
  const panel = byId<HTMLElement>('pn-panel');
  const fileInfo = byId<HTMLElement>('pn-file-info');
  const previewWrap = byId<HTMLElement>('pn-preview-wrap');
  const canvas = byId<HTMLCanvasElement>('pn-canvas');
  const previewLabel = byId<HTMLElement>('pn-preview-label');
  const positionSelect = byId<HTMLSelectElement>('pn-position');
  const formatSelect = byId<HTMLSelectElement>('pn-format');
  const sizeRange = byId<HTMLInputElement>('pn-size');
  const sizeValue = byId<HTMLElement>('pn-size-value');
  const marginRange = byId<HTMLInputElement>('pn-margin');
  const marginValue = byId<HTMLElement>('pn-margin-value');
  const startInput = byId<HTMLInputElement>('pn-start');
  const rangeInput = byId<HTMLInputElement>('pn-range');
  const colorInput = byId<HTMLInputElement>('pn-color');
  const applyButton = byId<HTMLButtonElement>('pn-apply');
  const resetButton = byId<HTMLButtonElement>('pn-reset');
  const status = byId<HTMLElement>('pn-status');
  const error = byId<HTMLElement>('pn-error');
  const result = byId<HTMLElement>('pn-result');
  const resultPages = byId<HTMLElement>('pn-result-pages');
  const resultSize = byId<HTMLElement>('pn-result-size');
  const download = byId<HTMLAnchorElement>('pn-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !previewWrap ||
    !canvas ||
    !positionSelect ||
    !formatSelect ||
    !sizeRange ||
    !marginRange ||
    !startInput ||
    !rangeInput ||
    !colorInput ||
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

  const settings = () => ({
    position: positionSelect.value as PageNumberPosition,
    format: formatSelect.value as PageNumberFormat,
    size: clampNumberSize(Number(sizeRange.value)),
    margin: clampNumberMargin(Number(marginRange.value)),
    start: clampStartNumber(Number(startInput.value)),
    color: parseHexColor(colorInput.value),
  });

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

      const config = settings();
      const label = pageNumberLabel(pageNumber, current.pageCount, config.format, config.start);
      const previewSize = config.size * scale;
      context.save();
      context.font = `400 ${previewSize}px Helvetica, Arial, sans-serif`;
      context.fillStyle = colorInput.value || '#000000';
      const textWidth = context.measureText(label).width;
      const anchor = anchorFor(
        base.width * scale,
        base.height * scale,
        config.position,
        config.margin * scale,
        textWidth,
        previewSize,
      );
      context.fillText(label, anchor.x, canvas.height - anchor.y);
      context.restore();

      if (previewLabel) {
        previewLabel.textContent =
          rangeInput.value.trim() === ''
            ? `${pageNumber}쪽 미리보기 · 전체 ${current.pageCount}쪽`
            : `${pageNumber}쪽 미리보기 · ${plan.pages.length}쪽에 적용`;
      }
    } catch (cause) {
      if (id !== previewRun) return;
      console.error(cause);
      showError('미리보기를 그리지 못했습니다.');
    } finally {
      page?.cleanup();
    }
  };

  const schedulePreview = () => {
    if (previewTimer !== null) window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => {
      previewTimer = null;
      void renderPreview();
    }, 160);
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
      status.textContent = '위치와 형식을 확인한 뒤 번호를 넣으세요.';
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
    status.textContent = '페이지 번호를 넣는 중…';

    try {
      const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib');
      const output = await PDFDocument.load(await loaded.file.arrayBuffer());
      const font = await output.embedFont(StandardFonts.Helvetica);
      const config = settings();
      const selected = plan.pages;
      const color = rgb(config.color.r, config.color.g, config.color.b);

      for (const pageNumber of selected) {
        const page = output.getPage(pageNumber - 1);
        const label = pageNumberLabel(pageNumber, loaded.pageCount, config.format, config.start);
        const textWidth = font.widthOfTextAtSize(label, config.size);
        const { width, height } = page.getSize();
        const anchor = pageNumberPlan(
          width,
          height,
          page.getRotation().angle,
          config.position,
          config.margin,
          config.size,
          textWidth,
        );
        page.drawText(label, {
          x: anchor.x,
          y: anchor.y,
          size: config.size,
          font,
          color,
          rotate: degrees(anchor.rotate),
        });
      }

      const bytes = await output.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = pageNumberFileName(loaded.file.name);
        download.textContent = `번호가 들어간 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultPages) resultPages.textContent = `${selected.length} / ${loaded.pageCount}쪽`;
      if (resultSize) resultSize.textContent = formatBytes(blob.size);
      status.textContent = `${selected.length}쪽에 번호를 넣었습니다. 원본 텍스트는 그대로입니다.`;
      result.hidden = false;
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError('페이지 번호를 넣지 못했습니다. 암호가 걸린 PDF인지 확인하세요.');
      status.textContent = '';
    } finally {
      running = false;
      applyButton.disabled = false;
      applyButton.removeAttribute('aria-busy');
      if (resetButton) resetButton.disabled = false;
    }
  };

  for (const control of [
    positionSelect,
    formatSelect,
    sizeRange,
    marginRange,
    startInput,
    rangeInput,
    colorInput,
  ]) {
    control.addEventListener('input', () => {
      if (sizeValue) sizeValue.textContent = `${sizeRange.value}pt`;
      if (marginValue) marginValue.textContent = `${marginRange.value}pt`;
      clearResult();
      schedulePreview();
    });
    control.addEventListener('change', () => {
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

  if (sizeValue) sizeValue.textContent = `${sizeRange.value}pt`;
  if (marginValue) marginValue.textContent = `${marginRange.value}pt`;
}
