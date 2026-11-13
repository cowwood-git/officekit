import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import {
  cellRects,
  gridFor,
  type Orientation,
  type PageSizeId,
  PER_SHEET_OPTIONS,
  type PerSheet,
  paginatePages,
  placePage,
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

export function initPdfNup(): void {
  const input = byId<HTMLInputElement>('nu-input');
  const drop = byId<HTMLElement>('nu-drop');
  const panel = byId<HTMLElement>('nu-panel');
  const fileInfo = byId<HTMLElement>('nu-file-info');
  const canvas = byId<HTMLCanvasElement>('nu-canvas');
  const previewWrap = byId<HTMLElement>('nu-preview-wrap');
  const previewLabel = byId<HTMLElement>('nu-preview-label');
  const perSheet = byId<HTMLSelectElement>('nu-per-sheet');
  const sheetSelect = byId<HTMLSelectElement>('nu-sheet');
  const orientation = byId<HTMLSelectElement>('nu-orientation');
  const marginRange = byId<HTMLInputElement>('nu-margin');
  const marginValue = byId<HTMLElement>('nu-margin-value');
  const gapRange = byId<HTMLInputElement>('nu-gap');
  const gapValue = byId<HTMLElement>('nu-gap-value');
  const applyButton = byId<HTMLButtonElement>('nu-apply');
  const resetButton = byId<HTMLButtonElement>('nu-reset');
  const status = byId<HTMLElement>('nu-status');
  const error = byId<HTMLElement>('nu-error');
  const result = byId<HTMLElement>('nu-result');
  const resultSheets = byId<HTMLElement>('nu-result-sheets');
  const resultSize = byId<HTMLElement>('nu-result-size');
  const download = byId<HTMLAnchorElement>('nu-download');
  const copyButton = byId<HTMLButtonElement>('nu-copy');

  if (
    !input ||
    !drop ||
    !panel ||
    !canvas ||
    !previewWrap ||
    !perSheet ||
    !sheetSelect ||
    !orientation ||
    !marginRange ||
    !gapRange ||
    !applyButton ||
    !status ||
    !error ||
    !result
  ) {
    return;
  }

  for (const item of PER_SHEET_OPTIONS) {
    const option = document.createElement('option');
    option.value = String(item.value);
    option.textContent = item.label;
    perSheet.append(option);
  }
  perSheet.value = '2';

  for (const [id, size] of Object.entries(SIZES)) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = size.label;
    sheetSelect.append(option);
  }
  sheetSelect.value = 'a4';

  const settings = () => {
    const sizeId = sheetSelect.value as PageSizeId;
    const direction = orientation.value as Orientation;
    const size = sheetSize(sizeId, direction);
    const per = Number(perSheet.value) as PerSheet;
    const margin = Math.max(0, Math.min(72, Number(marginRange.value)));
    const gap = Math.max(0, Math.min(48, Number(gapRange.value)));
    const grid = gridFor(per, direction);
    return {
      size,
      per,
      margin,
      gap,
      grid,
      cells: cellRects(size.width, size.height, grid.cols, grid.rows, margin, gap),
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

  const renderPreview = async () => {
    if (!current) return;
    const id = ++previewRun;
    const { size, per, cells } = settings();
    const groups = paginatePages(current.pageCount, per);
    const group = groups[0] ?? [];

    try {
      const available = Math.max(300, previewWrap.clientWidth - 24 || 660);
      const scale = Math.min(
        2,
        (available / size.width) * Math.min(2, window.devicePixelRatio || 1),
      );
      canvas.width = Math.max(1, Math.ceil(size.width * scale));
      canvas.height = Math.max(1, Math.ceil(size.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (let index = 0; index < group.length; index += 1) {
        const pageNumber = group[index];
        if (pageNumber === undefined) continue;
        const page = await current.doc.getPage(pageNumber + 1);
        if (id !== previewRun) {
          page.cleanup();
          return;
        }
        const cell = cells[index];
        if (!cell) {
          page.cleanup();
          continue;
        }
        const base = page.getViewport({ scale: 1 });
        const cellWidth = cell.width * scale;
        const cellHeight = cell.height * scale;
        const fit = Math.min(cellWidth / base.width, cellHeight / base.height);
        const viewport = page.getViewport({ scale: fit });
        const x = cell.x * scale + (cellWidth - viewport.width) / 2;
        const y = (size.height - cell.y - cell.height) * scale + (cellHeight - viewport.height) / 2;

        context.fillStyle = '#ffffff';
        context.fillRect(
          cell.x * scale,
          (size.height - cell.y - cell.height) * scale,
          cellWidth,
          cellHeight,
        );
        const offscreen = document.createElement('canvas');
        offscreen.width = Math.max(1, Math.ceil(viewport.width));
        offscreen.height = Math.max(1, Math.ceil(viewport.height));
        await page.render({ canvas: offscreen, viewport }).promise;
        context.drawImage(offscreen, x, y, viewport.width, viewport.height);
        page.cleanup();
      }

      if (previewLabel) {
        previewLabel.textContent = `1 / ${groups.length}장 미리보기 · ${current.pageCount}쪽`;
      }
    } catch (cause) {
      if (id !== previewRun) return;
      console.error(cause);
      showError('미리보기를 그리지 못했습니다.');
    }
  };

  const schedulePreview = () => {
    if (!current) return;
    showError('');
    clearResult();
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
      status.textContent = '배치를 확인한 뒤 모아찍기 PDF를 만드세요.';
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
    clearResult();
    showError('');
    running = true;
    applyButton.disabled = true;
    applyButton.setAttribute('aria-busy', 'true');
    if (resetButton) resetButton.disabled = true;
    status.textContent = '모아찍기 PDF를 만드는 중…';

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

      const groups = paginatePages(loaded.pageCount, config.per);
      for (const group of groups) {
        const sheet = output.addPage([config.size.width, config.size.height]);
        const copied = await output.copyPages(source, group);
        for (let index = 0; index < copied.length; index += 1) {
          const copiedPage = copied[index];
          const original = source.getPage(group[index] ?? 0);
          const rotation = normalizeRotation(original.getRotation().angle);
          const cell = config.cells[index];
          if (!copiedPage || !cell) continue;
          const embedded = await output.embedPage(copiedPage);
          const placement = placePage(
            copiedPage.getWidth(),
            copiedPage.getHeight(),
            rotation,
            cell,
          );
          sheet.drawPage(embedded, {
            x: placement.x,
            y: placement.y,
            width: placement.width,
            height: placement.height,
            rotate: degrees(placement.rotate),
          });
        }
      }

      const bytes = await output.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      const base = loaded.file.name.replace(/\.[^.]+$/, '');
      if (download) {
        download.href = resultUrl;
        download.download = `${base}-${config.per}up.pdf`;
        download.textContent = `모아찍기 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultSheets) resultSheets.textContent = `${groups.length}장`;
      if (resultSize) resultSize.textContent = formatBytes(blob.size);
      status.textContent = `${loaded.pageCount}쪽을 ${groups.length}장으로 모았습니다.`;
      result.hidden = false;
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError('모아찍기 PDF를 만들지 못했습니다. 암호가 걸린 PDF인지 확인하세요.');
      status.textContent = '';
    } finally {
      running = false;
      applyButton.disabled = false;
      applyButton.removeAttribute('aria-busy');
      if (resetButton) resetButton.disabled = false;
    }
  };

  for (const control of [perSheet, sheetSelect, orientation, marginRange, gapRange]) {
    control.addEventListener('input', () => {
      if (marginValue) marginValue.textContent = `${marginRange.value}pt`;
      if (gapValue) gapValue.textContent = `${gapRange.value}pt`;
      schedulePreview();
    });
    control.addEventListener('change', schedulePreview);
  }

  copyButton?.addEventListener('click', async () => {
    if (!current) return;
    const config = settings();
    const groups = paginatePages(current.pageCount, config.per);
    try {
      await navigator.clipboard.writeText(
        `${current.file.name}: ${current.pageCount}쪽 → ${groups.length}장 (한 장에 ${config.per}쪽)`,
      );
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '설정 복사';
      }, 1500);
    } catch {
      status.textContent = '자동 복사가 차단되었습니다.';
    }
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

  if (marginValue) marginValue.textContent = `${marginRange.value}pt`;
  if (gapValue) gapValue.textContent = `${gapRange.value}pt`;
}
