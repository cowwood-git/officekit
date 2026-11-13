import { isWordFile } from '@/lib/docx';
import { formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';
import { A4_POINTS, elementToJpeg, imagesToPdf, pdfBlobUrl, pdfFileName } from '@/lib/pdf-export';
import { loadWordHtml, paginateWordHtml } from '@/lib/word-doc';

let resultUrl: string | null = null;
let running = false;
let host: HTMLElement | null = null;
let currentName = 'document.docx';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initDocxToPdf(): void {
  const input = byId<HTMLInputElement>('dp-input');
  const drop = byId<HTMLElement>('dp-drop');
  const panel = byId<HTMLElement>('dp-panel');
  const info = byId<HTMLElement>('dp-file-info');
  const pageCount = byId<HTMLElement>('dp-page-count');
  const progress = byId<HTMLProgressElement>('dp-progress');
  const progressText = byId<HTMLElement>('dp-progress-text');
  const convert = byId<HTMLButtonElement>('dp-convert');
  const reset = byId<HTMLButtonElement>('dp-reset');
  const result = byId<HTMLElement>('dp-result');
  const download = byId<HTMLAnchorElement>('dp-download');
  const status = byId<HTMLElement>('dp-status');
  const error = byId<HTMLElement>('dp-error');

  if (!input || !drop || !panel || !convert || !status || !error) return;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    if (download) {
      download.removeAttribute('href');
      download.hidden = true;
    }
    if (result) result.hidden = true;
  };

  const clearHost = () => {
    host?.remove();
    host = null;
  };

  const makeHost = () => {
    clearHost();
    const element = document.createElement('div');
    element.style.cssText =
      'position:fixed;left:-20000px;top:0;width:794px;background:#fff;z-index:-1;';
    document.body.append(element);
    host = element;
    return element;
  };

  const load = async (file: File) => {
    showError('');
    clearResult();
    clearHost();
    panel.hidden = true;
    if (!isWordFile(file.name)) {
      showError('DOC·DOCX 파일만 PDF로 바꿀 수 있습니다.');
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(`파일이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 더 작은 문서를 사용하세요.`);
      return;
    }

    currentName = file.name;
    status.textContent = '문서를 읽고 A4 페이지로 나누는 중…';
    await new Promise((resolve) => window.setTimeout(resolve, 30));
    try {
      const word = await loadWordHtml(file);
      const pages = await paginateWordHtml(word.html, makeHost());
      if (pages.length === 0) throw new Error('페이지가 없는 문서입니다.');
      if (info) info.textContent = `${file.name} · ${formatBytes(file.size)}`;
      if (pageCount) pageCount.textContent = `${pages.length}쪽`;
      panel.hidden = false;
      convert.disabled = false;
      convert.dataset.pages = String(pages.length);
      status.textContent = `${pages.length}쪽을 준비했습니다. PDF로 저장을 누르세요.`;
    } catch (cause) {
      console.error(cause);
      clearHost();
      panel.hidden = true;
      status.textContent = '';
      showError(
        cause instanceof Error
          ? cause.message
          : '문서를 읽지 못했습니다. 암호가 걸렸거나 손상된 DOC·DOCX인지 확인하세요.',
      );
    }
  };

  const run = async () => {
    if (!host || running) return;
    const pages = Array.from(host.querySelectorAll<HTMLElement>('.docx-page'));
    if (pages.length === 0) return;
    running = true;
    clearResult();
    showError('');
    convert.disabled = true;
    convert.setAttribute('aria-busy', 'true');
    if (reset) reset.disabled = true;
    if (progress) {
      progress.max = pages.length;
      progress.value = 0;
    }
    status.textContent = 'PDF 페이지를 그리는 중…';

    try {
      await document.fonts.ready;
      const images = [];
      let index = 0;
      for (const page of pages) {
        for (const image of page.querySelectorAll('img')) {
          if (!image.complete) {
            await new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            });
          }
        }
        images.push(await elementToJpeg(page, 794, 1123, 1.6, 0.9));
        index += 1;
        if (progress) progress.value = index;
        if (progressText) progressText.textContent = `${index} / ${pages.length}쪽`;
        status.textContent = `${index} / ${pages.length}쪽을 그리는 중…`;
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      const bytes = await imagesToPdf(images, A4_POINTS, pdfFileName(currentName));
      resultUrl = pdfBlobUrl(bytes);
      if (download) {
        download.href = resultUrl;
        download.download = pdfFileName(currentName);
        download.hidden = false;
      }
      if (result) {
        result.hidden = false;
        result.focus();
      }
      status.textContent = `${pages.length}쪽 PDF를 만들었습니다. 아래에서 내려받으세요.`;
    } catch (cause) {
      console.error(cause);
      showError(
        cause instanceof Error
          ? cause.message
          : 'PDF를 만들지 못했습니다. 문서가 너무 크면 나눠서 시도하세요.',
      );
      status.textContent = '';
    } finally {
      running = false;
      convert.disabled = false;
      convert.removeAttribute('aria-busy');
      if (reset) reset.disabled = false;
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
    if (file) void load(file);
  });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void load(file);
    input.value = '';
  });
  convert.addEventListener('click', () => void run());
  reset?.addEventListener('click', () => {
    clearResult();
    clearHost();
    panel.hidden = true;
    status.textContent = '';
    showError('');
    input.value = '';
    input.focus();
  });
  window.addEventListener('pagehide', () => {
    clearResult();
    clearHost();
  });
}
