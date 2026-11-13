import { formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';
import { isHangulFile } from '@/lib/hwpx';
import { A4_POINTS, imagesToPdf, pdfBlobUrl, pdfFileName, svgToJpeg } from '@/lib/pdf-export';
import { ensureRhwp, loadRhwpModule, type RhwpModule } from '@/lib/rhwp';

type HwpDoc = InstanceType<RhwpModule['HwpDocument']>;

interface Loaded {
  file: File;
  doc: HwpDoc;
  pageCount: number;
}

let loaded: Loaded | null = null;
let resultUrl: string | null = null;
let running = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initHwpxToPdf(): void {
  const input = byId<HTMLInputElement>('hp-input');
  const drop = byId<HTMLElement>('hp-drop');
  const panel = byId<HTMLElement>('hp-panel');
  const info = byId<HTMLElement>('hp-file-info');
  const pageCount = byId<HTMLElement>('hp-page-count');
  const progress = byId<HTMLProgressElement>('hp-progress');
  const progressText = byId<HTMLElement>('hp-progress-text');
  const convert = byId<HTMLButtonElement>('hp-convert');
  const reset = byId<HTMLButtonElement>('hp-reset');
  const result = byId<HTMLElement>('hp-result');
  const download = byId<HTMLAnchorElement>('hp-download');
  const status = byId<HTMLElement>('hp-status');
  const error = byId<HTMLElement>('hp-error');

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

  const clearDocument = () => {
    clearResult();
    loaded?.doc.free();
    loaded = null;
    if (progress) progress.value = 0;
    if (progressText) progressText.textContent = '';
    if (pageCount) pageCount.textContent = '-';
  };

  const load = async (file: File) => {
    showError('');
    clearDocument();
    panel.hidden = true;
    if (!isHangulFile(file.name)) {
      showError('HWP·HWPX 파일만 PDF로 바꿀 수 있습니다.');
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(`파일이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 더 작은 문서를 사용하세요.`);
      return;
    }

    status.textContent = '한글 문서를 불러와 페이지를 그리는 중…';
    await new Promise((resolve) => window.setTimeout(resolve, 30));
    try {
      await ensureRhwp();
      const rhwp = await loadRhwpModule();
      const doc = new rhwp.HwpDocument(new Uint8Array(await file.arrayBuffer()));
      const count = doc.pageCount();
      if (count < 1) throw new Error('페이지가 없는 문서입니다.');
      loaded = { file, doc, pageCount: count };
      if (info) info.textContent = `${file.name} · ${formatBytes(file.size)}`;
      if (pageCount) pageCount.textContent = `${count}쪽`;
      panel.hidden = false;
      convert.disabled = false;
      status.textContent = `${count}쪽을 불러왔습니다. PDF로 저장을 누르세요.`;
    } catch (cause) {
      console.error(cause);
      clearDocument();
      panel.hidden = true;
      status.textContent = '';
      showError(
        cause instanceof Error
          ? cause.message
          : '한글 문서를 읽지 못했습니다. 한글에서 다시 저장한 뒤 시도하세요.',
      );
    }
  };

  const run = async () => {
    if (!loaded || running) return;
    const current = loaded;
    running = true;
    clearResult();
    showError('');
    convert.disabled = true;
    convert.setAttribute('aria-busy', 'true');
    if (reset) reset.disabled = true;
    if (progress) {
      progress.max = current.pageCount;
      progress.value = 0;
    }
    status.textContent = 'PDF 페이지를 그리는 중…';

    try {
      const { default: DOMPurify } = await import('dompurify');
      const pages = [];
      for (let index = 0; index < current.pageCount; index += 1) {
        const raw = current.doc.renderPageSvg(index);
        const svg = DOMPurify.sanitize(raw, {
          USE_PROFILES: { svg: true, svgFilters: true },
        });
        pages.push(await svgToJpeg(svg, 1240, 0.9));
        if (progress) progress.value = index + 1;
        if (progressText) progressText.textContent = `${index + 1} / ${current.pageCount}쪽`;
        status.textContent = `${index + 1} / ${current.pageCount}쪽을 그리는 중…`;
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      const bytes = await imagesToPdf(pages, A4_POINTS, pdfFileName(current.file.name));
      resultUrl = pdfBlobUrl(bytes);
      if (download) {
        download.href = resultUrl;
        download.download = pdfFileName(current.file.name);
        download.hidden = false;
      }
      if (result) {
        result.hidden = false;
        result.focus();
      }
      status.textContent = `${current.pageCount}쪽 PDF를 만들었습니다. 아래에서 내려받으세요.`;
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
    clearDocument();
    panel.hidden = true;
    status.textContent = '';
    showError('');
    input.value = '';
    input.focus();
  });
  window.addEventListener('pagehide', clearDocument);
}
