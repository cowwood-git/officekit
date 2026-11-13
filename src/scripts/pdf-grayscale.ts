import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import {
  GRAY_MAX_PAGES,
  GRAY_QUALITY,
  type GrayMode,
  type GrayQuality,
  grayFileName,
  toGrayscale,
} from '@/lib/pdf-grayscale';

/** PDF 흑백 변환 — 쪽마다 그려서 회색조로 바꾼 뒤 같은 쪽 크기의 새 PDF 에 담는다. */
function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('변환 실패'))),
      'image/jpeg',
      quality,
    );
  });
}

export function initPdfGrayscale(): void {
  const input = byId<HTMLInputElement>('pg-input');
  const drop = byId<HTMLElement>('pg-drop');
  const panel = byId<HTMLElement>('pg-panel');
  const info = byId<HTMLElement>('pg-info');
  const status = byId<HTMLElement>('pg-status');
  const error = byId<HTMLElement>('pg-error');
  const quality = byId<HTMLSelectElement>('pg-quality');
  const progress = byId<HTMLProgressElement>('pg-progress');
  const apply = byId<HTMLButtonElement>('pg-apply');
  const cancel = byId<HTMLButtonElement>('pg-cancel');
  const reset = byId<HTMLButtonElement>('pg-reset');
  const result = byId<HTMLElement>('pg-result');
  const resultNote = byId<HTMLElement>('pg-result-note');
  const download = byId<HTMLAnchorElement>('pg-download');
  if (!input || !drop || !panel || !apply || !error || !status) return;

  let file: File | null = null;
  let task: PDFDocumentLoadingTask | null = null;
  let doc: PDFDocumentProxy | null = null;
  let resultUrl: string | null = null;
  let running = false;
  let cancelled = false;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    if (result) result.hidden = true;
  };

  const mode = (): GrayMode =>
    document.querySelector<HTMLInputElement>('input[name="pg-mode"]:checked')?.value === 'bw'
      ? 'bw'
      : 'gray';

  const dispose = async () => {
    await task?.destroy();
    task = null;
    doc = null;
  };

  const select = async (next: File) => {
    showError('');
    clearResult();
    const validation = validatePdfSelection([next]);
    if (!validation.ok) {
      showError(validation.errors.join(' '));
      return;
    }
    await dispose();
    status.textContent = 'PDF를 여는 중…';
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      task = pdfjs.getDocument({
        data: new Uint8Array(await next.arrayBuffer()),
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        wasmUrl: '/pdfjs/wasm/',
        iccUrl: '/pdfjs/iccs/',
      });
      doc = await task.promise;
      file = next;
      if (info) info.textContent = `${next.name} · ${doc.numPages}쪽 · ${formatBytes(next.size)}`;
      drop.hidden = true;
      panel.hidden = false;
      status.textContent =
        doc.numPages > GRAY_MAX_PAGES
          ? `한 번에 최대 ${GRAY_MAX_PAGES}쪽까지 바꿉니다. PDF 나누기로 나눈 뒤 쓰세요.`
          : '방식을 고르고 흑백으로 바꾸기를 누르세요.';
    } catch (cause) {
      console.error(cause);
      await dispose();
      status.textContent = '';
      showError('PDF를 열 수 없습니다. 암호가 걸렸다면 PDF 암호 풀기로 먼저 푸세요.');
    }
  };

  const run = async () => {
    if (!doc || !file || running) return;
    if (doc.numPages > GRAY_MAX_PAGES) return;
    showError('');
    clearResult();
    running = true;
    cancelled = false;
    apply.disabled = true;
    if (cancel) cancel.hidden = false;
    if (progress) {
      progress.hidden = false;
      progress.value = 0;
    }
    const setting =
      GRAY_QUALITY[(quality?.value as GrayQuality) ?? 'normal'] ?? GRAY_QUALITY.normal;
    const selected = mode();
    try {
      const { PDFDocument } = await import('pdf-lib');
      const output = await PDFDocument.create();
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('캔버스를 쓸 수 없습니다.');
      for (let number = 1; number <= doc.numPages; number += 1) {
        if (cancelled) break;
        status.textContent = `${number}/${doc.numPages}쪽 바꾸는 중…`;
        if (progress) progress.value = (number - 1) / doc.numPages;
        const page = await doc.getPage(number);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: setting.dpi / 72 });
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, viewport }).promise;
        page.cleanup();
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        toGrayscale(image.data, selected);
        context.putImageData(image, 0, 0);
        const jpeg = await toJpeg(canvas, setting.quality);
        const embedded = await output.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
        output.addPage([base.width, base.height]).drawImage(embedded, {
          x: 0,
          y: 0,
          width: base.width,
          height: base.height,
        });
      }
      if (cancelled) {
        status.textContent = '중지했습니다. 파일을 만들지 않았습니다.';
        return;
      }
      const bytes = await output.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = grayFileName(file.name, selected);
        download.textContent = `흑백 PDF 내려받기 (${formatBytes(blob.size)})`;
      }
      if (resultNote) {
        resultNote.textContent = `${doc.numPages}쪽 · ${formatBytes(file.size)} → ${formatBytes(blob.size)} · 쪽이 그림으로 바뀌어 글자 선택·검색은 되지 않습니다.`;
      }
      if (result) result.hidden = false;
      status.textContent = '';
    } catch (cause) {
      console.error(cause);
      showError('변환하지 못했습니다. 화질을 낮추거나 쪽을 나눠 다시 시도하세요.');
      status.textContent = '';
    } finally {
      running = false;
      apply.disabled = false;
      if (cancel) cancel.hidden = true;
      if (progress) progress.hidden = true;
    }
  };

  input.addEventListener('change', () => {
    const next = input.files?.[0];
    if (next) void select(next);
    input.value = '';
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
    const next = event.dataTransfer?.files[0];
    if (next) void select(next);
  });
  apply.addEventListener('click', () => void run());
  cancel?.addEventListener('click', () => {
    cancelled = true;
  });
  reset?.addEventListener('click', () => {
    cancelled = true;
    clearResult();
    void dispose();
    file = null;
    panel.hidden = true;
    drop.hidden = false;
    status.textContent = '';
    showError('');
  });

  window.addEventListener('pagehide', () => {
    cancelled = true;
    clearResult();
    void dispose();
    file = null;
  });
}
