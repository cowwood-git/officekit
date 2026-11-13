import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { RESULT_EVENT } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import { normalizeOcrText, type OcrLanguage, ocrCharCount, textForDownload } from '@/lib/ocr';
import { planPages } from '@/lib/pdf-image';
import {
  averageConfidence,
  combinePageTexts,
  MAX_OCR_PAGES,
  overallProgress,
  pdfOcrFileName,
} from '@/lib/pdf-ocr';
import { disposeOcr, ocrStatusLabel, recognizeCanvas } from './ocr-client';

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

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfOcr(): void {
  const input = byId<HTMLInputElement>('po-input');
  const drop = byId<HTMLElement>('po-drop');
  const panel = byId<HTMLElement>('po-panel');
  const info = byId<HTMLElement>('po-file-info');
  const note = byId<HTMLElement>('po-note');
  const range = byId<HTMLInputElement>('po-range');
  const dpi = byId<HTMLSelectElement>('po-dpi');
  const language = byId<HTMLSelectElement>('po-language');
  const runButton = byId<HTMLButtonElement>('po-run');
  const cancelButton = byId<HTMLButtonElement>('po-cancel');
  const resetButton = byId<HTMLButtonElement>('po-reset');
  const progress = byId<HTMLProgressElement>('po-progress');
  const status = byId<HTMLElement>('po-status');
  const error = byId<HTMLElement>('po-error');
  const result = byId<HTMLElement>('po-result');
  const textArea = byId<HTMLTextAreaElement>('po-text');
  const confidence = byId<HTMLElement>('po-confidence');
  const chars = byId<HTMLElement>('po-chars');
  const copyButton = byId<HTMLButtonElement>('po-copy');
  const download = byId<HTMLAnchorElement>('po-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !range ||
    !runButton ||
    !progress ||
    !status ||
    !error ||
    !result ||
    !textArea
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

  const syncChars = () => {
    if (chars) chars.textContent = `${ocrCharCount(textArea.value)}자`;
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
      if (note) {
        note.hidden = !hasTextLayer;
        note.textContent = hasTextLayer
          ? '이 PDF에는 텍스트 레이어가 있는 것 같습니다. 스캔본이 아니라면 OCR 없이 텍스트를 복사하는 편이 더 정확합니다.'
          : '';
      }
      if (range) {
        range.value = '';
        range.placeholder = `비우면 전체 (최대 ${MAX_OCR_PAGES}쪽)`;
      }
      panel.hidden = false;
      status.textContent = `페이지당 5~20초 걸립니다. 최대 ${MAX_OCR_PAGES}쪽까지 한 번에 처리합니다.`;
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
    clearResult();
    showError('');

    const planned = planPages(range.value, loaded.pageCount);
    if (planned.errors.length > 0) {
      showError(planned.errors.join(' '));
      return;
    }
    if (planned.pages.length === 0) {
      showError('처리할 페이지가 없습니다.');
      return;
    }
    if (planned.pages.length > MAX_OCR_PAGES) {
      showError(
        [`한 번에 최대 ${MAX_OCR_PAGES}쪽까지 처리합니다. 범위를 나눠 실행하세요.`].join(' '),
      );
      return;
    }

    const selectedLang = (language?.value as OcrLanguage) ?? 'kor+eng';
    const dpiValue = Number(dpi?.value ?? 200);
    const scale = Math.min(300, Math.max(72, dpiValue)) / 72;

    running = true;
    cancelled = false;
    runButton.disabled = true;
    runButton.setAttribute('aria-busy', 'true');
    if (cancelButton) cancelButton.hidden = false;
    if (resetButton) resetButton.disabled = true;
    setProgress(0.01, '준비 중…');

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const collected: Array<{ page: number; text: string }> = [];
    const confidences: number[] = [];
    const failures: number[] = [];

    try {
      for (let index = 0; index < planned.pages.length; index += 1) {
        if (cancelled) break;
        const pageNumber = planned.pages[index] as number;
        status.textContent = `${index + 1}/${planned.pages.length}페이지 렌더링 중…`;

        try {
          const page = await loaded.doc.getPage(pageNumber);
          const viewport = page.getViewport({ scale });
          canvas.width = Math.max(1, Math.ceil(viewport.width));
          canvas.height = Math.max(1, Math.ceil(viewport.height));
          if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, viewport }).promise;
          page.cleanup();
          status.textContent = `${index + 1}/${planned.pages.length}페이지 인식 준비 중…`;

          const ocr = await recognizeCanvas(canvas, selectedLang, (message) => {
            const label = ocrStatusLabel(message.status);
            const percent = Math.round((message.progress ?? 0) * 100);
            setProgress(
              overallProgress(index, planned.pages.length, message.progress ?? 0),
              `${index + 1}/${planned.pages.length}페이지 · ${label} ${percent}%`,
            );
          });

          collected.push({ page: pageNumber, text: normalizeOcrText(ocr.text) });
          confidences.push(ocr.confidence);

          textArea.value = combinePageTexts(collected) || '(인식 중…)';
          syncChars();
          setProgress(
            overallProgress(index + 1, planned.pages.length, 0),
            `${index + 1}/${planned.pages.length}페이지 완료`,
          );
        } catch (cause) {
          console.error(`page ${pageNumber}`, cause);
          failures.push(pageNumber);
        }
      }

      const combined = combinePageTexts(collected);
      textArea.value = combined || '(인식된 텍스트가 없습니다)';
      syncChars();
      if (confidence) confidence.textContent = `${averageConfidence(confidences)}%`;

      if (combined) {
        const textBlob = new Blob([textForDownload(combined)], {
          type: 'text/plain;charset=utf-8',
        });
        resultUrl = URL.createObjectURL(textBlob);
        if (download) {
          download.href = resultUrl;
          download.download = pdfOcrFileName(loaded.file.name);
          download.textContent = `텍스트 내려받기 (${formatBytes(textBlob.size)})`;
          download.hidden = false;
        }
      }

      result.hidden = false;
      // 빈 결과 화면에는 광고를 띄우지 않는다(docs/ad-policy.md).
      if (combined) window.dispatchEvent(new CustomEvent(RESULT_EVENT));
      if (failures.length > 0) {
        showError(`${failures.length}페이지를 인식하지 못했습니다: ${failures.join(', ')}쪽`);
      }
      status.textContent = cancelled
        ? '중지되었습니다. 지금까지 인식한 텍스트를 내려받을 수 있습니다.'
        : combined
          ? '완료했습니다. 텍스트를 복사하거나 TXT로 내려받으세요.'
          : '텍스트를 찾지 못했습니다. 해상도를 높이거나 페이지 범위를 조정해 보세요.';
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      setProgress(0);
      showError(
        'PDF OCR에 실패했습니다. 첫 실행은 언어 데이터를 내려받느라 시간이 걸릴 수 있습니다.',
      );
      status.textContent = '';
    } finally {
      running = false;
      runButton.disabled = false;
      runButton.removeAttribute('aria-busy');
      if (cancelButton) cancelButton.hidden = true;
      if (resetButton) resetButton.disabled = false;
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

  runButton.addEventListener('click', () => void run());

  cancelButton?.addEventListener('click', () => {
    cancelled = true;
    status.textContent = '현재 페이지가 끝나면 중지합니다…';
  });

  textArea.addEventListener('input', syncChars);

  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textArea.value);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '텍스트 복사';
      }, 1500);
    } catch {
      showError('자동 복사가 차단되었습니다. 본문을 선택해 Ctrl/Cmd+C로 복사하세요.');
    }
  });

  resetButton?.addEventListener('click', () => {
    if (running) return;
    void dispose();
    clearResult();
    panel.hidden = true;
    status.textContent = '';
    showError('');
    textArea.value = '';
    syncChars();
  });

  window.addEventListener('pagehide', () => {
    void dispose();
    void disposeOcr();
    clearResult();
  });
}
