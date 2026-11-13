import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { rotateCanvas } from '@/lib/canvas-rotate';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import {
  anchorX,
  applyTemplate,
  clampHeaderFont,
  clampHeaderMargin,
  footerBaseline,
  type HeaderFooterFields,
  type HeaderFooterPosition,
  hasAnyPageToken,
  headerBaseline,
  headerFooterFileName,
} from '@/lib/pdf-header-footer';
import { planPages } from '@/lib/pdf-image';
import { displayedSize, normalizeRotation, overlaySize, preRotationFor } from '@/lib/pdf-watermark';

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

function canvasToBlob(canvas: HTMLCanvasElement): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('오버레이를 만들지 못했습니다.'));
        return;
      }
      void blob.arrayBuffer().then(resolve, reject);
    }, 'image/png');
  });
}

export function initPdfHeaderFooter(): void {
  const input = byId<HTMLInputElement>('hf-input');
  const drop = byId<HTMLElement>('hf-drop');
  const panel = byId<HTMLElement>('hf-panel');
  const fileInfo = byId<HTMLElement>('hf-file-info');
  const canvas = byId<HTMLCanvasElement>('hf-canvas');
  const previewWrap = byId<HTMLElement>('hf-preview-wrap');
  const previewLabel = byId<HTMLElement>('hf-preview-label');
  const fields: Record<keyof HeaderFooterFields, HTMLInputElement | null> = {
    headerLeft: byId('hf-header-left'),
    headerCenter: byId('hf-header-center'),
    headerRight: byId('hf-header-right'),
    footerLeft: byId('hf-footer-left'),
    footerCenter: byId('hf-footer-center'),
    footerRight: byId('hf-footer-right'),
  };
  const sizeRange = byId<HTMLInputElement>('hf-size');
  const sizeValue = byId<HTMLElement>('hf-size-value');
  const marginRange = byId<HTMLInputElement>('hf-margin');
  const marginValue = byId<HTMLElement>('hf-margin-value');
  const colorInput = byId<HTMLInputElement>('hf-color');
  const lineInput = byId<HTMLInputElement>('hf-line');
  const rangeInput = byId<HTMLInputElement>('hf-range');
  const applyButton = byId<HTMLButtonElement>('hf-apply');
  const resetButton = byId<HTMLButtonElement>('hf-reset');
  const status = byId<HTMLElement>('hf-status');
  const error = byId<HTMLElement>('hf-error');
  const result = byId<HTMLElement>('hf-result');
  const resultPages = byId<HTMLElement>('hf-result-pages');
  const resultSize = byId<HTMLElement>('hf-result-size');
  const download = byId<HTMLAnchorElement>('hf-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !canvas ||
    !previewWrap ||
    !sizeRange ||
    !marginRange ||
    !colorInput ||
    !rangeInput ||
    !applyButton ||
    !status ||
    !error ||
    !result
  ) {
    return;
  }

  const settings = () => {
    const fieldsValue: HeaderFooterFields = {
      headerLeft: fields.headerLeft?.value ?? '',
      headerCenter: fields.headerCenter?.value ?? '',
      headerRight: fields.headerRight?.value ?? '',
      footerLeft: fields.footerLeft?.value ?? '',
      footerCenter: fields.footerCenter?.value ?? '',
      footerRight: fields.footerRight?.value ?? '',
    };
    return {
      fields: fieldsValue,
      size: clampHeaderFont(Number(sizeRange.value)),
      margin: clampHeaderMargin(Number(marginRange.value)),
      color: colorInput.value || '#333333',
      line: lineInput?.checked ?? false,
      range: rangeInput.value,
    };
  };

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

  const drawTextRow = (
    context: CanvasRenderingContext2D,
    values: { left: string; center: string; right: string },
    width: number,
    baseline: number,
    margin: number,
    color: string,
  ) => {
    const positions: Array<[HeaderFooterPosition, string]> = [
      ['left', values.left],
      ['center', values.center],
      ['right', values.right],
    ];
    context.fillStyle = color;
    context.textBaseline = 'alphabetic';
    for (const [position, text] of positions) {
      if (!text) continue;
      context.textAlign = position;
      const x = anchorX(position, width, context.measureText(text).width, margin);
      context.fillText(text, x, baseline);
    }
  };

  const drawOverlay = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    page: number,
    total: number,
    scale: number,
  ) => {
    const config = settings();
    const fontSize = config.size * scale;
    const margin = config.margin * scale;
    context.font = `600 ${fontSize}px 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif`;

    drawTextRow(
      context,
      {
        left: applyTemplate(config.fields.headerLeft, page, total),
        center: applyTemplate(config.fields.headerCenter, page, total),
        right: applyTemplate(config.fields.headerRight, page, total),
      },
      width,
      headerBaseline(margin, fontSize),
      margin,
      config.color,
    );
    drawTextRow(
      context,
      {
        left: applyTemplate(config.fields.footerLeft, page, total),
        center: applyTemplate(config.fields.footerCenter, page, total),
        right: applyTemplate(config.fields.footerRight, page, total),
      },
      width,
      footerBaseline(height, margin),
      margin,
      config.color,
    );

    if (config.line) {
      context.strokeStyle = config.color;
      context.globalAlpha = 0.4;
      context.lineWidth = Math.max(1, scale);
      const topLine = margin + fontSize + 4 * scale;
      const bottomLine = height - margin - fontSize - 4 * scale;
      context.beginPath();
      context.moveTo(margin, topLine);
      context.lineTo(width - margin, topLine);
      context.moveTo(margin, bottomLine);
      context.lineTo(width - margin, bottomLine);
      context.stroke();
      context.globalAlpha = 1;
    }
  };

  const renderPreview = async () => {
    if (!current) return;
    if (previewBusy) {
      previewPending = true;
      return;
    }
    previewBusy = true;
    const id = ++previewRun;
    const config = settings();
    const plan = planPages(config.range, current.pageCount);
    if (plan.errors.length > 0) {
      previewBusy = false;
      showError(plan.errors.join(' '));
      return;
    }
    let page: Awaited<ReturnType<PDFDocumentProxy['getPage']>> | null = null;

    try {
      const pageNumber = plan.pages[0] ?? 1;
      page = await current.doc.getPage(pageNumber);
      if (id !== previewRun) return;
      const base = page.getViewport({ scale: 1 });
      const available = Math.max(300, previewWrap.clientWidth - 24 || 640);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const scale = Math.min(2.5, (available / base.width) * dpr);
      const viewport = page.getViewport({ scale });
      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
      await page.render({ canvas, viewport }).promise;
      if (id !== previewRun) return;

      const pxPerPt = viewport.width / base.width;
      drawOverlay(context, viewport.width, viewport.height, pageNumber, current.pageCount, pxPerPt);

      if (previewLabel) {
        previewLabel.textContent =
          rangeInput.value.trim() === ''
            ? `${pageNumber}쪽 미리보기 · 전체 ${current.pageCount}쪽`
            : `${pageNumber}쪽 미리보기 · ${plan.pages.length}쪽에 적용`;
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
    }, 140);
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
      status.textContent = '머리글·바닥글을 확인한 뒤 적용하세요.';
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
    const config = settings();
    const plan = planPages(config.range, loaded.pageCount);
    if (plan.errors.length > 0) {
      showError(plan.errors.join(' '));
      return;
    }
    const hasContent = Object.values(config.fields).some((value) => value.trim() !== '');
    if (!hasContent) {
      showError('머리글이나 바닥글에 문구를 하나 이상 입력하세요.');
      return;
    }

    clearResult();
    showError('');
    running = true;
    applyButton.disabled = true;
    applyButton.setAttribute('aria-busy', 'true');
    if (resetButton) resetButton.disabled = true;
    status.textContent = '머리글·바닥글을 넣는 중…';

    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(await loaded.file.arrayBuffer());
      const selected = new Set(plan.pages);
      const staticOverlay = !hasAnyPageToken(config.fields);
      const cache = new Map<string, ReturnType<typeof pdfDoc.embedPng>>();

      for (let pageNumber = 1; pageNumber <= loaded.pageCount; pageNumber += 1) {
        if (!selected.has(pageNumber)) continue;
        const page = pdfDoc.getPage(pageNumber - 1);
        const { width, height } = page.getSize();
        const rotation = normalizeRotation(page.getRotation().angle);
        const display = displayedSize(width, height, rotation);
        const px = overlaySize(display.width, display.height);
        const key = `${px.width}x${px.height}|${rotation}`;

        let embedded = staticOverlay ? cache.get(key) : undefined;
        if (!embedded) {
          const overlay = window.document.createElement('canvas');
          overlay.width = px.width;
          overlay.height = px.height;
          const context = overlay.getContext('2d');
          if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
          const scale = px.width / display.width;
          drawOverlay(context, px.width, px.height, pageNumber, loaded.pageCount, scale);
          const rotated = rotateCanvas(overlay, preRotationFor(rotation));
          embedded = pdfDoc.embedPng(await canvasToBlob(rotated));
          if (staticOverlay) cache.set(key, embedded);
        }
        page.drawImage(await embedded, { x: 0, y: 0, width, height });
        status.textContent = `${pageNumber}/${loaded.pageCount}쪽 처리 중…`;
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = headerFooterFileName(loaded.file.name);
        download.textContent = `머리글·바닥글 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultPages) resultPages.textContent = `${plan.pages.length} / ${loaded.pageCount}쪽`;
      if (resultSize) resultSize.textContent = formatBytes(blob.size);
      status.textContent = `${plan.pages.length}쪽에 머리글·바닥글을 넣었습니다.`;
      result.hidden = false;
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError('머리글·바닥글을 넣지 못했습니다. 암호가 걸린 PDF인지 확인하세요.');
      status.textContent = '';
    } finally {
      running = false;
      applyButton.disabled = false;
      applyButton.removeAttribute('aria-busy');
      if (resetButton) resetButton.disabled = false;
    }
  };

  const updateLabels = () => {
    if (sizeValue) sizeValue.textContent = `${sizeRange.value}pt`;
    if (marginValue) marginValue.textContent = `${marginRange.value}pt`;
  };

  for (const control of [
    ...Object.values(fields),
    sizeRange,
    marginRange,
    colorInput,
    lineInput,
    rangeInput,
  ]) {
    control?.addEventListener('input', () => {
      updateLabels();
      schedulePreview();
    });
    control?.addEventListener('change', () => {
      updateLabels();
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

  updateLabels();
}
