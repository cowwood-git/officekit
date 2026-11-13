import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { doWork } from '@/lib/do-work';
import { formatBytes, safeFileName, validatePdfSelection } from '@/lib/files';
import { pageFileName, planPages } from '@/lib/pdf-image';

interface Loaded {
  file: File;
  task: PDFDocumentLoadingTask;
  doc: PDFDocumentProxy;
  pageCount: number;
}

let current: Loaded | null = null;
let resultUrl: string | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('JPG로 변환하지 못했습니다.'));
      },
      'image/jpeg',
      quality,
    );
  });
}

export function initPdfToJpg(): void {
  const input = byId<HTMLInputElement>('pj-input');
  const drop = byId<HTMLElement>('pj-drop');
  const panel = byId<HTMLElement>('pj-panel');
  const fileInfo = byId<HTMLElement>('pj-file-info');
  const rangeInput = byId<HTMLInputElement>('pj-range');
  const dpiSelect = byId<HTMLSelectElement>('pj-dpi');
  const qualitySelect = byId<HTMLSelectElement>('pj-quality');
  const convertButton = byId<HTMLButtonElement>('pj-convert');
  const resetButton = byId<HTMLButtonElement>('pj-reset');
  const status = byId<HTMLElement>('pj-status');
  const error = byId<HTMLElement>('pj-error');
  const result = byId<HTMLElement>('pj-result');
  const resultSummary = byId<HTMLElement>('pj-result-summary');
  const download = byId<HTMLAnchorElement>('pj-download');

  if (!input || !drop || !panel || !convertButton || !status || !error || !result) return;

  const showError = (messages: string[]) => {
    error.hidden = messages.length === 0;
    error.textContent = messages.join(' ');
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

  const acceptFile = async (file: File) => {
    clearResult();
    showError([]);
    await dispose();

    const validation = validatePdfSelection([file]);
    if (!validation.ok) {
      showError(validation.errors);
      return;
    }

    status.textContent = 'PDF를 여는 중…';
    try {
      const bytes = await file.arrayBuffer();
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

      const task = pdfjs.getDocument({
        data: new Uint8Array(bytes),
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        wasmUrl: '/pdfjs/wasm/',
        iccUrl: '/pdfjs/iccs/',
      });
      const doc = await task.promise;

      current = { file, task, doc, pageCount: doc.numPages };
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${doc.numPages}쪽 · ${formatBytes(file.size)}`;
      }
      if (rangeInput) {
        rangeInput.value = '';
        rangeInput.placeholder = `비우면 전체 (1-${doc.numPages})`;
      }
      panel.hidden = false;
      status.textContent = '';
    } catch (cause) {
      console.error(cause);
      current = null;
      panel.hidden = true;
      showError([
        'PDF를 열 수 없습니다. 암호가 걸렸거나 손상된 파일인지 확인하세요. 암호를 모르면 열 수 없습니다.',
      ]);
      status.textContent = '';
    }
  };

  const convert = async () => {
    const loaded = current;
    if (!loaded) return;
    clearResult();
    showError([]);

    const pages = planPages(rangeInput?.value ?? '', loaded.pageCount);
    if (pages.errors.length > 0) {
      showError(pages.errors);
      return;
    }
    if (pages.pages.length > 100) {
      showError(['한 번에 최대 100페이지까지 변환할 수 있습니다. 범위를 나눠 실행하세요.']);
      return;
    }

    const dpi = Number(dpiSelect?.value ?? 144);
    const quality = Number(qualitySelect?.value ?? 0.92);
    const scale = Math.min(300, Math.max(36, dpi)) / 72;

    convertButton.disabled = true;
    convertButton.setAttribute('aria-busy', 'true');
    status.textContent = '페이지를 준비하는 중…';

    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('캔버스를 사용할 수 없습니다.');

      const outputs: Array<{ name: string; blob: Blob }> = [];

      for (let index = 0; index < pages.pages.length; index += 1) {
        const pageNumber = pages.pages[index] as number;
        status.textContent = `${index + 1}/${pages.pages.length} 변환 중… (${pageNumber}쪽)`;

        const page = await loaded.doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, viewport }).promise;
        page.cleanup();

        const blob = await canvasToJpeg(canvas, quality);
        outputs.push({ name: pageFileName(pageNumber, loaded.pageCount), blob });
      }

      let finalBlob: Blob;
      let finalName: string;
      const base = safeFileName(loaded.file.name.replace(/\.pdf$/i, '')) || 'document';

      if (outputs.length === 1) {
        const only = outputs[0] as { name: string; blob: Blob };
        finalBlob = only.blob;
        finalName = `${base}-${only.name}`;
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const output of outputs) zip.file(output.name, output.blob);
        finalBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        finalName = `${base}-jpg.zip`;
      }

      resultUrl = URL.createObjectURL(finalBlob);
      if (download) {
        download.href = resultUrl;
        download.download = finalName;
        download.textContent = `결과 내려받기 (${formatBytes(finalBlob.size)})`;
        download.hidden = false;
      }
      if (resultSummary) {
        resultSummary.textContent =
          outputs.length === 1
            ? `JPG 1장 · ${formatBytes(finalBlob.size)}`
            : `${outputs.length}장 · ${formatBytes(finalBlob.size)}`;
      }

      result.hidden = false;
      status.textContent = '완료했습니다. 아래에서 내려받으세요.';
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError(['변환 중 문제가 발생했습니다. 페이지 수나 해상도를 낮춰 다시 시도하세요.']);
      status.textContent = '';
    } finally {
      convertButton.disabled = false;
      convertButton.removeAttribute('aria-busy');
    }
  };

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

  convertButton.addEventListener('click', () => void doWork(convertButton, convert));

  resetButton?.addEventListener('click', () => {
    void dispose();
    clearResult();
    showError([]);
    status.textContent = '';
    panel.hidden = true;
    if (fileInfo) fileInfo.textContent = '';
    if (rangeInput) rangeInput.value = '';
  });

  window.addEventListener('pagehide', () => {
    void dispose();
    clearResult();
  });
}
