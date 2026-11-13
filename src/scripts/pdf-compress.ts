import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { RESULT_EVENT } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import {
  type CompressMethod,
  clampDpi,
  clampQuality,
  compressionRatio,
  MAX_PAGES,
  methodNote,
  type PresetSelection,
  pdfCompressName,
  presetSettings,
  scaleForDpi,
} from '@/lib/pdf-compress';
import type { ShrinkMessage, ShrinkRequest } from './pdf-shrink.worker';

interface Loaded {
  file: File;
  task: PDFDocumentLoadingTask;
  doc: PDFDocumentProxy;
  pageCount: number;
  hasTextLayer: boolean;
}

let current: Loaded | null = null;
let running = false;
let cancelled = false;
let resultUrl: string | null = null;
let worker: Worker | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('페이지를 이미지로 만들지 못했습니다.'));
      },
      'image/jpeg',
      quality,
    );
  });
}

/** 글자를 그대로 두고 사진만 다시 압축한다(MuPDF, 별도 스레드) */
function shrinkInWorker(
  request: ShrinkRequest,
  onProgress: (ratio: number) => void,
): Promise<Uint8Array> {
  worker?.terminate();
  const current = new Worker(new URL('./pdf-shrink.worker.ts', import.meta.url), {
    type: 'module',
  });
  worker = current;
  return new Promise((resolve, reject) => {
    current.addEventListener('message', (event: MessageEvent<ShrinkMessage>) => {
      const message = event.data;
      if (message.type === 'progress') {
        onProgress(message.done / Math.max(1, message.total));
        return;
      }
      current.terminate();
      if (worker === current) worker = null;
      if (message.type === 'done') resolve(message.bytes);
      else reject(new Error(message.message));
    });
    current.addEventListener('error', (event) => {
      current.terminate();
      if (worker === current) worker = null;
      reject(new Error(event.message || '압축 모듈을 불러오지 못했습니다.'));
    });
    current.postMessage(request, [request.bytes.buffer]);
  });
}

function stopWorker(): void {
  worker?.terminate();
  worker = null;
}

export function initPdfCompress(): void {
  const input = byId<HTMLInputElement>('pc-input');
  const drop = byId<HTMLElement>('pc-drop');
  const panel = byId<HTMLElement>('pc-panel');
  const info = byId<HTMLElement>('pc-file-info');
  const note = byId<HTMLElement>('pc-note');
  const preset = byId<HTMLSelectElement>('pc-preset');
  const dpi = byId<HTMLSelectElement>('pc-dpi');
  const quality = byId<HTMLInputElement>('pc-quality');
  const qualityValue = byId<HTMLElement>('pc-quality-value');
  const grayscale = byId<HTMLInputElement>('pc-grayscale');
  const methodInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[name="pc-method"]'),
  );
  const selectedMethod = (): CompressMethod =>
    methodInputs.find((item) => item.checked)?.value === 'raster' ? 'raster' : 'keep';
  const runButton = byId<HTMLButtonElement>('pc-run');
  const cancelButton = byId<HTMLButtonElement>('pc-cancel');
  const resetButton = byId<HTMLButtonElement>('pc-reset');
  const progress = byId<HTMLProgressElement>('pc-progress');
  const status = byId<HTMLElement>('pc-status');
  const error = byId<HTMLElement>('pc-error');
  const result = byId<HTMLElement>('pc-result');
  const outOriginal = byId<HTMLElement>('pc-original');
  const outCompressed = byId<HTMLElement>('pc-compressed');
  const outSaved = byId<HTMLElement>('pc-saved');
  const outPages = byId<HTMLElement>('pc-pages');
  const resultNote = byId<HTMLElement>('pc-result-note');
  const download = byId<HTMLAnchorElement>('pc-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !preset ||
    !runButton ||
    !progress ||
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

  const setProgress = (value: number, label?: string) => {
    progress.hidden = value <= 0 || value >= 1;
    progress.value = Math.min(1, Math.max(0, value));
    if (label) status.textContent = label;
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    result.hidden = true;
    download?.removeAttribute('href');
    if (download) download.hidden = true;
  };

  const syncPreset = () => {
    const value = preset.value as PresetSelection;
    if (value === 'custom') {
      if (dpi) dpi.disabled = false;
      if (quality) quality.disabled = false;
    } else {
      const settings = presetSettings(value);
      if (dpi) {
        dpi.disabled = true;
        dpi.value = String(settings.dpi);
      }
      if (quality) {
        quality.disabled = true;
        quality.value = String(settings.quality);
      }
    }
    if (qualityValue && quality) {
      qualityValue.textContent = `${Math.round(Number(quality.value) * 100)}%`;
    }
  };

  const dispose = async () => {
    if (current) {
      try {
        await current.task.destroy();
      } catch {
        // 이미 종료된 경우 무시
      }
    }
    current = null;
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

      let hasTextLayer = false;
      try {
        const first = await doc.getPage(1);
        const text = await first.getTextContent();
        hasTextLayer = text.items.some(
          (item) => 'str' in item && typeof item.str === 'string' && item.str.trim().length > 0,
        );
        first.cleanup();
      } catch {
        hasTextLayer = false;
      }

      current = { file, task, doc, pageCount: doc.numPages, hasTextLayer };
      if (info) {
        info.textContent = `${file.name} · ${doc.numPages}쪽 · ${formatBytes(file.size)}`;
      }
      panel.hidden = false;
      syncPreset();
      syncMethod();
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
    const method = selectedMethod();
    const limit = MAX_PAGES[method];
    if (loaded.pageCount > limit) {
      showError(`이 방식은 한 번에 최대 ${limit}쪽까지 처리합니다. 더 큰 PDF는 나눠서 압축하세요.`);
      return;
    }

    clearResult();
    showError('');
    running = true;
    cancelled = false;
    runButton.disabled = true;
    runButton.setAttribute('aria-busy', 'true');
    if (cancelButton) cancelButton.hidden = false;
    if (resetButton) resetButton.disabled = true;

    const selectedDpi = clampDpi(Number(dpi?.value ?? 150));
    const selectedQuality = clampQuality(Number(quality?.value ?? 0.75));
    const toGray = grayscale?.checked ?? false;
    const scale = scaleForDpi(selectedDpi);

    setProgress(0.01, '준비 중…');

    try {
      let bytes: Uint8Array;
      if (method === 'keep') {
        setProgress(0.02, '압축 엔진을 불러오는 중…');
        bytes = await shrinkInWorker(
          {
            bytes: new Uint8Array(await loaded.file.arrayBuffer()),
            options: { dpi: selectedDpi, quality: selectedQuality, grayscale: toGray },
          },
          (ratio) => setProgress(Math.max(0.03, ratio * 0.98), '사진을 다시 압축하는 중…'),
        );
      } else {
        bytes = await rasterize(loaded, { scale, quality: selectedQuality, toGray });
      }

      if (cancelled) {
        status.textContent = '중지되었습니다. 압축 파일을 만들지 않았습니다.';
        setProgress(0);
        return;
      }

      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);

      const ratio = compressionRatio(loaded.file.size, blob.size);
      if (outOriginal) outOriginal.textContent = formatBytes(loaded.file.size);
      if (outCompressed) outCompressed.textContent = formatBytes(blob.size);
      if (outSaved) outSaved.textContent = ratio > 0 ? `${ratio}%` : '증가';
      if (outPages) outPages.textContent = `${loaded.pageCount}쪽`;

      if (resultNote) {
        resultNote.hidden = false;
        resultNote.textContent =
          ratio <= 0
            ? method === 'keep'
              ? '줄일 사진이 거의 없어 용량이 줄지 않았습니다. 이미 최적화된 PDF입니다. 원본을 쓰거나, 스캔본이면 “페이지를 이미지로” 방식을 써 보세요.'
              : '원본보다 용량이 줄지 않았습니다. 이미 최적화된 PDF이거나 텍스트 위주 문서일 수 있습니다. 이 경우 원본을 사용하세요.'
            : method === 'keep'
              ? '글자·링크는 그대로이고 사진만 다시 압축했습니다. 원본은 따로 보관하세요.'
              : '페이지가 이미지로 바뀌어 텍스트 검색·복사는 되지 않습니다. 원본은 따로 보관하세요.';
      }

      if (download) {
        download.href = resultUrl;
        download.download = pdfCompressName(loaded.file.name);
        download.textContent = `압축 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }

      result.hidden = false;
      window.dispatchEvent(new CustomEvent(RESULT_EVENT));
      setProgress(0, '완료했습니다. 결과를 확인하세요.');
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      setProgress(0);
      if (!cancelled) {
        const message = cause instanceof Error && /암호/.test(cause.message) ? cause.message : '';
        showError(
          message ||
            '압축 중 문제가 발생했습니다. 해상도를 낮추거나 페이지 수를 줄여 다시 시도하세요.',
        );
      }
      status.textContent = cancelled ? '중지되었습니다. 압축 파일을 만들지 않았습니다.' : '';
    } finally {
      running = false;
      runButton.disabled = false;
      runButton.removeAttribute('aria-busy');
      if (cancelButton) cancelButton.hidden = true;
      if (resetButton) resetButton.disabled = false;
    }
  };

  /** 페이지를 그림으로 다시 그려 묶는다(스캔본 최대 압축용) */
  const rasterize = async (
    loaded: Loaded,
    { scale, quality: jpegQuality, toGray }: { scale: number; quality: number; toGray: boolean },
  ): Promise<Uint8Array> => {
    const { PDFDocument } = await import('pdf-lib');
    const output = await PDFDocument.create();
    output.setTitle('');
    output.setAuthor('');
    output.setSubject('');
    output.setKeywords([]);
    output.setCreator('');

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: toGray });
    if (!context) throw new Error('캔버스를 사용할 수 없습니다.');

    for (let pageNumber = 1; pageNumber <= loaded.pageCount; pageNumber += 1) {
      if (cancelled) break;
      setProgress(
        (pageNumber - 1) / loaded.pageCount,
        `${pageNumber}/${loaded.pageCount}페이지 처리 중…`,
      );

      const page = await loaded.doc.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale });

      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, viewport }).promise;
      page.cleanup();

      if (toGray) {
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = image.data;
        for (let index = 0; index < data.length; index += 4) {
          const gray =
            0.299 * (data[index] as number) +
            0.587 * (data[index + 1] as number) +
            0.114 * (data[index + 2] as number);
          data[index] = gray;
          data[index + 1] = gray;
          data[index + 2] = gray;
        }
        context.putImageData(image, 0, 0);
      }

      const jpeg = await canvasToJpeg(canvas, jpegQuality);
      const embedded = await output.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
      const pdfPage = output.addPage([base.width, base.height]);
      pdfPage.drawImage(embedded, {
        x: 0,
        y: 0,
        width: base.width,
        height: base.height,
      });
    }

    setProgress(0.99, 'PDF를 저장하는 중…');
    return output.save();
  };

  const syncMethod = () => {
    const method = selectedMethod();
    if (note && current) {
      note.textContent = methodNote(method, current.hasTextLayer);
      note.classList.toggle('notice-warn', method === 'raster' && current.hasTextLayer);
    }
    if (current) {
      const limit = MAX_PAGES[method];
      status.textContent =
        current.pageCount > limit
          ? `이 방식은 한 번에 최대 ${limit}쪽까지 압축합니다. 범위를 나눠 사용하세요.`
          : '설정을 확인한 뒤 압축을 실행하세요.';
    }
  };

  preset.addEventListener('change', () => {
    syncPreset();
    clearResult();
  });
  dpi?.addEventListener('change', clearResult);
  quality?.addEventListener('input', () => {
    if (qualityValue) qualityValue.textContent = `${Math.round(Number(quality.value) * 100)}%`;
    clearResult();
  });
  grayscale?.addEventListener('change', clearResult);
  for (const item of methodInputs) {
    item.addEventListener('change', () => {
      syncMethod();
      clearResult();
    });
  }

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

  runButton.addEventListener('click', () => void run());
  cancelButton?.addEventListener('click', () => {
    cancelled = true;
    if (worker) {
      stopWorker();
      status.textContent = '중지되었습니다. 압축 파일을 만들지 않았습니다.';
    } else {
      status.textContent = '현재 페이지가 끝나면 중지합니다…';
    }
  });

  resetButton?.addEventListener('click', () => {
    if (running) return;
    void dispose();
    clearResult();
    panel.hidden = true;
    status.textContent = '';
    showError('');
    setProgress(0);
  });

  window.addEventListener('pagehide', () => {
    stopWorker();
    void dispose();
    clearResult();
  });
}
