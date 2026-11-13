import type { PptxViewer as PptxViewerType } from '@aiden0z/pptx-renderer';
import { formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';
import {
  elementToJpeg,
  imagesToPdf,
  pdfBlobUrl,
  pdfFileName,
  type RasterPage,
  svgToJpeg,
} from '@/lib/pdf-export';

interface LoadedPptx {
  kind: 'pptx';
  file: File;
  viewer: PptxViewerType;
  host: HTMLElement;
  width: number;
  height: number;
}

interface LoadedLegacy {
  kind: 'ppt';
  file: File;
  slides: string[];
  width: number;
  height: number;
}

type Loaded = LoadedPptx | LoadedLegacy;

let loaded: Loaded | null = null;
let resultUrl: string | null = null;
let running = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  );
}

function svgSize(svg: string): { width: number; height: number } {
  const match = svg.match(/<svg[^>]*\bwidth="([\d.]+)"[^>]*\bheight="([\d.]+)"/i);
  if (match) {
    const width = Number(match[1]);
    const height = Number(match[2]);
    if (width > 0 && height > 0) return { width, height };
  }
  return { width: 960, height: 540 };
}

export function initPptxToPdf(): void {
  const input = byId<HTMLInputElement>('tp-input');
  const drop = byId<HTMLElement>('tp-drop');
  const panel = byId<HTMLElement>('tp-panel');
  const info = byId<HTMLElement>('tp-file-info');
  const slideCount = byId<HTMLElement>('tp-slide-count');
  const progress = byId<HTMLProgressElement>('tp-progress');
  const progressText = byId<HTMLElement>('tp-progress-text');
  const convert = byId<HTMLButtonElement>('tp-convert');
  const reset = byId<HTMLButtonElement>('tp-reset');
  const result = byId<HTMLElement>('tp-result');
  const download = byId<HTMLAnchorElement>('tp-download');
  const status = byId<HTMLElement>('tp-status');
  const error = byId<HTMLElement>('tp-error');

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
    if (loaded?.kind === 'pptx') {
      loaded.viewer.destroy();
      loaded.host.remove();
    }
    loaded = null;
    if (progress) progress.value = 0;
    if (progressText) progressText.textContent = '';
    if (slideCount) slideCount.textContent = '-';
  };

  const load = async (file: File) => {
    showError('');
    clearDocument();
    panel.hidden = true;
    if (!/\.pptx?$/i.test(file.name)) {
      showError('PPT·PPTX 파일만 PDF로 바꿀 수 있습니다.');
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(
        `파일이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 더 작은 발표 자료를 사용하세요.`,
      );
      return;
    }

    status.textContent = '슬라이드를 읽는 중…';
    await new Promise((resolve) => window.setTimeout(resolve, 30));
    try {
      if (/\.ppt$/i.test(file.name)) {
        const [{ parse, renderSlideToSvg }, { default: DOMPurify }] = await Promise.all([
          import('@web-ppt/core'),
          import('dompurify'),
        ]);
        const presentation = await parse(await file.arrayBuffer());
        const slides = presentation.slides.map((slide) =>
          DOMPurify.sanitize(renderSlideToSvg(presentation, slide, { textMode: 'svg' }), {
            USE_PROFILES: { svg: true, svgFilters: true },
          }),
        );
        if (slides.length === 0) throw new Error('슬라이드가 없는 발표 자료입니다.');
        const size = svgSize(slides[0] ?? '');
        loaded = { kind: 'ppt', file, slides, width: size.width, height: size.height };
        if (slideCount) slideCount.textContent = `${slides.length}장`;
      } else {
        const { PptxViewer, RECOMMENDED_ZIP_LIMITS } = await import('@aiden0z/pptx-renderer');
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;left:-20000px;top:0;background:#fff;';
        document.body.append(host);
        const viewer = new PptxViewer(host, {
          fitMode: 'contain',
          pdfjs: false,
          externalMedia: 'block',
          zipLimits: RECOMMENDED_ZIP_LIMITS,
        });
        try {
          await viewer.open(await file.arrayBuffer(), {
            renderMode: 'slide',
            lazyMedia: false,
            lazySlides: false,
          });
        } catch (cause) {
          viewer.destroy();
          host.remove();
          throw cause;
        }
        if (viewer.slideCount < 1) {
          viewer.destroy();
          host.remove();
          throw new Error('슬라이드가 없는 발표 자료입니다.');
        }
        loaded = {
          kind: 'pptx',
          file,
          viewer,
          host,
          width: viewer.slideWidth,
          height: viewer.slideHeight,
        };
        if (slideCount) slideCount.textContent = `${viewer.slideCount}장`;
      }

      if (info) info.textContent = `${file.name} · ${formatBytes(file.size)}`;
      panel.hidden = false;
      convert.disabled = false;
      const count = loaded.kind === 'ppt' ? loaded.slides.length : loaded.viewer.slideCount;
      status.textContent = `${count}장을 준비했습니다. PDF로 저장을 누르세요.`;
    } catch (cause) {
      console.error(cause);
      clearDocument();
      panel.hidden = true;
      status.textContent = '';
      showError(
        cause instanceof Error
          ? cause.message
          : '발표 자료를 읽지 못했습니다. PowerPoint에서 다시 저장한 뒤 시도하세요.',
      );
    }
  };

  const renderPptxSlides = async (
    current: LoadedPptx,
  ): Promise<{ pages: RasterPage[]; count: number }> => {
    const pages: RasterPage[] = [];
    const count = current.viewer.slideCount;
    for (let index = 0; index < count; index += 1) {
      const cell = document.createElement('div');
      cell.style.width = `${current.width}px`;
      cell.style.height = `${current.height}px`;
      cell.style.background = '#ffffff';
      current.host.append(cell);
      const handle = current.viewer.renderSlideToContainer(index, cell, 1);
      if (!handle) {
        cell.remove();
        continue;
      }
      await handle.ready;
      await waitForImages(cell);
      pages.push(await elementToJpeg(cell, current.width, current.height, 1.5, 0.9));
      handle.dispose();
      cell.remove();
      if (progress) progress.value = index + 1;
      if (progressText) progressText.textContent = `${index + 1} / ${count}장`;
      status.textContent = `${index + 1} / ${count}장을 그리는 중…`;
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
    return { pages, count };
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
    status.textContent = 'PDF 페이지를 그리는 중…';

    try {
      let pages: RasterPage[] = [];
      let count = 0;
      let pageWidth = 960;
      let pageHeight = 540;

      if (current.kind === 'ppt') {
        count = current.slides.length;
        if (progress) progress.max = count;
        pageWidth = 960;
        pageHeight = (960 * current.height) / current.width;
        for (let index = 0; index < current.slides.length; index += 1) {
          pages.push(await svgToJpeg(current.slides[index] ?? '', 1920, 0.9));
          if (progress) progress.value = index + 1;
          if (progressText) progressText.textContent = `${index + 1} / ${count}장`;
          status.textContent = `${index + 1} / ${count}장을 그리는 중…`;
          await new Promise((resolve) => window.setTimeout(resolve, 0));
        }
      } else {
        count = current.viewer.slideCount;
        pageWidth = current.width * 0.75;
        pageHeight = current.height * 0.75;
        if (progress) progress.max = count;
        await document.fonts.ready;
        const rendered = await renderPptxSlides(current);
        pages = rendered.pages;
        count = rendered.count;
      }

      if (pages.length === 0) throw new Error('PDF로 만들 슬라이드가 없습니다.');
      const bytes = await imagesToPdf(
        pages,
        { width: pageWidth, height: pageHeight },
        pdfFileName(current.file.name),
      );
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
      status.textContent = `${count}장 PDF를 만들었습니다. 아래에서 내려받으세요.`;
    } catch (cause) {
      console.error(cause);
      showError(
        cause instanceof Error
          ? cause.message
          : 'PDF를 만들지 못했습니다. 발표 자료가 너무 크면 나눠서 시도하세요.',
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
