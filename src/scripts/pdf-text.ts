import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import { planPages } from '@/lib/pdf-image';
import { combinePages, type PageText, pageText, textFileName, textStats } from '@/lib/pdf-text';

interface Loaded {
  file: File;
  task: PDFDocumentLoadingTask;
  doc: PDFDocumentProxy;
  pageCount: number;
}

const MAX_PAGES = 500;

let current: Loaded | null = null;
let textUrl: string | null = null;
let running = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfText(): void {
  const input = byId<HTMLInputElement>('pt-input');
  const drop = byId<HTMLElement>('pt-drop');
  const panel = byId<HTMLElement>('pt-panel');
  const fileInfo = byId<HTMLElement>('pt-file-info');
  const rangeInput = byId<HTMLInputElement>('pt-range');
  const markers = byId<HTMLInputElement>('pt-markers');
  const extractButton = byId<HTMLButtonElement>('pt-extract');
  const resetButton = byId<HTMLButtonElement>('pt-reset');
  const output = byId<HTMLTextAreaElement>('pt-output');
  const copyButton = byId<HTMLButtonElement>('pt-copy');
  const download = byId<HTMLAnchorElement>('pt-download');
  const status = byId<HTMLElement>('pt-status');
  const error = byId<HTMLElement>('pt-error');
  const stats = {
    characters: byId<HTMLElement>('pt-characters'),
    lines: byId<HTMLElement>('pt-lines'),
    pages: byId<HTMLElement>('pt-pages'),
  };

  if (
    !input ||
    !drop ||
    !panel ||
    !rangeInput ||
    !markers ||
    !extractButton ||
    !output ||
    !status ||
    !error
  ) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearText = () => {
    output.value = '';
    if (textUrl) {
      URL.revokeObjectURL(textUrl);
      textUrl = null;
    }
    download?.removeAttribute('href');
    if (download) download.hidden = true;
    for (const value of Object.values(stats)) {
      if (value) value.textContent = '0';
    }
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

  const updateDownloads = (text: string, fileName: string) => {
    if (textUrl) URL.revokeObjectURL(textUrl);
    textUrl = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    if (download) {
      download.href = textUrl;
      download.download = fileName;
      download.textContent = `TXT 내려받기 (${formatBytes(new Blob([text]).size)})`;
      download.hidden = false;
    }
  };

  const extract = async () => {
    const loaded = current;
    if (!loaded || running) return;
    const plan = planPages(rangeInput.value, loaded.pageCount);
    if (plan.errors.length > 0) {
      showError(plan.errors.join(' '));
      return;
    }

    showError('');
    clearText();
    running = true;
    extractButton.disabled = true;
    extractButton.setAttribute('aria-busy', 'true');
    if (resetButton) resetButton.disabled = true;

    try {
      const pages: PageText[] = [];
      for (let index = 0; index < plan.pages.length; index += 1) {
        const pageNumber = plan.pages[index];
        if (pageNumber === undefined) continue;
        status.textContent = `${index + 1}/${plan.pages.length}쪽 텍스트 추출 중…`;
        const page = await loaded.doc.getPage(pageNumber);
        const content = await page.getTextContent();
        const items = content.items
          .filter((item): item is typeof item & { str: string } => 'str' in item)
          .map((item) => ({ str: item.str, hasEOL: 'hasEOL' in item && Boolean(item.hasEOL) }));
        pages.push({ pageNumber, text: pageText(items) });
        page.cleanup();
      }

      const text = combinePages(pages, markers.checked);
      output.value = text;
      const summary = textStats(text);
      if (stats.characters) stats.characters.textContent = String(summary.characters);
      if (stats.lines) stats.lines.textContent = String(summary.lines);
      if (stats.pages) stats.pages.textContent = String(pages.length);

      if (text.replace(/^--- \d+페이지 ---$/gm, '').trim() === '') {
        status.textContent = '';
        showError(
          '텍스트를 찾지 못했습니다. 스캔 이미지 PDF라면 PDF OCR 도구로 문자를 인식하세요.',
        );
      } else {
        status.textContent = `${pages.length}쪽에서 텍스트를 추출했습니다.`;
        updateDownloads(text, textFileName(loaded.file.name));
      }
    } catch (cause) {
      console.error(cause);
      showError('텍스트를 추출하지 못했습니다. 암호가 걸린 PDF인지 확인하세요.');
      status.textContent = '';
    } finally {
      running = false;
      extractButton.disabled = false;
      extractButton.removeAttribute('aria-busy');
      if (resetButton) resetButton.disabled = false;
    }
  };

  const acceptFile = async (file: File) => {
    if (running) return;
    showError('');
    clearText();
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
      status.textContent = '범위를 확인하고 텍스트 추출을 누르세요.';
    } catch (cause) {
      console.error(cause);
      current = null;
      panel.hidden = true;
      showError('PDF를 열 수 없습니다. 암호가 걸렸거나 손상된 파일인지 확인하세요.');
      status.textContent = '';
    }
  };

  extractButton.addEventListener(
    'click',
    () => void doWork(extractButton, extract, { expectResult: false }),
  );

  copyButton?.addEventListener('click', async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '전체 복사';
      }, 1500);
    } catch {
      status.textContent = '자동 복사가 차단되었습니다. 텍스트를 선택해 복사하세요.';
    }
  });

  resetButton?.addEventListener('click', () => {
    void dispose();
    clearText();
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

  window.addEventListener('pagehide', () => {
    if (textUrl) URL.revokeObjectURL(textUrl);
    void dispose();
  });
}
