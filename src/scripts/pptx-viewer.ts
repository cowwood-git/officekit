import type { PptxViewer as PptxViewerType, SlideHandle } from '@aiden0z/pptx-renderer';
import { formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';

type WebPptPresentation = import('@web-ppt/core').Presentation;

interface LegacyState {
  presentation: WebPptPresentation;
  slides: HTMLElement[];
  index: number;
  zoom: number;
}

let viewer: PptxViewerType | null = null;
let legacy: LegacyState | null = null;
let viewerLayout: 'single' | 'spread' = 'single';
let spreadHandles: SlideHandle[] = [];

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPptxViewer(): void {
  const input = byId<HTMLInputElement>('pv-input');
  const drop = byId<HTMLElement>('pv-drop');
  const panel = byId<HTMLElement>('pv-panel');
  const info = byId<HTMLElement>('pv-file-info');
  const container = byId<HTMLElement>('pv-viewer');
  const page = byId<HTMLElement>('pv-page');
  const prev = byId<HTMLButtonElement>('pv-prev');
  const next = byId<HTMLButtonElement>('pv-next');
  const zoom = byId<HTMLSelectElement>('pv-zoom');
  const layoutSelect = byId<HTMLSelectElement>('pv-layout');
  const spread = byId<HTMLElement>('pv-spread');
  const slideCount = byId<HTMLElement>('pv-slide-count');
  const status = byId<HTMLElement>('pv-status');
  const error = byId<HTMLElement>('pv-error');
  const clearButton = byId<HTMLButtonElement>('pv-clear');

  if (!input || !drop || !panel || !container || !status || !error) return;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const updateNav = () => {
    if (legacy) {
      const count = legacy.slides.length;
      if (page) {
        page.textContent =
          viewerLayout === 'spread' && legacy.index + 2 <= count
            ? `${legacy.index + 1}–${legacy.index + 2} / ${count}`
            : `${legacy.index + 1} / ${count}`;
      }
      if (prev) prev.disabled = legacy.index <= 0;
      if (next) next.disabled = legacy.index + (viewerLayout === 'spread' ? 2 : 1) >= count;
      return;
    }
    if (!viewer) return;
    const count = viewer.slideCount;
    const index = viewer.currentSlideIndex;
    if (page) {
      page.textContent =
        viewerLayout === 'spread' && index + 2 <= count
          ? `${index + 1}–${index + 2} / ${count}`
          : `${index + 1} / ${count}`;
    }
    if (prev) prev.disabled = index <= 0;
    if (next) next.disabled = index + (viewerLayout === 'spread' ? 2 : 1) >= count;
  };

  const clearSpread = () => {
    for (const handle of spreadHandles) handle.dispose();
    spreadHandles = [];
    spread?.replaceChildren();
  };

  const destroy = () => {
    clearSpread();
    if (viewer) {
      viewer.destroy();
      viewer = null;
    }
    if (legacy) {
      legacy.presentation.dispose?.();
      legacy = null;
    }
    viewerLayout = 'single';
    container.dataset.layout = 'single';
    container.hidden = false;
    if (spread) spread.hidden = true;
    container.replaceChildren();
  };

  const renderSpread = () => {
    if (!viewer || !spread) return;
    if (viewerLayout !== 'spread') {
      container.hidden = false;
      spread.hidden = true;
      container.dataset.layout = 'single';
      clearSpread();
      return;
    }
    container.hidden = true;
    spread.hidden = false;
    clearSpread();
    const count = viewer.slideCount;
    const start = viewer.currentSlideIndex;
    const indices = [start, start + 1].filter((index) => index < count);
    const cellWidth = Math.max(160, (spread.clientWidth - 24) / 2);
    const scale = (cellWidth / viewer.slideWidth) * (Number(zoom?.value ?? 100) / 100);
    for (const index of indices) {
      const cell = document.createElement('div');
      cell.className = 'pv-spread-cell';
      spread.append(cell);
      const handle = viewer.renderSlideToContainer(index, cell, scale);
      if (handle) spreadHandles.push(handle);
    }
    updateNav();
  };

  const goToLegacy = (index: number) => {
    if (!legacy) return;
    const target = Math.min(legacy.slides.length - 1, Math.max(0, index));
    legacy.index = target;
    container.dataset.layout = viewerLayout;
    legacy.slides.forEach((slide, slideIndex) => {
      slide.hidden =
        viewerLayout === 'spread'
          ? slideIndex !== target && slideIndex !== target + 1
          : slideIndex !== target;
    });
    updateNav();
  };

  const applyLegacyZoom = () => {
    if (!legacy) return;
    for (const slide of legacy.slides) {
      slide.style.width = `${legacy.zoom * 100}%`;
    }
  };

  const loadLegacy = async (file: File) => {
    status.textContent = '구형 PPT(97-2003)를 읽는 중…';
    try {
      const [{ parse, renderSlideToSvg }, { default: DOMPurify }] = await Promise.all([
        import('@web-ppt/core'),
        import('dompurify'),
      ]);
      const presentation = await parse(await file.arrayBuffer());
      const svgs = presentation.slides.map((slide) =>
        renderSlideToSvg(presentation, slide, { textMode: 'svg', media: 'badge' }),
      );

      container.replaceChildren();
      const slides = svgs.map((svg, index) => {
        const element = document.createElement('div');
        element.className = 'pv-svg-slide';
        element.dataset.index = String(index);
        element.hidden = index !== 0;
        element.innerHTML = DOMPurify.sanitize(svg, {
          USE_PROFILES: { svg: true, svgFilters: true },
        });
        container.append(element);
        return element;
      });

      legacy = { presentation, slides, index: 0, zoom: 1 };
      viewer = null;
      if (info) info.textContent = `${file.name} · ${formatBytes(file.size)} · PPT 97-2003`;
      if (slideCount) slideCount.textContent = String(slides.length);
      panel.hidden = false;
      applyLegacyZoom();
      goToLegacy(0);
      status.textContent = `${slides.length}장을 불러왔습니다. ←/→로 슬라이드를 넘겨 보세요.`;
    } catch (cause) {
      console.error(cause);
      destroy();
      panel.hidden = true;
      status.textContent = '';
      showError(
        cause instanceof Error
          ? cause.message
          : '구형 PPT를 읽지 못했습니다. PowerPoint에서 .pptx로 저장한 뒤 시도하세요.',
      );
    }
  };

  const load = async (file: File) => {
    showError('');
    panel.hidden = true;
    destroy();
    viewerLayout = 'single';
    if (layoutSelect) layoutSelect.value = 'single';
    if (spread) spread.hidden = true;

    if (!/\.pptx?$/i.test(file.name)) {
      showError('PPT·PPTX 파일만 열 수 있습니다.');
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(
        `파일이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 더 작은 발표 자료를 사용하세요.`,
      );
      return;
    }

    if (/\.ppt$/i.test(file.name)) {
      await loadLegacy(file);
      return;
    }

    status.textContent = '슬라이드를 읽는 중…';
    try {
      const { PptxViewer, RECOMMENDED_ZIP_LIMITS } = await import('@aiden0z/pptx-renderer');
      const instance = new PptxViewer(container, {
        fitMode: 'contain',
        pdfjs: false,
        externalMedia: 'block',
        zipLimits: RECOMMENDED_ZIP_LIMITS,
        onSlideChange: () => updateNav(),
        onSlideError: (index, cause) => {
          console.warn(`슬라이드 ${index + 1}을 그리지 못했습니다.`, cause);
        },
      });
      viewer = instance;
      await instance.open(await file.arrayBuffer(), {
        renderMode: 'slide',
        lazyMedia: true,
        lazySlides: true,
      });
      viewer = instance;
      if (info) info.textContent = `${file.name} · ${formatBytes(file.size)}`;
      if (slideCount) slideCount.textContent = String(instance.slideCount);
      panel.hidden = false;
      updateNav();
      status.textContent = `${instance.slideCount}장을 불러왔습니다. ←/→로 슬라이드를 넘겨 보세요.`;
    } catch (cause) {
      console.error(cause);
      destroy();
      panel.hidden = true;
      status.textContent = '';
      showError(
        cause instanceof Error
          ? cause.message
          : 'PPTX를 읽지 못했습니다. PowerPoint에서 다시 저장한 뒤 시도하세요.',
      );
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

  prev?.addEventListener('click', () => {
    const step = viewerLayout === 'spread' ? 2 : 1;
    if (legacy) {
      goToLegacy(legacy.index - step);
      return;
    }
    if (!viewer) return;
    void viewer.goToSlide(Math.max(0, viewer.currentSlideIndex - step)).then(() => {
      if (viewerLayout === 'spread') renderSpread();
    });
  });
  next?.addEventListener('click', () => {
    const step = viewerLayout === 'spread' ? 2 : 1;
    if (legacy) {
      goToLegacy(legacy.index + step);
      return;
    }
    if (!viewer) return;
    void viewer
      .goToSlide(Math.min(viewer.slideCount - 1, viewer.currentSlideIndex + step))
      .then(() => {
        if (viewerLayout === 'spread') renderSpread();
      });
  });
  zoom?.addEventListener('change', () => {
    if (legacy) {
      legacy.zoom = Number(zoom.value) / 100;
      applyLegacyZoom();
      return;
    }
    if (!viewer) return;
    if (viewerLayout === 'spread') {
      renderSpread();
      return;
    }
    void viewer.setZoom(Number(zoom.value));
  });

  layoutSelect?.addEventListener('change', () => {
    viewerLayout = layoutSelect.value === 'spread' ? 'spread' : 'single';
    if (legacy) {
      container.dataset.layout = viewerLayout;
      const start =
        viewerLayout === 'spread' && legacy.index % 2 !== 0 ? legacy.index - 1 : legacy.index;
      goToLegacy(start);
      return;
    }
    if (!viewer) return;
    if (viewerLayout === 'spread' && viewer.currentSlideIndex % 2 !== 0) {
      void viewer.goToSlide(viewer.currentSlideIndex - 1).then(() => renderSpread());
      return;
    }
    renderSpread();
  });

  clearButton?.addEventListener('click', () => {
    destroy();
    panel.hidden = true;
    status.textContent = '';
    showError('');
    input.value = '';
    input.focus();
  });

  window.addEventListener('pagehide', destroy);
}
