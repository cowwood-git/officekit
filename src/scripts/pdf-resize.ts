import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import {
  fitPageOnSheet,
  type Orientation,
  type PageSizeId,
  PAGE_SIZES as SIZES,
  sheetSize,
} from '@/lib/pdf-layout';
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
let running = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfResize(): void {
  const input = byId<HTMLInputElement>('pr-input');
  const drop = byId<HTMLElement>('pr-drop');
  const panel = byId<HTMLElement>('pr-panel');
  const fileInfo = byId<HTMLElement>('pr-file-info');
  const canvas = byId<HTMLCanvasElement>('pr-canvas');
  const previewWrap = byId<HTMLElement>('pr-preview-wrap');
  const previewLabel = byId<HTMLElement>('pr-preview-label');
  const sizeSelect = byId<HTMLSelectElement>('pr-size');
  const orientation = byId<HTMLSelectElement>('pr-orientation');
  const marginRange = byId<HTMLInputElement>('pr-margin');
  const marginValue = byId<HTMLElement>('pr-margin-value');
  const applyButton = byId<HTMLButtonElement>('pr-apply');
  const resetButton = byId<HTMLButtonElement>('pr-reset');
  const status = byId<HTMLElement>('pr-status');
  const error = byId<HTMLElement>('pr-error');
  const result = byId<HTMLElement>('pr-result');
  const resultPages = byId<HTMLElement>('pr-result-pages');
  const resultSize = byId<HTMLElement>('pr-result-size');
  const download = byId<HTMLAnchorElement>('pr-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !canvas ||
    !previewWrap ||
    !sizeSelect ||
    !orientation ||
    !marginRange ||
    !applyButton ||
    !status ||
    !error ||
    !result
  ) {
    return;
  }

  for (const [id, size] of Object.entries(SIZES)) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = size.label;
    sizeSelect.append(option);
  }
  sizeSelect.value = 'a4';

  const settings = () => {
    const sizeId = sizeSelect.value as PageSizeId;
    const direction = orientation.value as Orientation;
    const size = sheetSize(sizeId, direction);
    const margin = Math.max(0, Math.min(72, Number(marginRange.value)));
    return { size, margin };
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

  const renderPreview = async () => {
    if (!current) return;
    const id = ++previewRun;
    const { size, margin } = settings();
    let page: Awaited<ReturnType<PDFDocumentProxy['getPage']>> | null = null;

    try {
      page = await current.doc.getPage(1);
      if (id !== previewRun) return;
      const available = Math.max(300, previewWrap.clientWidth - 24 || 620);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const scale = Math.min(2.5, (available / size.width) * dpr);
      canvas.width = Math.max(1, Math.ceil(size.width * scale));
      canvas.height = Math.max(1, Math.ceil(size.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const base = page.getViewport({ scale: 1 });
      const cell = {
        x: margin * scale,
        y: margin * scale,
        width: (size.width - margin * 2) * scale,
        height: (size.height - margin * 2) * scale,
      };
      const fit = Math.min(cell.width / base.width, cell.height / base.height);
      const viewport = page.getViewport({ scale: fit });
      const x = cell.x + (cell.width - viewport.width) / 2;
      const y = cell.y + (cell.height - viewport.height) / 2;

      const offscreen = document.createElement('canvas');
      offscreen.width = Math.max(1, Math.ceil(viewport.width));
      offscreen.height = Math.max(1, Math.ceil(viewport.height));
      await page.render({ canvas: offscreen, viewport }).promise;
      if (id !== previewRun) return;
      context.drawImage(offscreen, x, y, viewport.width, viewport.height);

      if (previewLabel) {
        previewLabel.textContent = `1쪽 미리보기 · ${size.width < size.height ? '세로' : '가로'} ${Math.round(size.width)}×${Math.round(size.height)}pt`;
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
    if (!current) return;
    clearResult();
    showError('');
    void renderPreview();
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
      status.textContent = '새 용지 크기를 확인한 뒤 변환하세요.';
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
    const { size, margin } = settings();
    clearResult();
    showError('');
    running = true;
    applyButton.disabled = true;
    applyButton.setAttribute('aria-busy', 'true');
    if (resetButton) resetButton.disabled = true;
    status.textContent = '페이지 크기를 바꾸는 중…';

    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const source = await PDFDocument.load(await loaded.file.arrayBuffer());
      const output = await PDFDocument.create();
      output.setTitle(source.getTitle() ?? '');
      output.setAuthor(source.getAuthor() ?? '');
      output.setSubject(source.getSubject() ?? '');
      output.setKeywords(
        (source.getKeywords() ?? '')
          .split(/[,;]+/)
          .map((keyword) => keyword.trim())
          .filter(Boolean),
      );
      output.setCreator('옷깃');

      const pageCount = source.getPageCount();
      for (let index = 0; index < pageCount; index += 1) {
        const original = source.getPage(index);
        const sheet = output.addPage([size.width, size.height]);
        const copied = await output.copyPages(source, [index]);
        const copiedPage = copied[0];
        if (!copiedPage) continue;
        const rotation = normalizeRotation(original.getRotation().angle);
        const embedded = await output.embedPage(copiedPage);
        const placement = fitPageOnSheet(
          copiedPage.getWidth(),
          copiedPage.getHeight(),
          rotation,
          size.width,
          size.height,
          margin,
        );
        sheet.drawPage(embedded, {
          x: placement.x,
          y: placement.y,
          width: placement.width,
          height: placement.height,
          rotate: degrees(placement.rotate),
        });
        status.textContent = `${index + 1}/${pageCount}쪽 처리 중…`;
      }

      const bytes = await output.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      const base = loaded.file.name.replace(/\.[^.]+$/, '');
      if (download) {
        download.href = resultUrl;
        download.download = `${base}-${sizeSelect.value}${size.width > size.height ? '-landscape' : ''}.pdf`;
        download.textContent = `크기 변경 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultPages) resultPages.textContent = `${pageCount}쪽`;
      if (resultSize) resultSize.textContent = formatBytes(blob.size);
      status.textContent = `${pageCount}쪽을 ${SIZES[sizeSelect.value as PageSizeId].label} 크기로 바꿨습니다.`;
      result.hidden = false;
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError('페이지 크기를 바꾸지 못했습니다. 암호가 걸린 PDF인지 확인하세요.');
      status.textContent = '';
    } finally {
      running = false;
      applyButton.disabled = false;
      applyButton.removeAttribute('aria-busy');
      if (resetButton) resetButton.disabled = false;
    }
  };

  for (const control of [sizeSelect, orientation, marginRange]) {
    control.addEventListener('input', () => {
      if (marginValue) marginValue.textContent = `${marginRange.value}pt`;
      schedulePreview();
    });
    control.addEventListener('change', schedulePreview);
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

  if (marginValue) marginValue.textContent = `${marginRange.value}pt`;
}
